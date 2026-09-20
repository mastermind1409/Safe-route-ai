import { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const iconMap = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
};

const bgMap = {
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-sky-50 border-sky-300 text-sky-900',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
};

export default function Toast({ toasts, onDismiss }: ToastProps) {
    return (
        <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}) {
    const Icon = iconMap[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`toast-enter flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md ${bgMap[toast.type]}`}
        >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
