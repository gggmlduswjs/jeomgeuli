import { useEffect } from 'react';

interface ToastA11yProps {
  message: string;
  isVisible: boolean;
  duration?: number;
  onClose: () => void;
}

export default function ToastA11y({ 
  message, 
  isVisible, 
  duration = 3000, 
  onClose 
}: ToastA11yProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-lg"
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}