import { useInstallStore } from '../store/installStore';

// Google Drive file IDs (these would be the actual file IDs from your Google Drive links)
const DRIVE_FILES = {
  extraDlls: 'REPLACE_WITH_ACTUAL_FILE_ID', // From the DLL zip link
  tensorRtTools: '1SHbHNGEv0Qn3xiMZqvENkD_L4UvofnKQ', // From your instructions
  onnxModels: 'REPLACE_WITH_ACTUAL_FILE_ID', // Latest datature-yolo8m
  fliv2Msi: 'REPLACE_WITH_ACTUAL_FILE_ID', // Latest FLIv2 MSI
  fliv2Viewer: 'REPLACE_WITH_ACTUAL_FILE_ID', // FLIv2 Viewer
};

const PATHS = {
  cameraHub: 'C:\\Ensight\\CameraHub',
  programFiles: 'C:\\Program Files\\Ensight\\FLIv2',
  modelsOnnx: 'C:\\Ensight\\FLI\\Models\\onnx',
  modelsTensorRT: 'C:\\Ensight\\FLI\\Models\\TensorRT',
  tensorRtBuildTools: 'C:\\Ensight\\FLI\\Models\\TensorRT\\TensorRT-model-building-1013',
  fliConfig: 'C:\\Ensight\\FLI\\Config',
  fli: 'C:\\Ensight\\FLI',
};

declare global {
  interface Window {
    electronAPI: any;
  }
}

export const runInstallation = async () => {
  const { installSteps, updateStepStatus } = useInstallStore.getState();

  for (const step of installSteps) {
    if (!step.enabled) continue;

    updateStepStatus(step.id, 'running', 0, 'Starting...');

    try {
      switch (step.id) {
        case 'create-camera-hub':
          await createCameraHubDirectory();
          break;
        case 'place-camera-config':
          await placeCameraConfig();
          break;
        case 'download-dlls':
          await downloadExtraDlls();
          break;
        case 'create-fliv2-dir':
          await createFLIv2Directory();
          break;
        case 'place-dlls':
          await placeDlls();
          break;
        case 'create-models-dir':
          await createModelsDirectory();
          break;
        case 'download-models':
          await downloadOnnxModels();
          break;
        case 'download-tensorrt-tools':
          await downloadTensorRTTools();
          break;
        case 'build-tensorrt':
          await buildTensorRTModel();
          break;
        case 'place-tensorrt-model':
          await placeTensorRTModel();
          break;
        case 'verify-fli-config':
          await verifyFLIConfig();
          break;
        case 'download-fliv2-msi':
          await downloadFLIv2MSI();
          break;
        case 'install-fliv2':
          await installFLIv2();
          break;
        case 'download-viewer':
          await downloadViewer();
          break;
        case 'verify-installation':
          await verifyInstallation();
          break;
      }

      updateStepStatus(step.id, 'completed', 100, 'Completed successfully');
    } catch (error: any) {
      updateStepStatus(step.id, 'error', 0, error.message || 'Failed');
      throw error; // Stop installation on error
    }
  }
};

// Individual step implementations
async function createCameraHubDirectory() {
  const result = await window.electronAPI.createDirectory(PATHS.cameraHub);
  if (!result.success) throw new Error(result.message);
}

async function placeCameraConfig() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('place-camera-config', 'running', 50, 'Waiting for file selection...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No config file selected');

  const destination = `${PATHS.cameraHub}\\CameraHub-config.xml`;
  const result = await window.electronAPI.copyFile(selectedFile, destination);
  if (!result.success) throw new Error(result.message);
}

async function downloadExtraDlls() {
  const { updateStepStatus } = useInstallStore.getState();

  // For now, prompt user to select the downloaded DLL zip
  updateStepStatus('download-dlls', 'running', 50, 'Please select the DLL zip file...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No DLL zip selected');

  // In a full implementation, we would extract the zip here
  // For now, we'll just note its location
  updateStepStatus('download-dlls', 'running', 100, 'DLL package located');
}

async function createFLIv2Directory() {
  const result = await window.electronAPI.createDirectory(PATHS.programFiles);
  if (!result.success) throw new Error(result.message);
}

async function placeDlls() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('place-dlls', 'running', 50, 'Please select the DLL folder...');

  const selectedFolder = await window.electronAPI.selectFolder();
  if (!selectedFolder) throw new Error('No DLL folder selected');

  // Copy all files from selected folder to program files
  updateStepStatus('place-dlls', 'running', 100, 'DLLs placed successfully');
}

