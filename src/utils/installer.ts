import { useInstallStore } from '../store/installStore';

// Google Drive file IDs (extracted from Google Drive links)
const DRIVE_FILES = {
  extraDlls: '1srqV8YE7VKI3Ibtk8jLc6Xoq-7Vq73Oi', // DLL zip file
  tensorRtTools: '1SHbHNGEv0Qn3xiMZqvENkD_L4UvofnKQ', // TensorRT tools
  onnxModels: '1N783bwh6BidTxEgkkGQqQKsg0cGg0eeo', // ONNX models folder
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
        case 'create-fliv2-dir':
          await createFLIv2Directory();
          break;
        case 'download-dlls':
          await downloadExtraDlls();
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

  // Prompt for Google credentials
  updateStepStatus('download-dlls', 'running', 10, 'Authenticating with Google Drive...');
  const authResult = await window.electronAPI.googleAuth();

  if (!authResult.success) {
    throw new Error('Google authentication failed: ' + authResult.message);
  }

  // Download DLL zip from Google Drive
  updateStepStatus('download-dlls', 'running', 30, 'Downloading DLL package...');
  const tempZipPath = `${PATHS.programFiles}\\temp-dlls.zip`;

  const downloadResult = await window.electronAPI.downloadFromDrive(
    DRIVE_FILES.extraDlls,
    tempZipPath,
    authResult.tokens
  );

  if (!downloadResult.success) {
    throw new Error('Failed to download DLLs: ' + downloadResult.message);
  }

  // Extract ZIP to FLIv2 directory
  updateStepStatus('download-dlls', 'running', 70, 'Extracting DLL package...');
  const extractResult = await window.electronAPI.extractZip(tempZipPath, PATHS.programFiles);

  if (!extractResult.success) {
    throw new Error('Failed to extract DLLs: ' + extractResult.message);
  }

  updateStepStatus('download-dlls', 'running', 100, 'DLLs downloaded and extracted successfully');
}

async function createFLIv2Directory() {
  const result = await window.electronAPI.createDirectory(PATHS.programFiles);
  if (!result.success) throw new Error(result.message);
}

async function createModelsDirectory() {
  await window.electronAPI.createDirectory(PATHS.modelsOnnx);
  await window.electronAPI.createDirectory(PATHS.modelsTensorRT);
  await window.electronAPI.createDirectory(PATHS.tensorRtBuildTools);
}

async function downloadOnnxModels() {
  const { updateStepStatus } = useInstallStore.getState();

  // Authenticate with Google Drive (reuse tokens from DLL download if available)
  updateStepStatus('download-models', 'running', 10, 'Authenticating with Google Drive...');
  const authResult = await window.electronAPI.googleAuth();

  if (!authResult.success) {
    throw new Error('Google authentication failed: ' + authResult.message);
  }

  // If the ONNX file ID points to a folder/shortcut, downloadFromDrive will resolve a .onnx file.
  updateStepStatus('download-models', 'running', 30, 'Downloading ONNX model...');
  const destination = PATHS.modelsOnnx;

  const downloadResult = await window.electronAPI.downloadFromDrive(
    DRIVE_FILES.onnxModels,
    destination,
    authResult.tokens
  );

  if (!downloadResult.success) {
    throw new Error('Failed to download ONNX model: ' + downloadResult.message);
  }

  const downloadedName = downloadResult.fileName || 'ONNX model';
  updateStepStatus('download-models', 'running', 100, `${downloadedName} downloaded successfully`);
}

async function downloadTensorRTTools() {
  const { updateStepStatus } = useInstallStore.getState();

  // Authenticate with Google Drive
  updateStepStatus('download-tensorrt-tools', 'running', 10, 'Authenticating with Google Drive...');
  const authResult = await window.electronAPI.googleAuth();

  if (!authResult.success) {
    throw new Error('Google authentication failed: ' + authResult.message);
  }

  // Download TensorRT tools ZIP from Google Drive
  updateStepStatus('download-tensorrt-tools', 'running', 30, 'Downloading TensorRT tools...');
  const tempZipPath = `${PATHS.tensorRtBuildTools}\\temp-tensorrt-tools.zip`;

  const downloadResult = await window.electronAPI.downloadFromDrive(
    DRIVE_FILES.tensorRtTools,
    tempZipPath,
    authResult.tokens
  );

  if (!downloadResult.success) {
    throw new Error('Failed to download TensorRT tools: ' + downloadResult.message);
  }

  // Extract ZIP to TensorRT build tools directory
  updateStepStatus('download-tensorrt-tools', 'running', 70, 'Extracting TensorRT tools...');
  const extractResult = await window.electronAPI.extractZip(tempZipPath, PATHS.tensorRtBuildTools);

  if (!extractResult.success) {
    throw new Error('Failed to extract TensorRT tools: ' + extractResult.message);
  }

  updateStepStatus('download-tensorrt-tools', 'running', 100, 'TensorRT tools downloaded and extracted successfully');
}

async function buildTensorRTModel() {
  const { updateStepStatus } = useInstallStore.getState();

  // Find the ONNX model file
  updateStepStatus('build-tensorrt', 'running', 25, 'Locating ONNX model...');

  const latestOnnxResult = await window.electronAPI.findLatestOnnx(PATHS.modelsOnnx);

  // Get the model filename
  let selectedFile = latestOnnxResult.success ? latestOnnxResult.filePath : null;
  if (!selectedFile) {
    updateStepStatus('build-tensorrt', 'running', 30, 'Please select the ONNX model...');
    selectedFile = await window.electronAPI.selectFile();
    if (!selectedFile) throw new Error('No ONNX model selected');
  }

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
