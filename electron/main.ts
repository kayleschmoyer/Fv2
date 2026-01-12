import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0F0F1E',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (!app.isPackaged) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// File system operations
ipcMain.handle('create-directory', async (_, dirPath: string) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true, message: `Directory created: ${dirPath}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('check-path-exists', async (_, filePath: string) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('download-file', async (_, { url, destination }: any) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        mainWindow?.webContents.send('download-progress', percentCompleted);
      },
    });

    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ success: true }));
      writer.on('error', (error) => reject({ success: false, message: error.message }));
    });
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('copy-file', async (_, { source, destination }: any) => {
  try {
    fs.copyFileSync(source, destination);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('move-file', async (_, { source, destination }: any) => {
  try {
    fs.renameSync(source, destination);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('execute-command', async (_, command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error: any) {
    return { success: false, message: error.message, stderr: error.stderr };
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
  });

  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

// Google Drive authentication and download
ipcMain.handle('google-auth', async () => {
  try {
    // Import google auth library
    const { google } = require('googleapis');
    const { BrowserWindow } = require('electron');

    // OAuth2 configuration
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
      process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
      'http://localhost:3000/oauth2callback'
    );

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    // Create auth window
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    authWindow.loadURL(authUrl);

    // Handle the redirect
    return new Promise((resolve, reject) => {
      authWindow.webContents.on('will-redirect', async (event, url) => {
        if (url.startsWith('http://localhost:3000/oauth2callback')) {
          const urlParams = new URL(url).searchParams;
          const code = urlParams.get('code');

          if (code) {
            try {
              const { tokens } = await oauth2Client.getToken(code);
              oauth2Client.setCredentials(tokens);

              // Save tokens
              const configPath = path.join(app.getPath('userData'), 'google-tokens.json');
              fs.writeFileSync(configPath, JSON.stringify(tokens));

              authWindow.close();
              resolve({ success: true, tokens });
            } catch (error: any) {
              authWindow.close();
              reject({ success: false, message: error.message });
            }
          }
        }
      });

      authWindow.on('closed', () => {
        reject({ success: false, message: 'Authentication cancelled' });
      });
    });
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('save-credentials', async (_, credentials: any) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'credentials.json');
    fs.writeFileSync(configPath, JSON.stringify(credentials));
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-credentials', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'credentials.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { success: true, credentials: JSON.parse(data) };
    }
    return { success: false, message: 'No saved credentials found' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

// Download file from Google Drive
ipcMain.handle('download-from-drive', async (_, { fileId, destination }: any) => {
  try {
    const { google } = require('googleapis');

    // Load saved tokens
    const tokensPath = path.join(app.getPath('userData'), 'google-tokens.json');
    if (!fs.existsSync(tokensPath)) {
      return { success: false, message: 'Not authenticated. Please authenticate first.' };
    }

    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
      process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
      'http://localhost:3000/oauth2callback'
    );
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const dest = fs.createWriteStream(destination);
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      response.data
        .on('end', () => resolve({ success: true }))
        .on('error', (err: any) => reject({ success: false, message: err.message }))
        .pipe(dest);
    });
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
