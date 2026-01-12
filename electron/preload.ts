import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // File system operations
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
  checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
  downloadFile: (url: string, destination: string, username?: string, password?: string) =>
    ipcRenderer.invoke('download-file', { url, destination, username, password }),
  copyFile: (source: string, destination: string) =>
    ipcRenderer.invoke('copy-file', { source, destination }),
  moveFile: (source: string, destination: string) =>
    ipcRenderer.invoke('move-file', { source, destination }),
  executeCommand: (command: string) => ipcRenderer.invoke('execute-command', command),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),

  // Authentication
  promptCredentials: (url: string) => ipcRenderer.invoke('prompt-credentials', { url }),
  credentialResponse: (response: any) => ipcRenderer.send('credential-response', response),

  // Google Drive
  googleAuth: () => ipcRenderer.invoke('google-auth'),
  downloadFromDrive: (fileId: string, destination: string, tokens?: any) =>
    ipcRenderer.invoke('download-from-drive', { fileId, destination, tokens }),

  // Event listeners
  onDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress));
  },
});
