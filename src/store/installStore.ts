import { create } from 'zustand';

export interface PreCheckItem {
  id: string;
  question: string;
  description: string;
  checked: boolean;
}

export interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  enabled: boolean;
  progress?: number;
  message?: string;
}

interface InstallOptions {
  redownloadDlls: boolean;
  redownloadTensorRT: boolean;
  redownloadOnnx: boolean;
  rebuildEngine: boolean;
  regenerateLicense: boolean;
  installAction1: boolean;
}

interface InstallStore {
  currentStep: 'pre-check' | 'auth' | 'install';
  setCurrentStep: (step: 'pre-check' | 'auth' | 'install') => void;

  preCheckItems: PreCheckItem[];
  updatePreCheckItem: (id: string, checked: boolean) => void;

  installSteps: InstallStep[];
  installOptions: InstallOptions;
  setInstallOption: (key: keyof InstallOptions, value: boolean) => void;
  updateStepStatus: (
    id: string,
    status: InstallStep['status'],
    progress?: number,
    message?: string
  ) => void;
  toggleStepEnabled: (id: string) => void;

  isInstalling: boolean;
  setIsInstalling: (installing: boolean) => void;

  cameraNames: string[];
  builtEnginePath?: string;
  msiPath?: string;
}

export const useInstallStore = create<InstallStore>((set) => ({
  currentStep: 'pre-check',
  setCurrentStep: (step) => set({ currentStep: step }),

  preCheckItems: [
    {
      id: 'config-generated',
      question: 'Have you generated the Camera Hub config and placed it on the server?',
      description: 'This includes downloading the site config from xlsx and importing it into the portal config generator.',
      checked: false,
    },
  ],
  updatePreCheckItem: (id, checked) =>
    set((state) => ({
      preCheckItems: state.preCheckItems.map((item) =>
        item.id === id ? { ...item, checked } : item
      ),
    })),

  installSteps: [
    {
      id: 'check-admin',
      title: 'Verify Administrator Access',
      description: 'Ensure the installer is running with elevated privileges',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'check-existing-install',
      title: 'Check Existing Installation',
      description: 'Detect existing FLIv2 DLLs and confirm re-download',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'check-existing-service',
      title: 'Check Existing Service',
      description: 'Verify EnsightFLIv2 service is not already installed',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'create-camera-hub',
      title: 'Create Camera Hub Directory',
      description: 'Create C:\\Ensight\\CameraHub folder',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'place-camera-config',
      title: 'Place Camera XML Config',
      description: 'Ensure camerahub-config.xml is in C:\\Ensight\\CameraHub',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'parse-camera-config',
      title: 'Verify CameraHub Config',
      description: 'Read camerahub-config.xml and list cameras',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'create-fliv2-dir',
      title: 'Create FLIv2 Directory',
      description: 'Create C:\\Program Files\\Ensight\\FLIv2 folder',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'download-dlls',
      title: 'Download and Extract DLLs',
      description: 'Download DLL package from Google Drive and extract to FLIv2 folder',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'create-models-dir',
      title: 'Create Models Directory',
      description: 'Create C:\\Ensight\\FLI\\Models\\onnx and TensorRT folders',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'download-tensorrt-tools',
      title: 'Download TensorRT Build Tools',
      description: 'Download and extract TensorRT tools',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'download-models',
      title: 'Download ONNX Models',
      description: 'Download latest datature-yolov8 ONNX model',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'build-tensorrt',
      title: 'Build TensorRT Model',
      description: 'Convert ONNX model to TensorRT engine',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'place-tensorrt-model',
      title: 'Place TensorRT Model',
      description: 'Move .engine file and create ensight-fli.engine copy',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'lock-gpu-clocks',
      title: 'Lock GPU Clocks',
      description: 'Lock NVIDIA GPU clocks to max if available',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'create-camera-configs',
      title: 'Create Camera Configs',
      description: 'Generate missing per-camera config XML files',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'verify-fli-config',
      title: 'Verify FLI Config',
      description: 'Check for FLI-config.xml in C:\\Ensight\\FLI\\Config',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'license-fli',
      title: 'License FLI',
      description: 'Verify fli.lic is generated and placed in C:\\Ensight\\FLI',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'download-fliv2-msi',
      title: 'Download FLIv2 MSI',
      description: 'Download latest FLIv2 installer from Google Drive',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'install-fliv2',
      title: 'Install FLIv2',
      description: 'Run FLIv2 MSI installer',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'download-viewer',
      title: 'Download FLIv2 Viewer',
      description: 'Download viewer and place in C:\\Ensight\\FLI',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'install-action1',
      title: 'Install Action1 Agent',
      description: 'Ensure Action1 agent is installed and running',
      status: 'pending',
      enabled: true,
    },
    {
      id: 'verify-installation',
      title: 'Verify Installation',
      description: 'Validate viewer, engine, and config files are present',
      status: 'pending',
      enabled: true,
    },
  ],
  installOptions: {
    redownloadDlls: false,
    redownloadTensorRT: false,
    redownloadOnnx: false,
    rebuildEngine: false,
    regenerateLicense: false,
    installAction1: false,
  },
  setInstallOption: (key, value) =>
    set((state) => ({
      installOptions: { ...state.installOptions, [key]: value },
    })),
  updateStepStatus: (id, status, progress, message) =>
    set((state) => ({
      installSteps: state.installSteps.map((step) =>
        step.id === id ? { ...step, status, progress, message } : step
      ),
    })),
  toggleStepEnabled: (id) =>
    set((state) => ({
      installSteps: state.installSteps.map((step) =>
        step.id === id ? { ...step, enabled: !step.enabled } : step
      ),
    })),

  isInstalling: false,
  setIsInstalling: (installing) => set({ isInstalling: installing }),

  cameraNames: [],
}));
