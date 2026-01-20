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
  cameraHubConfig: 'C:\\Ensight\\CameraHub\\camerahub-config.xml',
  programFiles: 'C:\\Program Files\\Ensight\\FLIv2',
  modelsOnnx: 'C:\\Ensight\\FLI\\Models\\onnx',
  modelsTensorRT: 'C:\\Ensight\\FLI\\Models\\TensorRT',
  tensorRtBuildTools: 'C:\\Ensight\\FLI\\Models\\TensorRT\\TensorRT-model-building-1013',
  fliConfig: 'C:\\Ensight\\FLI\\Config',
  fli: 'C:\\Ensight\\FLI',
};

const SERVICE_NAME = 'EnsightFLIv2';
const LICENSE_PATH = 'C:\\Ensight\\FLI\\fli.lic';
const FLI_CONFIG_TEMPLATE = (siteName: string) => `<?xml version="1.0"?>
<FLIGlobalConfig xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <EnsightAPIConfig>
    <Host>https://data.ensightful.io/v1</Host>
    <APIKey>yRX9QAUNl3aTIMjtK4g5x8rTvkOeUl1KaloJnPCz</APIKey>
  </EnsightAPIConfig>
  <DBConnectionString>Data Source=.\\SQLEXPRESS;Initial Catalog=FliSpyData;Integrated Security=True</DBConnectionString>
  <SiteName>${siteName}</SiteName>
</FLIGlobalConfig>
`;

const CAMERA_CONFIG_TEMPLATE = (cameraName: string) => `<?xml version="1.0" encoding="utf-8"?>
<PluginConfig xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CameraName>${cameraName}</CameraName>
  <EnhancedVisuals>true</EnhancedVisuals>
  <FLIConfig>
    <DetectorType>TensorRT</DetectorType>
    <MotionDetectionSensitivity>40</MotionDetectionSensitivity>
    <DetectionInterval>2</DetectionInterval>
    <ConfidenceThreshold>40</ConfidenceThreshold>
    <Frame>
      <Width>640</Width>
      <Height>480</Height>
    </Frame>
    <ROI>
      <Location>
        <X>0</X>
        <Y>0</Y>
      </Location>
      <Size>
        <Width>640</Width>
        <Height>480</Height>
      </Size>
      <X>0</X>
      <Y>0</Y>
      <Width>640</Width>
      <Height>480</Height>
    </ROI>
    <ROEs>
    </ROEs>
    <CountLineUp>
      <X1>0</X1>
      <Y1>240</Y1>
      <X2>480</X2>
      <Y2>240</Y2>
    </CountLineUp>
    <CountLineDown>
      <X1>0</X1>
      <Y1>215</Y1>
      <X2>640</X2>
      <Y2>215</Y2>
    </CountLineDown>
    <LargeBoundingBoxMaxWidth>350</LargeBoundingBoxMaxWidth>
    <LargeBoundingBoxMaxHeight>350</LargeBoundingBoxMaxHeight>
    <MaximumAllowedCountedDistance>140</MaximumAllowedCountedDistance>
    <MinimumSameObjectOverlap>0.17</MinimumSameObjectOverlap>
    <RecordCountFrames>false</RecordCountFrames>
    <RecordLowConfidenceFrames>false</RecordLowConfidenceFrames>
    <ReportFLI>true</ReportFLI>
    <DetectionBoxScale>1</DetectionBoxScale>
    <FramesReceivedTimeoutMs>500</FramesReceivedTimeoutMs>
    <AllowTurnarounds>true</AllowTurnarounds>
    <PersistDetections>true</PersistDetections>
  </FLIConfig>
</PluginConfig>
`;

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
        case 'check-admin':
          await checkAdminPrivileges();
          break;
        case 'check-existing-install':
          await checkExistingInstall();
          break;
        case 'check-existing-service':
          await checkExistingService();
          break;
        case 'create-camera-hub':
          await createCameraHubDirectory();
          break;
        case 'place-camera-config':
          await placeCameraConfig();
          break;
        case 'parse-camera-config':
          await parseCameraHubConfig();
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
        case 'lock-gpu-clocks':
          await lockGpuClocks();
          break;
        case 'create-camera-configs':
          await createCameraConfigFiles();
          break;
        case 'verify-fli-config':
          await verifyFLIConfig();
          break;
        case 'license-fli':
          await licenseFLI();
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
        case 'install-action1':
          await installAction1();
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
async function checkAdminPrivileges() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('check-admin', 'running', 50, 'Validating elevated permissions...');
  const result = await window.electronAPI.checkAdmin();
  if (!result.success) throw new Error(result.message || 'Unable to verify admin privileges.');
  if (!result.isAdmin) {
    throw new Error('Administrator privileges required. Please relaunch the installer as admin.');
  }
  updateStepStatus('check-admin', 'running', 100, 'Administrator privileges confirmed.');
}

