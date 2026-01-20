import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import dotenv from 'dotenv';
import unzipper from 'unzipper';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

const loadEnv = () => {
  const envPaths = app.isPackaged
    ? [
        path.join(app.getAppPath(), '.env.local'),
        path.join(process.resourcesPath, '.env.local'),
        path.join(path.dirname(app.getPath('exe')), '.env.local'),
      ]
    : [path.resolve(process.cwd(), '.env.local')];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
};

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

app.whenReady().then(() => {
  loadEnv();
  createWindow();
});

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

ipcMain.handle('find-latest-onnx', async (_, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath);
    const onnxFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.onnx'));

    if (onnxFiles.length === 0) {
      return { success: false, message: 'No .onnx files found.' };
    }

    const filesWithStats = await Promise.all(
      onnxFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.promises.stat(filePath);
        return { file, filePath, mtimeMs: stats.mtimeMs };
      })
    );

    filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return { success: true, filePath: filesWithStats[0].filePath, fileName: filesWithStats[0].file };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
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

ipcMain.handle('read-file', async (_, { filePath }: { filePath: string }) => {
  try {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, contents };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('write-file', async (_, { filePath, contents }: { filePath: string; contents: string }) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, contents, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle(
  'count-files-by-extension',
  async (
    _,
    { dirPath, extension }: { dirPath: string; extension: string }
  ): Promise<{ success: boolean; count?: number; message?: string }> => {
    const normalizedExtension = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    const countFiles = async (currentPath: string): Promise<number> => {
      let count = 0;
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          count += await countFiles(entryPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(normalizedExtension)) {
          count += 1;
        }
      }
      return count;
    };

    try {
      if (!fs.existsSync(dirPath)) {
        return { success: true, count: 0 };
      }
      const count = await countFiles(dirPath);
      return { success: true, count };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
);

ipcMain.handle('check-admin', async () => {
  if (process.platform !== 'win32') {
    return { success: true, isAdmin: true };
  }
  try {
    await execAsync('NET SESSION');
    return { success: true, isAdmin: true };
  } catch (error: any) {
    return { success: true, isAdmin: false, message: error.message };
  }
});

ipcMain.handle('check-service-exists', async (_, { serviceName }: { serviceName: string }) => {
  if (process.platform !== 'win32') {
    return { success: true, exists: false };
  }
  try {
    const { stdout } = await execAsync(`sc query "${serviceName}"`);
    const exists = stdout.includes('SERVICE_NAME');
    return { success: true, exists };
  } catch (error: any) {
    const message = error.message || '';
    if (message.includes('1060')) {
      return { success: true, exists: false };
    }
    return { success: false, exists: false, message };
  }
});

ipcMain.handle('check-command-exists', async (_, { command }: { command: string }) => {
  if (process.platform !== 'win32') {
    return { success: true, exists: false };
  }
  try {
    await execAsync(`where ${command}`);
    return { success: true, exists: true };
  } catch (error: any) {
    return { success: true, exists: false, message: error.message };
  }
});

ipcMain.handle('check-process-running', async (_, { processName }: { processName: string }) => {
  if (process.platform !== 'win32') {
    return { success: true, running: false };
  }
  try {
    const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processName}"`);
    const running = stdout.toLowerCase().includes(processName.toLowerCase());
    return { success: true, running };
  } catch (error: any) {
    return { success: false, running: false, message: error.message };
  }
});

ipcMain.handle(
  'confirm-dialog',
  async (
    _,
    { title, message, detail }: { title: string; message: string; detail?: string }
  ) => {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
      title,
      message,
      detail,
    });
    return result.response === 0;
  }
);

ipcMain.handle(
  'prompt-text',
  async (
    _,
    {
      title,
      message,
      placeholder,
      defaultValue,
    }: { title: string; message: string; placeholder?: string; defaultValue?: string }
  ) => {
    try {
      const promptWindow = new BrowserWindow({
        width: 420,
        height: 260,
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

      const safeTitle = title.replace(/"/g, '&quot;');
      const safeMessage = message.replace(/"/g, '&quot;');
      const safePlaceholder = placeholder ? placeholder.replace(/"/g, '&quot;') : '';
      const safeDefault = defaultValue ? defaultValue.replace(/"/g, '&quot;') : '';

      const promptHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #0F0F1E; color: white; }
              h3 { margin-top: 0; font-size: 16px; }
              p { font-size: 13px; color: #cfcfcf; }
              input {
                width: 100%;
                padding: 8px;
                margin-top: 12px;
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
            <h3>${safeTitle}</h3>
            <p>${safeMessage}</p>
            <input id="promptInput" type="text" placeholder="${safePlaceholder}" value="${safeDefault}" autofocus />
            <div class="buttons">
              <button class="cancel" onclick="window.electronAPI.credentialResponse({ cancelled: true })">Cancel</button>
              <button class="ok" onclick="submitPrompt()">OK</button>
            </div>
            <script>
              function submitPrompt() {
                const value = document.getElementById('promptInput').value;
                window.electronAPI.credentialResponse({ value });
              }
              document.getElementById('promptInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitPrompt();
              });
            </script>
          </body>
        </html>
      `;

      promptWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(promptHtml));
      promptWindow.once('ready-to-show', () => {
        promptWindow.show();
      });

      return await new Promise((resolve) => {
        ipcMain.once('credential-response', (_, response) => {
          promptWindow.close();
          resolve(response);
        });

        promptWindow.on('closed', () => {
          resolve({ cancelled: true });
        });
      });
    } catch (error: any) {
      return { cancelled: true, error: error.message };
    }
  }
);

ipcMain.handle('open-external', async (_, { url }: { url: string }) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle(
  'create-shortcut',
  async (
    _,
    {
      shortcutPath,
      targetPath,
      workingDirectory,
      description,
    }: {
      shortcutPath: string;
      targetPath: string;
      workingDirectory?: string;
      description?: string;
    }
  ) => {
    if (process.platform !== 'win32') {
      return { success: false, message: 'Shortcuts are only supported on Windows.' };
    }
    const safeShortcut = shortcutPath.replace(/"/g, '""');
    const safeTarget = targetPath.replace(/"/g, '""');
    const safeWorkingDir = (workingDirectory || path.dirname(targetPath)).replace(/"/g, '""');
    const safeDescription = (description || '').replace(/"/g, '""');
    const command = [
      'powershell -Command',
      `"\\$WScriptShell = New-Object -ComObject WScript.Shell;`,
      `\\$Shortcut = \\$WScriptShell.CreateShortcut(\\\"${safeShortcut}\\\");`,
      `\\$Shortcut.TargetPath = \\\"${safeTarget}\\\";`,
      `\\$Shortcut.WorkingDirectory = \\\"${safeWorkingDir}\\\";`,
      `\\$Shortcut.Description = \\\"${safeDescription}\\\";`,
      '\\$Shortcut.Save()"',
    ].join(' ');

    try {
      await execAsync(command);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
);

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

    type DownloadResult = { success: boolean; destination?: string; message?: string };

    const downloadStream = (
      stream: NodeJS.ReadableStream,
      resolvedDestination: string
    ): Promise<DownloadResult> =>
      new Promise<DownloadResult>((resolve, reject) => {
        stream
          .on('end', () => resolve({ success: true, destination: resolvedDestination }))
          .on('error', (err: any) => reject({ success: false, message: err.message }))
          .pipe(fs.createWriteStream(resolvedDestination));
      });

    const getFileMetadata = async (id: string) =>
      drive.files.get({
        fileId: id,
        fields: 'id,name,mimeType,shortcutDetails',
        supportsAllDrives: true,
      });

    let resolvedFileId = fileId;
    let metadataResponse = await getFileMetadata(resolvedFileId);
    let metadata = metadataResponse.data;

    if (metadata.mimeType === 'application/vnd.google-apps.shortcut') {
      const targetId = metadata.shortcutDetails?.targetId;
      if (!targetId) {
        return { success: false, message: 'Drive shortcut is missing a target file.' };
      }
      metadataResponse = await getFileMetadata(targetId);
      metadata = metadataResponse.data;
      resolvedFileId = metadata.id;
    }

    if (metadata.mimeType === 'application/vnd.google-apps.folder') {
      const listResponse = await drive.files.list({
        q: `'${metadata.id}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        orderBy: 'modifiedTime desc',
      });
      const onnxFiles =
        listResponse.data.files?.filter(
          (file: any) => file.name?.toLowerCase().endsWith('.onnx')
        ) || [];
      const datatureFiles = onnxFiles.filter((file: any) =>
        file.name?.toLowerCase().includes('datature')
      );
      const byModifiedTime = (a: any, b: any) =>
        new Date(b.modifiedTime || 0).getTime() - new Date(a.modifiedTime || 0).getTime();
      const sortedDatature = datatureFiles.sort(byModifiedTime);
      const sortedOnnx = onnxFiles.sort(byModifiedTime);
      const onnxFile = sortedDatature[0] || sortedOnnx[0];
      if (!onnxFile) {
        return {
          success: false,
          message: `No .onnx file found in folder "${metadata.name}".`,
        };
      }
      resolvedFileId = onnxFile.id;
      metadata = onnxFile;
    }

    if (metadata.mimeType?.startsWith('application/vnd.google-apps')) {
      return {
        success: false,
        message: `Drive file "${metadata.name}" is a Google Docs editor file (${metadata.mimeType}). Please provide a binary file ID.`,
      };
    }

    const response = await drive.files.get(
      { fileId: resolvedFileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    let resolvedDestination = destination;
    try {
      const destinationStat = await fs.promises.stat(destination);
      if (destinationStat.isDirectory()) {
        resolvedDestination = path.join(destination, metadata.name || 'model.onnx');
      }
    } catch (error: any) {
      if (destination.endsWith(path.sep) || destination.endsWith('/')) {
        await fs.promises.mkdir(destination, { recursive: true });
        resolvedDestination = path.join(destination, metadata.name || 'model.onnx');
      }
    }

    const downloadResult = await downloadStream(response.data, resolvedDestination);
    return { ...downloadResult, fileName: metadata.name };
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
    await fs.promises.mkdir(extractTo, { recursive: true });

    const moveContents = async (sourceDir: string, destinationDir: string) => {
      const nestedEntries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
      await Promise.all(
        nestedEntries.map(async (entry) => {
          const fromPath = path.join(sourceDir, entry.name);
          const toPath = path.join(destinationDir, entry.name);
          try {
            await fs.promises.rename(fromPath, toPath);
          } catch (error: any) {
            if (error.code === 'EEXIST') {
              await fs.promises.rm(toPath, { recursive: true, force: true });
              await fs.promises.rename(fromPath, toPath);
            } else {
              throw error;
            }
          }
        })
      );
    };

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractTo }))
        .on('close', () => resolve())
        .on('error', (error: any) => reject(error));
    });

    const entries = await fs.promises.readdir(extractTo, { withFileTypes: true });
    const topLevelDirs = entries.filter((entry) => entry.isDirectory());
    const topLevelFiles = entries.filter((entry) => !entry.isDirectory());

    if (topLevelDirs.length === 1 && topLevelFiles.length === 0) {
      const nestedPath = path.join(extractTo, topLevelDirs[0].name);
      await moveContents(nestedPath, extractTo);
      await fs.promises.rmdir(nestedPath);
    }

    const trtexecPath = path.join(extractTo, 'trtexec.exe');
    if (!fs.existsSync(trtexecPath)) {
      const refreshedEntries = await fs.promises.readdir(extractTo, { withFileTypes: true });
      const candidateDirs = refreshedEntries.filter((entry) => entry.isDirectory());
      const trtexecDir = candidateDirs.find((entry) =>
        fs.existsSync(path.join(extractTo, entry.name, 'trtexec.exe'))
      );
      if (trtexecDir) {
        const nestedPath = path.join(extractTo, trtexecDir.name);
        await moveContents(nestedPath, extractTo);
        await fs.promises.rmdir(nestedPath);
      }
    }

    const fliv2DllsPath = path.join(extractTo, 'FLIv2-dlls');
    if (fs.existsSync(fliv2DllsPath)) {
      await moveContents(fliv2DllsPath, extractTo);
      await fs.promises.rmdir(fliv2DllsPath);
    }

    return { success: true, message: `Extracted to ${extractTo}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
