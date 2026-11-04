import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-pastel-blue flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-pastel-sageBorder text-app-text',
    error: 'bg-white border-pastel-roseBorder text-app-text',
    info: 'bg-white border-pastel-blueBorder text-app-text',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-soft-md ${bgStyles[toast.type]}`}
      >
        {icons[toast.type]}
        <span className="text-sm font-medium text-[#252525]">{toast.message}</span>
      </div>
    </div>
  );
};
