# Quick Start Guide

## For Developers

### 1. Setup
```bash
npm install
```

### 2. Run Development
```bash
npm run dev
```
This will start both the React dev server and Electron app.

### 3. Build Installer
```bash
npm run build
npm run package:win
```
Find the installer in `release/` folder.

### Optional: Bundle Google OAuth Credentials
If you want the packaged installer to already include Google Drive OAuth credentials, create a `.env.local` file in the repo root before building:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```
The build will embed this file into the app bundle (for example, within `app.asar`) so end users do not need to set environment variables.

## For End Users

### Before Running the Installer

Complete these manual steps:

1. **Generate Camera Hub Config**
   - Find your site config in site configs
   - Download as XLSX (File > Download > Microsoft Excel)
   - Import to portal config generator (Admin Tools > Import XLSX)
   - Export FLIv2 Camera XML config
   - Select target server

2. **Download Required Files** (if not using Google Drive auth)
   - Extra DLLs zip
   - Latest ONNX models
   - TensorRT build tools
   - FLIv2 MSI installer
   - FLIv2 Viewer
   - After extracting the FLIv2-dlls zip into `C:\Program Files\Ensight\FLIv2\FLIv2-dlls`, move all DLLs up one level into `C:\Program Files\Ensight\FLIv2`

### Running the Installer

1. **Launch** - Double-click `FLIv2 Installer.exe`

2. **Pre-Installation Checklist** - Confirm you've completed manual steps

3. **Google Drive Auth** (Optional)
   - Enter credentials to auto-download files
   - Or skip and select files manually

4. **Configure Installation**
   - Click "Configure Steps" to select what to install
   - All steps are selected by default

5. **Install**
   - Click "Start Installation"
   - Monitor progress in real-time
   - Wait for completion

### After Installation

- Check FLI log to ensure FLI booted correctly
- Launch FLIv2 Viewer from `C:\Ensight\FLI\Ensight.FLI2.Viewer.exe`
- Verify .NET 8 runtime is installed (viewer will prompt if needed)

## Configuration Notes

### Important Paths Created:
- `C:\Ensight\CameraHub` - Camera Hub config
- `C:\Program Files\Ensight\FLIv2` - FLIv2 program files
- `C:\Ensight\FLI\Models\onnx` - ONNX models
- `C:\Ensight\FLI\Models\TensorRT` - TensorRT engines
- `C:\Ensight\FLI\Config` - FLI configuration

### Recordings Folder:
- Default: `D:\videos`
- Modify in Camera Hub config if needed
- In FLIv2, recordings root is global (not per camera)

### TensorRT Model:
- Requires TensorRT v10
- Existing FLI TensorRT models need rebuilding
- Model file copied as `ensight-fli.engine` for tracking

## Troubleshooting

### Installation Fails
- Check Windows permissions (Run as Administrator if needed)
- Verify all prerequisite files are available
- Check installation logs

### TensorRT Build Fails
- Ensure TensorRT tools are in `C:\Ensight\FLI\Models\TensorRT\TensorRT-model-building-1013`
- Confirm `trtexec.exe` exists in that folder (the installer runs it from there)
- If `trtexec.exe` lives elsewhere, copy it into the build tools folder or add its directory to PATH
- Verify ONNX model is valid
- Check command prompt output for errors

### FLIv2 Won't Start
- Verify FLI-config.xml exists
- Check FLI is licensed (.NET5 runtime required)
- Review FLI logs for errors

### Viewer Won't Start
- Install .NET 8 Desktop Runtime
- Check viewer file location
- Verify FLI service is running

## Support

For issues or questions, contact the Ensight development team.
