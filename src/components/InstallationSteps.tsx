import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Circle,
  Settings,
} from 'lucide-react';
import { useInstallStore } from '../store/installStore';
import { runInstallation } from '../utils/installer';

const InstallationSteps = () => {
  const { installSteps, toggleStepEnabled, isInstalling, setIsInstalling } = useInstallStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleStartInstall = async () => {
    setIsInstalling(true);
    await runInstallation();
    setIsInstalling(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-500" size={24} />;
      case 'running':
        return <Loader2 className="text-ai-purple animate-spin" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
      default:
        return <Circle className="text-white/30" size={24} />;
    }
  };

  const completedSteps = installSteps.filter((s) => s.status === 'completed').length;
  const totalEnabledSteps = installSteps.filter((s) => s.enabled).length;
  const overallProgress = totalEnabledSteps > 0 ? (completedSteps / totalEnabledSteps) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-purple to-ai-pink bg-clip-text text-transparent">
              FLIv2 Installation
            </h1>
            <p className="text-white/60 mt-1">
              {completedSteps} of {totalEnabledSteps} steps completed
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings size={20} />
              <span>Configure Steps</span>
            </button>

            <button
              onClick={handleStartInstall}
              disabled={isInstalling || totalEnabledSteps === 0}
              className="btn-primary flex items-center space-x-2"
            >
              {isInstalling ? (
                <>
                  <Pause size={20} />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Start Installation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-ai-purple to-ai-pink rounded-full"
          />
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Select Steps to Install</h3>
          <div className="grid grid-cols-2 gap-3">
            {installSteps.map((step) => (
              <label
                key={step.id}
                className="flex items-center space-x-3 p-3 rounded-xl glass-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={() => toggleStepEnabled(step.id)}
                  disabled={isInstalling}
                  className="w-5 h-5 rounded border-white/20 text-ai-purple focus:ring-ai-purple"
                />
                <span className="text-sm">{step.title}</span>
              </label>
            ))}
          </div>
        </motion.div>
      )}

      {/* Installation Steps */}
      <div className="glass p-6 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {installSteps
            .filter((step) => step.enabled)
            .map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  step.status === 'completed'
                    ? 'bg-green-500/5 border-green-500/30'
                    : step.status === 'running'
                    ? 'bg-ai-purple/5 border-ai-purple/30 animate-glow'
                    : step.status === 'error'
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-white/60 mt-1">{step.description}</p>
                      {step.message && (
                        <p className="text-xs text-white/40 mt-2">{step.message}</p>
                      )}
                    </div>
                  </div>

                  {step.progress !== undefined && step.status === 'running' && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">{step.progress}%</span>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${step.progress}%` }}
                          className="h-full bg-gradient-to-r from-ai-purple to-ai-pink"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="glass p-4 mt-6 flex justify-between items-center">
        <div className="text-sm text-white/60">
          {isInstalling ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Installation in progress...</span>
            </span>
          ) : overallProgress === 100 ? (
            <span className="text-green-500 font-medium">✓ Installation Complete!</span>
          ) : (
            <span>Ready to install</span>
          )}
        </div>

        <div className="flex space-x-3">
          {overallProgress === 100 && (
            <button className="btn-primary">View Logs</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallationSteps;
