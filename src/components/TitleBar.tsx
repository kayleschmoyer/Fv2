import { Minimize2, Maximize2, X, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

declare global {
  interface Window {
    electronAPI: any;
  }
}

const TitleBar = () => {
  const { theme, toggleTheme } = useThemeStore();

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
        <div className="w-8 h-8 rounded-lg bg-gradient-ensight flex items-center justify-center font-bold text-sm text-white">
          F2
        </div>
        <span className="font-semibold text-light-text dark:text-dark-text">FLIv2 Installer</span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover flex items-center justify-center transition-colors no-drag text-light-text dark:text-dark-text"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Window Controls */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 rounded-lg hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover flex items-center justify-center transition-colors no-drag text-light-text dark:text-dark-text"
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 rounded-lg hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover flex items-center justify-center transition-colors no-drag text-light-text dark:text-dark-text"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-lg hover:bg-red-500/50 flex items-center justify-center transition-colors no-drag text-light-text dark:text-dark-text"
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
