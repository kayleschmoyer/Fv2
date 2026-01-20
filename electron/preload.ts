import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // File system operations
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
  checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
  findLatestOnnx: (path: string) => ipcRenderer.invoke('find-latest-onnx', path),
  downloadFile: (url: string, destination: string, username?: string, password?: string) =>
    ipcRenderer.invoke('download-file', { url, destination, username, password }),
  copyFile: (source: string, destination: string) =>
    ipcRenderer.invoke('copy-file', { source, destination }),
  moveFile: (source: string, destination: string) =>
    ipcRenderer.invoke('move-file', { source, destination }),
  executeCommand: (command: string) => ipcRenderer.invoke('execute-command', command),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  extractZip: (zipPath: string, extractTo: string) =>
    ipcRenderer.invoke('extract-zip', { zipPath, extractTo }),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', { filePath }),
  writeFile: (filePath: string, contents: string) =>
    ipcRenderer.invoke('write-file', { filePath, contents }),
  countFilesByExtension: (dirPath: string, extension: string) =>
    ipcRenderer.invoke('count-files-by-extension', { dirPath, extension }),

  // Authentication
  promptCredentials: (url: string) => ipcRenderer.invoke('prompt-credentials', { url }),
  credentialResponse: (response: any) => ipcRenderer.send('credential-response', response),

  // Google Drive
  googleAuth: () => ipcRenderer.invoke('google-auth'),
  downloadFromDrive: (fileId: string, destination: string, tokens?: any) =>
    ipcRenderer.invoke('download-from-drive', { fileId, destination, tokens }),

  // System checks and dialogs
  checkAdmin: () => ipcRenderer.invoke('check-admin'),
  checkServiceExists: (serviceName: string) =>
    ipcRenderer.invoke('check-service-exists', { serviceName }),
  checkCommandExists: (command: string) =>
    ipcRenderer.invoke('check-command-exists', { command }),
  checkProcessRunning: (processName: string) =>
    ipcRenderer.invoke('check-process-running', { processName }),
  confirmDialog: (options: { title: string; message: string; detail?: string }) =>
    ipcRenderer.invoke('confirm-dialog', options),
  promptText: (options: {
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
  }) => ipcRenderer.invoke('prompt-text', options),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', { url }),
  createShortcut: (options: {
    shortcutPath: string;
    targetPath: string;
    workingDirectory?: string;
    description?: string;
  }) => ipcRenderer.invoke('create-shortcut', options),

  // Event listeners
  onDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress));
  },
});
