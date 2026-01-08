import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import PreInstallCheck from './components/PreInstallCheck';
import GoogleAuth from './components/GoogleAuth';
import InstallationSteps from './components/InstallationSteps';
import { useInstallStore } from './store/installStore';

function App() {
  const { currentStep } = useInstallStore();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-ai-purple/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-ai-pink/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-ai-cyan/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-8">
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

          {currentStep === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <GoogleAuth />
            </motion.div>
          )}

          {currentStep === 'install' && (
            <motion.div
              key="install"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-6xl"
            >
              <InstallationSteps />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 text-center text-white/40 text-sm">
        <p>FLIv2 Installer v1.0 • Powered by Ensight AI</p>
      </div>
    </div>
  );
}

export default App;