async function checkExistingInstall() {
  const { updateStepStatus, setInstallOption } = useInstallStore.getState();
  updateStepStatus('check-existing-install', 'running', 40, 'Scanning for existing DLLs...');
  const dllCountResult = await window.electronAPI.countFilesByExtension(PATHS.programFiles, '.dll');
  if (!dllCountResult.success) {
    throw new Error(dllCountResult.message || 'Failed to scan for existing DLLs.');
  }

  const dllCount = dllCountResult.count || 0;
  if (dllCount > 0) {
    const shouldRedownload = await window.electronAPI.confirmDialog({
      title: 'Existing DLLs Found',
      message: `Found ${dllCount} DLL files in ${PATHS.programFiles}.`,
      detail: 'Do you want to re-download and replace them?',
    });
    setInstallOption('redownloadDlls', shouldRedownload);
    updateStepStatus(
      'check-existing-install',
      'running',
      80,
      shouldRedownload ? 'DLLs will be re-downloaded.' : 'Existing DLLs will be kept.'
    );
  } else {
    updateStepStatus('check-existing-install', 'running', 100, 'No existing DLLs found.');
  }
}

async function checkExistingService() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('check-existing-service', 'running', 50, 'Checking for existing service...');
  const result = await window.electronAPI.checkServiceExists(SERVICE_NAME);
  if (!result.success) {
    throw new Error(result.message || 'Failed to check existing service.');
  }
  if (result.exists) {
    throw new Error(
      `Service "${SERVICE_NAME}" already exists. Please uninstall it before continuing.`
    );
  }
  updateStepStatus('check-existing-service', 'running', 100, 'No existing service found.');
}

async function createCameraHubDirectory() {
  const result = await window.electronAPI.createDirectory(PATHS.cameraHub);
  if (!result.success) throw new Error(result.message);
}

async function placeCameraConfig() {
  const { updateStepStatus } = useInstallStore.getState();
  const configExists = await window.electronAPI.checkPathExists(PATHS.cameraHubConfig);
  if (configExists) {
    updateStepStatus('place-camera-config', 'running', 100, 'CameraHub config already exists.');
    return;
  }

  updateStepStatus('place-camera-config', 'running', 50, 'Select camerahub-config.xml...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No config file selected');

  const result = await window.electronAPI.copyFile(selectedFile, PATHS.cameraHubConfig);
  if (!result.success) throw new Error(result.message);
  updateStepStatus('place-camera-config', 'running', 100, 'CameraHub config saved.');
}

async function parseCameraHubConfig() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('parse-camera-config', 'running', 30, 'Reading camerahub-config.xml...');
  const readResult = await window.electronAPI.readFile(PATHS.cameraHubConfig);
  if (!readResult.success) {
    throw new Error(readResult.message || 'Unable to read camerahub-config.xml');
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(readResult.contents, 'application/xml');
  const cameraNodes = Array.from(xml.getElementsByTagName('Camera'));
  const cameraNodesLower = cameraNodes.length > 0 ? cameraNodes : Array.from(xml.getElementsByTagName('camera'));
  const cameras = cameraNodesLower.length
    ? cameraNodesLower
    : Array.from(xml.querySelectorAll('CameraHub > Cameras > Camera'));

  const cameraNames = cameras
    .map((node) => {
      const name =
        node.getAttribute('Name') ||
        node.getAttribute('Id') ||
        node.querySelector('Name')?.textContent ||
        node.querySelector('Id')?.textContent;
      return name?.trim();
    })
    .filter((name): name is string => Boolean(name));

  useInstallStore.setState({ cameraNames });
  const message =
    cameraNames.length > 0
      ? `Found ${cameraNames.length} camera(s): ${cameraNames.join(', ')}`
      : 'No cameras found. Please verify camerahub-config.xml formatting.';
  updateStepStatus('parse-camera-config', 'running', 100, message);
}

