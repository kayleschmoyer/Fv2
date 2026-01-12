# FLIv2 Installer

A modern, high-tech installer application for FLIv2 with automated setup, built with Electron, React, and TypeScript.

![FLIv2 Installer](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## ✨ Features

- **Modern AI-Inspired UI** - Glassmorphism design with gradient effects and smooth animations
- **Pre-Installation Checklist** - Verify manual steps before automated installation begins
- **Google Drive Integration** - Optional authentication to download required files
- **Selectable Installation Steps** - Choose which components to install
- **Real-Time Progress Tracking** - Visual feedback for each installation step
- **Automated File Operations** - Automatic folder creation, file placement, and configuration
- **TensorRT Model Building** - Automated ONNX to TensorRT conversion
- **Custom Title Bar** - Frameless window with custom controls

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Windows OS (for FLIv2 installation)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fv2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run package:win
   ```

   The installer will be created in the `release` directory.

### Google OAuth Setup

To enable Google Drive downloads, you need to configure OAuth2 credentials:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Drive API**
   - Navigate to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
   - Search for "Google Drive API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure the OAuth consent screen:
     - User Type: External (or Internal if using Google Workspace)
     - Add app name, user support email, and developer contact
     - Add scope: `https://www.googleapis.com/auth/drive.readonly`
   - Choose "Desktop app" as the application type
   - Add `http://localhost:3000/oauth2callback` as an authorized redirect URI
   - Click "Create"

4. **Configure Application**
   - Copy the Client ID and Client Secret
   - Create a `.env` file in the project root (already created if you followed installation steps)
   - Replace the placeholder values:
     ```
     GOOGLE_CLIENT_ID=your_actual_client_id_here
     GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
     ```

5. **Restart the Application**
   - After configuring the `.env` file, restart the development server or rebuild the app

**Troubleshooting:**
- **Error 401: invalid_client** - Verify your Client ID and Client Secret are correct in `.env`
- **OAuth client was not found** - Ensure the credentials exist in Google Cloud Console and haven't been deleted
- **Redirect URI mismatch** - Verify `http://localhost:3000/oauth2callback` is added as an authorized redirect URI

## 📁 Project Structure

```
Fv2/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   └── preload.ts        # Preload script for IPC
├── src/                  # React application
│   ├── components/       # React components
│   │   ├── TitleBar.tsx
│   │   ├── PreInstallCheck.tsx
│   │   ├── GoogleAuth.tsx
│   │   └── InstallationSteps.tsx
│   ├── store/           # State management (Zustand)
│   │   └── installStore.ts
│   ├── utils/           # Utility functions
│   │   └── installer.ts # Installation logic
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 How It Works

### Step 1: Pre-Installation Checklist

The installer first asks users to confirm they've completed manual prerequisite steps:
- Generated Camera Hub config and placed it on the server
- Downloaded site config from xlsx and imported it into portal config generator

Users must check off these items before proceeding.

### Step 2: Google Drive Authentication (Optional)

Users can optionally provide Google credentials to enable automatic downloads from Google Drive. Features:
- Credential saving for future use
- Option to skip and download files manually

### Step 3: Automated Installation

The installer performs the following steps (selectable):

1. **Create Camera Hub Directory** - `C:\Ensight\CameraHub`
2. **Place Camera XML Config** - User selects config file
3. **Download Extra DLLs** - Downloads required DLL package
4. **Create FLIv2 Directory** - `C:\Program Files\Ensight\FLIv2`
5. **Place DLLs** - Moves DLLs to program files
6. **Create Models Directory** - `C:\Ensight\FLI\Models\onnx`
7. **Download ONNX Models** - Latest datature-yolo8m model
8. **Download TensorRT Build Tools** - TensorRT v10 tools
9. **Build TensorRT Model** - Converts ONNX to TensorRT engine
10. **Place TensorRT Model** - Moves .engine file and creates ensight-fli.engine
11. **Verify FLI Config** - Checks for FLI-config.xml
12. **Download FLIv2 MSI** - Latest FLIv2 installer
13. **Install FLIv2** - Runs MSI installer
14. **Download FLIv2 Viewer** - Places viewer in C:\Ensight\FLI
15. **Verify Installation** - Final checks

## 🎨 UI Design

The installer features a modern, AI-company aesthetic:

- **Glassmorphism Effects** - Frosted glass appearance with backdrop blur
- **Gradient Accents** - Purple, pink, and cyan gradients throughout
- **Smooth Animations** - Framer Motion for fluid transitions
- **Custom Scrollbars** - Gradient-styled scrollbars
- **Animated Progress** - Real-time progress indicators
- **Glow Effects** - Pulsing glow on active elements

## 🔧 Configuration

### Google Drive File IDs

Update the file IDs in `src/utils/installer.ts`:

```typescript
const DRIVE_FILES = {
  extraDlls: 'YOUR_FILE_ID',
  tensorRtTools: '1SHbHNGEv0Qn3xiMZqvENkD_L4UvofnKQ',
  onnxModels: 'YOUR_FILE_ID',
  fliv2Msi: 'YOUR_FILE_ID',
  fliv2Viewer: 'YOUR_FILE_ID',
};
```

### Installation Paths

Paths can be customized in `src/utils/installer.ts`:

```typescript
const PATHS = {
  cameraHub: 'C:\\Ensight\\CameraHub',
  programFiles: 'C:\\Program Files\\Ensight\\FLIv2',
  modelsOnnx: 'C:\\Ensight\\FLI\\Models\\onnx',
  // ... etc
};
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run package` - Package as Electron app
- `npm run package:win` - Package for Windows

### Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - State management
- **Lucide React** - Icon library

## 📝 Notes

- The installer requires Windows for FLIv2 installation
- Some steps require user file selection (config files, downloaded packages)
- TensorRT model building requires TensorRT v10 tools
- FLI licensing requires .NET5 desktop runtime
- FLIv2 Viewer requires .NET 8 desktop runtime

## 🔒 Security

- Google credentials are stored locally only
- No external transmission of credentials
- Optional credential saving with user consent
- All file operations are sandboxed to Electron's IPC

## 📄 License

ISC

## 🤝 Contributing

This is an internal Ensight tool. For issues or improvements, contact the development team.

---

**Powered by Ensight AI** 🚀