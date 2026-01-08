import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useInstallStore } from '../store/installStore';

const PreInstallCheck = () => {
  const { preCheckItems, updatePreCheckItem, setCurrentStep } = useInstallStore();
  const allChecked = preCheckItems.every((item) => item.checked);

  const handleNext = () => {
    if (allChecked) {
      setCurrentStep('auth');
    }
  };

  return (
    <div className="glass p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-ensight bg-clip-text text-transparent">
            Pre-Installation Checklist
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Please confirm you've completed the following manual steps before proceeding
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {preCheckItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass p-6 cursor-pointer transition-all duration-300 ${
                item.checked
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-light-border dark:border-dark-border hover:border-light-border-light dark:hover:border-dark-border-light'
              }`}
              onClick={() => updatePreCheckItem(item.id, !item.checked)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {item.checked ? (
                    <CheckCircle2 className="text-green-500" size={24} />
                  ) : (
                    <AlertCircle className="text-yellow-500" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-light-text dark:text-dark-text">{item.question}</h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!allChecked}
            className="btn-primary flex items-center space-x-2"
          >
            <span>Continue to Installation</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {!allChecked && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-500 text-sm text-center mt-4"
          >
            Please complete all checklist items to continue
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default PreInstallCheck;