async function downloadExtraDlls() {
  const { updateStepStatus, installOptions } = useInstallStore.getState();

  if (!installOptions.redownloadDlls) {
    const dllCountResult = await window.electronAPI.countFilesByExtension(PATHS.programFiles, '.dll');
    if (dllCountResult.success && (dllCountResult.count || 0) > 0) {
      updateStepStatus('download-dlls', 'running', 100, 'Skipping download; existing DLLs kept.');
      return;
    }
  }

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
  const { updateStepStatus, installOptions, setInstallOption } = useInstallStore.getState();

  const existingOnnxCount = await window.electronAPI.countFilesByExtension(PATHS.modelsOnnx, '.onnx');
  if (existingOnnxCount.success && (existingOnnxCount.count || 0) > 0 && !installOptions.redownloadOnnx) {
    const shouldRedownload = await window.electronAPI.confirmDialog({
      title: 'Existing ONNX Model Found',
      message: 'An ONNX model already exists in the models directory.',
      detail: 'Do you want to download and replace it?',
    });
    setInstallOption('redownloadOnnx', shouldRedownload);
    if (!shouldRedownload) {
      updateStepStatus('download-models', 'running', 100, 'Skipping ONNX download; existing model kept.');
      return;
    }
  }

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
  const { updateStepStatus, installOptions, setInstallOption } = useInstallStore.getState();

  const existingTensorRT = await window.electronAPI.countFilesByExtension(
    PATHS.tensorRtBuildTools,
    '.exe'
  );
  if (existingTensorRT.success && (existingTensorRT.count || 0) > 0 && !installOptions.redownloadTensorRT) {
    const shouldRedownload = await window.electronAPI.confirmDialog({
      title: 'Existing TensorRT Tools Found',
      message: 'TensorRT build tools already exist.',
      detail: 'Do you want to re-download and replace them?',
    });
    setInstallOption('redownloadTensorRT', shouldRedownload);
    if (!shouldRedownload) {
      updateStepStatus(
        'download-tensorrt-tools',
        'running',
        100,
        'Skipping TensorRT download; existing tools kept.'
      );
      return;
    }
  }

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
  const { updateStepStatus, installOptions, setInstallOption } = useInstallStore.getState();

  const existingEnginePath = `${PATHS.modelsTensorRT}\\ensight-fli.engine`;
  const existingEngine = await window.electronAPI.checkPathExists(existingEnginePath);
  if (existingEngine && !installOptions.rebuildEngine) {
    const shouldRebuild = await window.electronAPI.confirmDialog({
      title: 'Existing TensorRT Engine Found',
      message: 'ensight-fli.engine already exists.',
      detail: 'Do you want to rebuild the TensorRT engine?',
    });
    setInstallOption('rebuildEngine', shouldRebuild);
    if (!shouldRebuild) {
      updateStepStatus('build-tensorrt', 'running', 100, 'Skipping build; existing engine kept.');
      useInstallStore.setState({ builtEnginePath: existingEnginePath });
      return;
    }
  }

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

  useInstallStore.setState({ builtEnginePath: enginePath });
  updateStepStatus('build-tensorrt', 'running', 100, 'TensorRT model built successfully');
}

async function placeTensorRTModel() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('place-tensorrt-model', 'running', 40, 'Placing TensorRT engine...');

  const existingEngine = await window.electronAPI.checkPathExists(`${PATHS.modelsTensorRT}\\ensight-fli.engine`);
  const storedEnginePath = useInstallStore.getState().builtEnginePath;
  let engineSourcePath = storedEnginePath;

  if (!engineSourcePath && existingEngine) {
    updateStepStatus('place-tensorrt-model', 'running', 100, 'Engine already present.');
    return;
  }

  if (!engineSourcePath) {
    updateStepStatus('place-tensorrt-model', 'running', 50, 'Please select the .engine file...');
    engineSourcePath = await window.electronAPI.selectFile();
    if (!engineSourcePath) throw new Error('No engine file selected');
  }

  const fileName = engineSourcePath.split('\\').pop() || 'engine.plan';
  const destination = `${PATHS.modelsTensorRT}\\${fileName}`;

  await window.electronAPI.copyFile(engineSourcePath, destination);

  const fliEnginePath = `${PATHS.modelsTensorRT}\\ensight-fli.engine`;
  await window.electronAPI.copyFile(destination, fliEnginePath);

  updateStepStatus('place-tensorrt-model', 'running', 100, 'TensorRT engine placed.');
}

