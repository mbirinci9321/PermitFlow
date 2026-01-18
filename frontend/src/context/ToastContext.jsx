import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success'
                                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                                : toast.type === 'error'
                                    ? 'bg-red-950/90 border-red-500/50 text-red-300'
                                    : 'bg-slate-800/90 border-slate-600/50 text-slate-200'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
                        {toast.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
                        {toast.type === 'info' && <Info size={18} className="text-blue-400" />}

                        <span className="font-medium text-sm flex-1">{toast.message}</span>

                        <button onClick={() => removeToast(toast.id)} className="hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
