import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import dotenv from 'dotenv';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

if (!app.isPackaged) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

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

ipcMain.handle('download-file', async (_, { url, destination, username, password }: any) => {
  try {
    const config: any = {
      url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        mainWindow?.webContents.send('download-progress', percentCompleted);
      },
    };

    // Add basic auth if credentials are provided
    if (username && password) {
      config.auth = {
        username,
        password,
      };
    }

    const response = await axios(config);

    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ success: true }));
      writer.on('error', (error) => reject({ success: false, message: error.message }));
    });
  } catch (error: any) {
    // Check if error is due to authentication
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return { success: false, message: 'Authentication required', needsAuth: true };
    }
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

// Prompt for credentials when needed
ipcMain.handle('prompt-credentials', async (_, { url }: any) => {
  try {
    // Create a modal window for credential input
    const credWindow = new BrowserWindow({
      width: 400,
      height: 250,
      parent: mainWindow!,
      modal: true,
      show: false,
      frame: false,
      backgroundColor: '#0F0F1E',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
      },
    });

    // Load a simple HTML form for credentials
    const credHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: #0F0F1E;
              color: white;
            }
            h3 { margin-top: 0; font-size: 16px; }
            .url { font-size: 12px; color: #888; margin-bottom: 20px; word-break: break-all; }
            input {
              width: 100%;
              padding: 8px;
              margin: 8px 0;
              background: #1a1a2e;
              border: 1px solid #333;
              color: white;
              border-radius: 4px;
              box-sizing: border-box;
            }
            .buttons {
              margin-top: 20px;
              display: flex;
              gap: 10px;
              justify-content: flex-end;
            }
            button {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .ok { background: #4CAF50; color: white; }
            .cancel { background: #f44336; color: white; }
          </style>
        </head>
        <body>
          <h3>Authentication Required</h3>
          <div class="url">${url}</div>
          <input type="text" id="username" placeholder="Username" autofocus />
          <input type="password" id="password" placeholder="Password" />
          <div class="buttons">
            <button class="cancel" onclick="window.electronAPI.credentialResponse({ cancelled: true })">Cancel</button>
            <button class="ok" onclick="submitCredentials()">OK</button>
          </div>
          <script>
            function submitCredentials() {
              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;
              window.electronAPI.credentialResponse({ username, password });
            }
            document.getElementById('password').addEventListener('keypress', (e) => {
              if (e.key === 'Enter') submitCredentials();
            });
          </script>
        </body>
      </html>
    `;

    credWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(credHtml));
    credWindow.once('ready-to-show', () => {
      credWindow.show();
    });

    return new Promise((resolve) => {
      ipcMain.once('credential-response', (_, response) => {
        credWindow.close();
        resolve(response);
      });

      credWindow.on('closed', () => {
        resolve({ cancelled: true });
      });
    });
  } catch (error: any) {
    return { cancelled: true, error: error.message };
  }
});

// Google Drive authentication and download
ipcMain.handle('google-auth', async () => {
  try {
    // Import google auth library
    const { google } = require('googleapis');
    const { BrowserWindow } = require('electron');

    // OAuth2 configuration
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret ||
      clientId === 'YOUR_CLIENT_ID' ||
      clientSecret === 'YOUR_CLIENT_SECRET'
    ) {
      return {
        success: false,
        message:
          'Google OAuth client is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use manual download.',
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
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
      authWindow.webContents.on('will-redirect', async (event: any, url: string) => {
        if (url.startsWith('http://localhost:3000/oauth2callback')) {
          const urlParams = new URL(url).searchParams;
          const code = urlParams.get('code');

          if (code) {
            try {
              const { tokens } = await oauth2Client.getToken(code);
              oauth2Client.setCredentials(tokens);

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


// Download file from Google Drive
ipcMain.handle('download-from-drive', async (_, { fileId, destination, tokens }: any) => {
  try {
    const { google } = require('googleapis');

    // Check if tokens are provided
    if (!tokens) {
      return { success: false, message: 'Not authenticated. Please authenticate first.', needsAuth: true };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (
      !clientId ||
      !clientSecret ||
      clientId === 'YOUR_CLIENT_ID' ||
      clientSecret === 'YOUR_CLIENT_SECRET'
    ) {
      return {
        success: false,
        message:
          'Google OAuth client is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use manual download.',
        needsAuth: true,
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
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
    // Check if error is due to authentication
    if (error.code === 401 || error.code === 403) {
      return { success: false, message: error.message, needsAuth: true };
    }
    return { success: false, message: error.message };
  }
});

// Extract ZIP file
ipcMain.handle('extract-zip', async (_, { zipPath, extractTo }: any) => {
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractTo, true);
    return { success: true, message: `Extracted to ${extractTo}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