async function lockGpuClocks() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('lock-gpu-clocks', 'running', 25, 'Checking for nvidia-smi...');

  const commandExists = await window.electronAPI.checkCommandExists('nvidia-smi');
  if (!commandExists.success) {
    throw new Error(commandExists.message || 'Unable to check nvidia-smi availability.');
  }
  if (!commandExists.exists) {
    updateStepStatus('lock-gpu-clocks', 'running', 100, 'nvidia-smi not found. Skipping GPU lock.');
    return;
  }

  const clockResult = await window.electronAPI.executeCommand('nvidia-smi -q -d CLOCK');
  if (!clockResult.success) {
    updateStepStatus(
      'lock-gpu-clocks',
      'running',
      100,
      'nvidia-smi failed. Skipping GPU lock.'
    );
    return;
  }

  const output: string = clockResult.stdout || '';
  const maxGraphicsMatch = output.match(/Max Clocks[\s\S]*?Graphics\s*:\s*(\d+)\s*MHz/i);
  const maxMemoryMatch = output.match(/Max Clocks[\s\S]*?Memory\s*:\s*(\d+)\s*MHz/i);
  const maxGraphics = maxGraphicsMatch?.[1];
  const maxMemory = maxMemoryMatch?.[1];

  if (maxGraphics) {
    await window.electronAPI.executeCommand(`nvidia-smi -lgc ${maxGraphics}`);
  }

  if (maxMemory) {
    await window.electronAPI.executeCommand(`nvidia-smi -lmc ${maxMemory}`);
  }

  const message = `Locked GPU clocks${maxGraphics ? ` (Graphics ${maxGraphics} MHz)` : ''}${
    maxMemory ? ` (Memory ${maxMemory} MHz)` : ''
  }.`;
  updateStepStatus('lock-gpu-clocks', 'running', 100, message);
}

async function createCameraConfigFiles() {
  const { updateStepStatus } = useInstallStore.getState();
  const cameraNames = useInstallStore.getState().cameraNames || [];

  await window.electronAPI.createDirectory(PATHS.fliConfig);

  if (cameraNames.length === 0) {
    updateStepStatus(
      'create-camera-configs',
      'running',
      100,
      'No cameras found to generate configs.'
    );
    return;
  }

  const missingConfigs: string[] = [];
  for (const cameraName of cameraNames) {
    const configPath = `${PATHS.fliConfig}\\${cameraName}-config.xml`;
    const exists = await window.electronAPI.checkPathExists(configPath);
    if (!exists) {
      missingConfigs.push(cameraName);
    }
  }

  if (missingConfigs.length > 0) {
    const shouldCreate = await window.electronAPI.confirmDialog({
      title: 'Missing Camera Configs',
      message: `Create ${missingConfigs.length} missing camera config file(s)?`,
      detail: missingConfigs.map((name) => `${name}-config.xml`).join(', '),
    });

    if (shouldCreate) {
      for (const cameraName of missingConfigs) {
        const configPath = `${PATHS.fliConfig}\\${cameraName}-config.xml`;
        const content = CAMERA_CONFIG_TEMPLATE(cameraName);
        const writeResult = await window.electronAPI.writeFile(configPath, content);
        if (!writeResult.success) {
          throw new Error(writeResult.message || `Failed to create ${configPath}`);
        }
      }
    } else {
      throw new Error('Camera config files missing. Please create them before continuing.');
    }
  }

  updateStepStatus(
    'create-camera-configs',
    'running',
    100,
    'Camera config files verified.'
  );
}

