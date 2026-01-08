import { Minimize2, Maximize2, X } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: any;
  }
}

const TitleBar = () => {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="h-12 glass flex items-center justify-between px-4 select-none drag-region">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ai-purple to-ai-pink flex items-center justify-center font-bold text-sm">
          F2
        </div>
        <span className="font-semibold text-white">FLIv2 Installer</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors no-drag"
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors no-drag"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-lg hover:bg-red-500/50 flex items-center justify-center transition-colors no-drag"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        .drag-region {
          -webkit-app-region: drag;
        }
        .no-drag {
          -webkit-app-region: no-drag;
        }
      `}</style>
    </div>
  );
};

export default TitleBar;
