import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import PreInstallCheck from './components/PreInstallCheck';
import InstallationSteps from './components/InstallationSteps';
import { useInstallStore } from './store/installStore';
import { useThemeStore } from './store/themeStore';

function App() {
  const { currentStep } = useInstallStore();
  const { theme, setTheme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = useThemeStore.getState().theme;
    document.documentElement.classList.add(savedTheme);
  }, []);

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-light-bg dark:bg-dark-bg">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Background Effects - subtle gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-hero-glow opacity-70 dark:opacity-90" />
        <div className="absolute inset-0 futuristic-grid opacity-40 dark:opacity-60" />
        <div className="absolute inset-0 scanline-overlay opacity-30" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-ensight-blue/20 dark:bg-ensight-blue/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-ensight-blue-light/20 dark:bg-ensight-blue-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-ensight-blue-dark/20 dark:bg-ensight-blue-dark/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow animation-delay-4000" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-ensight-blue/20 blur-[120px] animate-float" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative z-10 flex items-start justify-center p-8 pt-12 pb-16 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 'pre-check' && (
            <motion.div
              key="pre-check"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <PreInstallCheck />
            </motion.div>
          )}

          {currentStep === 'install' && (
            <motion.div
              key="install"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-6xl h-full min-h-0"
            >
              <InstallationSteps />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 text-center text-light-text-tertiary dark:text-dark-text-tertiary text-sm">
        <p>FLIv2 Installer v1.0 • Powered by Ensight AI</p>
      </div>
    </div>
  );
}

export default App;