async function verifyFLIConfig() {
  const configPath = `${PATHS.fliConfig}\\FLI-config.xml`;
  const exists = await window.electronAPI.checkPathExists(configPath);
  const { updateStepStatus } = useInstallStore.getState();

  if (!exists) {
    const prompt = await window.electronAPI.promptText({
      title: 'Site Key Required',
      message: 'Enter the Site Key to create FLI-config.xml',
      placeholder: 'Site Key',
    });
    if (prompt.cancelled || !prompt.value) {
      throw new Error('Site Key required to create FLI-config.xml');
    }
    const writeResult = await window.electronAPI.writeFile(
      configPath,
      FLI_CONFIG_TEMPLATE(prompt.value)
    );
    if (!writeResult.success) {
      throw new Error(writeResult.message || 'Failed to create FLI-config.xml');
    }
    updateStepStatus('verify-fli-config', 'running', 100, 'FLI-config.xml created.');
    return;
  }

  const readResult = await window.electronAPI.readFile(configPath);
  if (!readResult.success) {
    throw new Error(readResult.message || 'Failed to read FLI-config.xml');
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(readResult.contents, 'application/xml');
  const siteNode = xml.querySelector('SiteName');
  const existingSite = siteNode?.textContent?.trim() || '';

  const confirmSite = await window.electronAPI.confirmDialog({
    title: 'Confirm Site Name',
    message: `Current Site Name: ${existingSite || 'Not set'}`,
    detail: 'Is this Site Name correct?',
  });

  if (!confirmSite) {
    const prompt = await window.electronAPI.promptText({
      title: 'Update Site Name',
      message: 'Enter the correct Site Key',
      placeholder: 'Site Key',
      defaultValue: existingSite,
    });
    if (prompt.cancelled || !prompt.value) {
      throw new Error('Site Key required to update FLI-config.xml');
    }
    if (siteNode) {
      siteNode.textContent = prompt.value;
      const serializer = new XMLSerializer();
      const updatedXml = serializer.serializeToString(xml);
      const writeResult = await window.electronAPI.writeFile(configPath, updatedXml);
      if (!writeResult.success) {
        throw new Error(writeResult.message || 'Failed to update FLI-config.xml');
      }
      updateStepStatus('verify-fli-config', 'running', 100, 'FLI-config.xml updated.');
      return;
    }
    const writeResult = await window.electronAPI.writeFile(
      configPath,
      FLI_CONFIG_TEMPLATE(prompt.value)
    );
    if (!writeResult.success) {
      throw new Error(writeResult.message || 'Failed to recreate FLI-config.xml');
    }
  }

  updateStepStatus('verify-fli-config', 'running', 100, 'FLI-config.xml verified.');
}

async function licenseFLI() {
  const { updateStepStatus, installOptions, setInstallOption } = useInstallStore.getState();
  updateStepStatus('license-fli', 'running', 20, 'Checking for license file...');

  const exists = await window.electronAPI.checkPathExists(LICENSE_PATH);
  if (exists && !installOptions.regenerateLicense) {
    const regenerate = await window.electronAPI.confirmDialog({
      title: 'License File Detected',
      message: 'fli.lic already exists.',
      detail: 'Do you want to regenerate the license file?',
    });
    setInstallOption('regenerateLicense', regenerate);
    if (!regenerate) {
      updateStepStatus('license-fli', 'running', 100, 'Existing license file kept.');
      return;
    }
  }

  const openLink = await window.electronAPI.confirmDialog({
    title: 'Licensing Utility Required',
    message: 'Download the Ensight Licensing Utility to generate fli.lic.',
    detail: 'Open the Google Drive link now?',
  });

  if (openLink) {
    await window.electronAPI.openExternal(
      'https://drive.google.com/file/d/1RvRc8bEPTlo_Y56F8VsdUIiVLeCTUcOG/view?usp=drive_link'
    );
  }

  const confirmed = await window.electronAPI.confirmDialog({
    title: 'License File Confirmation',
    message: 'Have you placed fli.lic in C:\\Ensight\\FLI?',
    detail: 'Click Yes once the license file is present.',
  });

  if (!confirmed) {
    throw new Error('License file not confirmed. Please place fli.lic before continuing.');
  }

  const existsAfter = await window.electronAPI.checkPathExists(LICENSE_PATH);
  if (!existsAfter) {
    throw new Error('fli.lic not found in C:\\Ensight\\FLI.');
  }

  updateStepStatus('license-fli', 'running', 100, 'License file verified.');
}

async function downloadFLIv2MSI() {
  const { updateStepStatus } = useInstallStore.getState();
  updateStepStatus('download-fliv2-msi', 'running', 50, 'Please select the FLIv2 MSI file...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No MSI file selected');

  // Store the path for the next step
  useInstallStore.setState({ msiPath: selectedFile });
}

async function installFLIv2() {
  const { updateStepStatus } = useInstallStore.getState();
  const msiPath = useInstallStore.getState().msiPath;

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
  updateStepStatus('download-viewer', 'running', 30, 'Please select the viewer ZIP file...');

  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No viewer ZIP file selected');

  updateStepStatus('download-viewer', 'running', 60, 'Extracting viewer files...');
  const extractResult = await window.electronAPI.extractZip(selectedFile, PATHS.fli);
  if (!extractResult.success) throw new Error(extractResult.message);

  const viewerExeCandidates = [
    `${PATHS.fli}\\Ensight.FLIv2.Viewer.exe`,
    `${PATHS.fli}\\FLIv2-Viewer\\Ensight.FLIv2.Viewer.exe`,
    `${PATHS.fli}\\Ensight.FLI2.Viewer.exe`,
  ];

  let viewerExe = '';
  for (const candidate of viewerExeCandidates) {
    const exists = await window.electronAPI.checkPathExists(candidate);
    if (exists) {
      viewerExe = candidate;
      break;
    }
  }

  if (!viewerExe) {
    updateStepStatus(
      'download-viewer',
      'running',
      100,
      'Viewer extracted, but executable not found.'
    );
    return;
  }

  const shortcutPath = 'C:\\Users\\Public\\Desktop\\FLIv2 Viewer.lnk';
  const shortcutResult = await window.electronAPI.createShortcut({
    shortcutPath,
    targetPath: viewerExe,
    workingDirectory: viewerExe.replace(/\\[^\\]+$/, ''),
    description: 'Ensight FLIv2 Viewer',
  });

  const shortcutMessage = shortcutResult?.success
    ? 'Viewer extracted and shortcut created.'
    : 'Viewer extracted (shortcut could not be created).';
  updateStepStatus('download-viewer', 'running', 100, shortcutMessage);
}

async function installAction1() {
  const { updateStepStatus, installOptions, setInstallOption } = useInstallStore.getState();
  updateStepStatus('install-action1', 'running', 20, 'Checking Action1 agent...');

  const processResult = await window.electronAPI.checkProcessRunning('action1_agent.exe');
  if (processResult.success && processResult.running) {
    updateStepStatus('install-action1', 'running', 100, 'Action1 agent already running.');
    return;
  }

  if (!installOptions.installAction1) {
    const shouldInstall = await window.electronAPI.confirmDialog({
      title: 'Action1 Agent',
      message: 'Action1 agent is not running.',
      detail: 'Do you want to install it now?',
    });
    setInstallOption('installAction1', shouldInstall);
    if (!shouldInstall) {
      updateStepStatus('install-action1', 'running', 100, 'Skipping Action1 agent installation.');
      return;
    }
  }

  updateStepStatus('install-action1', 'running', 50, 'Select the Action1 MSI installer...');
  const selectedFile = await window.electronAPI.selectFile();
  if (!selectedFile) throw new Error('No Action1 installer selected');

  const command = `msiexec /i "${selectedFile}" /qn /norestart`;
  const result = await window.electronAPI.executeCommand(command);
  if (!result.success) throw new Error(result.message || 'Action1 installation failed');

  updateStepStatus('install-action1', 'running', 100, 'Action1 agent installation completed.');
}

async function verifyInstallation() {
  const { updateStepStatus } = useInstallStore.getState();

  updateStepStatus('verify-installation', 'running', 50, 'Checking installation...');

  const viewerCandidates = [
    `${PATHS.fli}\\Ensight.FLIv2.Viewer.exe`,
    `${PATHS.fli}\\FLIv2-Viewer\\Ensight.FLIv2.Viewer.exe`,
    `${PATHS.fli}\\Ensight.FLI2.Viewer.exe`,
  ];
  const viewerExists = (
    await Promise.all(
      viewerCandidates.map((candidate) => window.electronAPI.checkPathExists(candidate))
    )
  ).some(Boolean);

  const checks = [
    { label: 'Engine', path: `${PATHS.modelsTensorRT}\\ensight-fli.engine` },
    { label: 'CameraHub config', path: PATHS.cameraHubConfig },
    { label: 'FLI config', path: `${PATHS.fliConfig}\\FLI-config.xml` },
    { label: 'License', path: LICENSE_PATH },
  ];

  const missing: string[] = [];
  if (!viewerExists) {
    missing.push('Viewer');
  }
  for (const check of checks) {
    const exists = await window.electronAPI.checkPathExists(check.path);
    if (!exists) missing.push(check.label);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }

  updateStepStatus('verify-installation', 'running', 100, 'Installation verified.');
}
