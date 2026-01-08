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
  // This will be implemented with Google OAuth2
  // For now, we'll use direct download links
  return { success: true, message: 'Authentication successful' };
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
