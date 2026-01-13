/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    createDirectory: (path: string) => Promise<{ success: boolean; message?: string }>;
    checkPathExists: (path: string) => Promise<boolean>;
    findLatestOnnx: (path: string) => Promise<{ success: boolean; message?: string; filePath?: string; fileName?: string }>;
    downloadFile: (url: string, destination: string, username?: string, password?: string) => Promise<{ success: boolean; message?: string; needsAuth?: boolean }>;
    copyFile: (source: string, destination: string) => Promise<{ success: boolean; message?: string }>;
    moveFile: (source: string, destination: string) => Promise<{ success: boolean; message?: string }>;
    executeCommand: (command: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; message?: string }>;
    selectFolder: () => Promise<string | null>;
    selectFile: () => Promise<string | null>;
    promptCredentials: (url: string) => Promise<{ username?: string; password?: string; cancelled?: boolean; error?: string }>;
    credentialResponse: (response: any) => void;
    googleAuth: () => Promise<{ success: boolean; message?: string; tokens?: any }>;
    downloadFromDrive: (fileId: string, destination: string, tokens?: any) => Promise<{ success: boolean; message?: string; needsAuth?: boolean; destination?: string; fileName?: string }>;
    onDownloadProgress: (callback: (progress: number) => void) => void;
  };
}