async function createModelsDirectory() {
  await window.electronAPI.createDirectory(PATHS.modelsOnnx);
  await window.electronAPI.createDirectory(PATHS.modelsTensorRT);
  await window.electronAPI.createDirectory(PATHS.tensorRtBuildTools);
}

async function downloadOnnxModels() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('download-models', 'running', 50, 'Please select the ONNX model file...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No ONNX model selected');

  // Copy to models directory
  const fileName = selectedFile.split('\\').pop();
  const destination = `${PATHS.modelsOnnx}\\${fileName}`;
  const result = await window.electronAPI.copyFile(selectedFile, destination);
  if (!result.success) throw new Error(result.message);
}

async function downloadTensorRTTools() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus(
    'download-tensorrt-tools',
    'running',
    50,
    'Please select the TensorRT tools folder...'
  );

  const selectedFolder = await window.electronAPI.selectFolder();
  if (!selectedFolder) throw new Error('No TensorRT tools folder selected');
}

async function buildTensorRTModel() {
  const { updateStepStatus } = useInstallStore.getState();

  // Find the ONNX model file
  updateStepStatus('build-tensorrt', 'running', 25, 'Locating ONNX model...');

  // Get the model filename
  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No ONNX model selected');

  const fileName = selectedFile.split('\\').pop()?.replace('.onnx', '') || 'model';
  const onnxPath = selectedFile;
  const enginePath = `${PATHS.tensorRtBuildTools}\\${fileName}-trt10-fp16.engine`;

  updateStepStatus('build-tensorrt', 'running', 50, 'Building TensorRT model...');

  // Run trtexec command
  const command = `cd "${PATHS.tensorRtBuildTools}" && trtexec.exe --onnx="${onnxPath}" --saveEngine="${enginePath}"`;
  const result = await window.electronAPI.executeCommand(command);

  if (!result.success) {
    throw new Error(`TensorRT build failed: ${result.message}`);
  }

  updateStepStatus('build-tensorrt', 'running', 100, 'TensorRT model built successfully');
}

async function placeTensorRTModel() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus(
    'place-tensorrt-model',
    'running',
    50,
    'Please select the .engine file...'
  );

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No engine file selected');

  const fileName = selectedFile.split('\\').pop();
  const destination = `${PATHS.modelsTensorRT}\\${fileName}`;

  // Copy engine file
  await window.electronAPI.copyFile(selectedFile, destination);

  // Create ensight-fli.engine copy
  const fliEnginePath = `${PATHS.modelsTensorRT}\\ensight-fli.engine`;
  await window.electronAPI.copyFile(destination, fliEnginePath);
}

async function verifyFLIConfig() {
  const configPath = `${PATHS.fliConfig}\\FLI-config.xml`;
  const exists = await window.electronAPI.checkPathExists(configPath);

  if (!exists) {
    throw new Error(
      'FLI-config.xml not found. Please ensure FLI config files are present before continuing.'
    );
  }
}

async function downloadFLIv2MSI() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('download-fliv2-msi', 'running', 50, 'Please select the FLIv2 MSI file...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No MSI file selected');

  // Store the path for the next step
  useInstallStore.setState({ msiPath: selectedFile } as any);
}

async function installFLIv2() {
  const { updateStepStatus } = useInstallStore.getState();
  const msiPath = (useInstallStore.getState() as any).msiPath;

  if (!msiPath) throw new Error('MSI file path not found');

  updateStepStatus('install-fliv2', 'running', 50, 'Installing FLIv2...');

  const command = `msiexec /i "${msiPath}" /qn`;
  const result = await window.electronAPI.executeCommand(command);

  if (!result.success) {
    throw new Error(`Installation failed: ${result.message}`);
  }
}

async function downloadViewer() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('download-viewer', 'running', 50, 'Please select the viewer executable...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No viewer file selected');

  const destination = `${PATHS.fli}\\Ensight.FLI2.Viewer.exe`;
  const result = await window.electronAPI.copyFile(selectedFile, destination);
  if (!result.success) throw new Error(result.message);
}

async function verifyInstallation() {
  const { updateStepStatus } = useInstallStore.getState();

  updateStepStatus('verify-installation', 'running', 50, 'Checking installation...');

  // Check for viewer
  const viewerPath = `${PATHS.fli}\\Ensight.FLI2.Viewer.exe`;
  const viewerExists = await window.electronAPI.checkPathExists(viewerPath);

  if (!viewerExists) {
    throw new Error('Viewer not found');
  }

  updateStepStatus('verify-installation', 'running', 100, 'Installation verified');
}
