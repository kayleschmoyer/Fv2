import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Save, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useInstallStore } from '../store/installStore';

const GoogleAuth = () => {
  const {
    setCurrentStep,
    googleCredentials,
    setGoogleCredentials,
    saveCredentials,
    setSaveCredentials,
  } = useInstallStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to load saved credentials
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const result = await window.electronAPI?.loadCredentials();
      if (result?.success && result.credentials) {
        setEmail(result.credentials.email || '');
        setPassword(result.credentials.password || '');
        setGoogleCredentials(result.credentials);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      return;
    }

    setLoading(true);

    try {
      const credentials = { email, password };

      // Save credentials if requested
      if (saveCredentials) {
        await window.electronAPI?.saveCredentials(credentials);
      }

      setGoogleCredentials(credentials);

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('install');
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentStep('install');
  };

  return (
    <div className="glass p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-ensight mb-4 text-white">
            <Key size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-ensight bg-clip-text text-transparent">
            Google Drive Access
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Enter your Google credentials to download installation files
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-light-text-secondary dark:text-dark-text-secondary">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 rounded-xl glass border border-light-border dark:border-dark-border focus:border-ensight-blue focus:outline-none transition-colors text-light-text dark:text-dark-text placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-light-text-secondary dark:text-dark-text-secondary">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl glass border border-light-border dark:border-dark-border focus:border-ensight-blue focus:outline-none transition-colors text-light-text dark:text-dark-text placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary"
            />
          </div>

          <div className="flex items-center space-x-3 glass p-4 rounded-xl">
            <input
              type="checkbox"
              id="save-credentials"
              checked={saveCredentials}
              onChange={(e) => setSaveCredentials(e.target.checked)}
              className="w-5 h-5 rounded border-light-border dark:border-dark-border text-ensight-blue focus:ring-ensight-blue focus:ring-offset-0"
            />
            <label htmlFor="save-credentials" className="flex items-center space-x-2 cursor-pointer flex-1">
              <Save size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
              <span className="text-light-text-secondary dark:text-dark-text-secondary">Save credentials for future use</span>
            </label>
          </div>

          <div className="glass p-4 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <p className="font-medium mb-1">Note about Google Drive access:</p>
                <p>
                  This installer needs access to Google Drive to download required files.
                  Your credentials are only used locally and never transmitted externally.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep('pre-check')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="btn-secondary"
            >
              Skip (Manual Download)
            </button>
            <button
              onClick={handleAuth}
              disabled={!email || !password || loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleAuth;
