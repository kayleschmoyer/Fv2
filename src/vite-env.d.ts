/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    createDirectory: (path: string) => Promise<{ success: boolean; message?: string }>;
    checkPathExists: (path: string) => Promise<boolean>;
    downloadFile: (url: string, destination: string) => Promise<{ success: boolean; message?: string }>;
    copyFile: (source: string, destination: string) => Promise<{ success: boolean; message?: string }>;
    moveFile: (source: string, destination: string) => Promise<{ success: boolean; message?: string }>;
    executeCommand: (command: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; message?: string }>;
    selectFolder: () => Promise<string | null>;
    selectFile: () => Promise<string | null>;
    googleAuth: (credentials: any) => Promise<{ success: boolean; message: string }>;
    saveCredentials: (credentials: any) => Promise<{ success: boolean; message?: string }>;
    loadCredentials: () => Promise<{ success: boolean; credentials?: any; message?: string }>;
    onDownloadProgress: (callback: (progress: number) => void) => void;
  };
}
