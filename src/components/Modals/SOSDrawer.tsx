import { useEffect, useCallback } from 'react';
import { ShieldAlert, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Coordinates } from '../../types';

interface SOSDrawerProps {
    open: boolean;
    countdown: number;
    userPosition: Coordinates | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function SOSDrawer({
    open,
    countdown,
    userPosition,
    onCancel,
    onConfirm,
}: SOSDrawerProps) {
    const [copied, setCopied] = useState(false);

    const generatePayload = useCallback((): string => {
        const lat = userPosition ? userPosition[0].toFixed(6) : 'N/A';
        const lng = userPosition ? userPosition[1].toFixed(6) : 'N/A';
        const time = new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        return `EMERGENCY ALERT: Walking route #SR-104. Last known GPS: [${lat}, ${lng}] at ${time}. Live Route Track: https://saferoute.app/track/live-demo`;
    }, [userPosition]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatePayload());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select text
            const textarea = document.createElement('textarea');
            textarea.value = generatePayload();
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (open && countdown <= 0) {
            onConfirm();
        }
    }, [countdown, open, onConfirm]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

            {/* Drawer */}
            <div className="relative w-full max-w-lg bg-surface border-t border-border-light rounded-t-2xl shadow-xl p-6 pb-8">
                {/* Close */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-muted" />
                </button>

                {/* Icon & Title */}
                <div className="flex flex-col items-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3 sos-pulse">
                        <ShieldAlert className="w-7 h-7 text-brand-crimson" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-heading">
                        Emergency SOS Activated
                    </h2>
                    <p className="text-sm text-slate-muted mt-1 text-center">
                        An emergency dispatch will be triggered automatically.
                    </p>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center mb-5">
                    <div className="w-20 h-20 rounded-full border-4 border-brand-crimson flex items-center justify-center sos-pulse">
                        <span className="text-3xl font-bold text-brand-crimson">
                            {countdown}
                        </span>
                    </div>
                </div>
                <p className="text-center text-xs text-slate-muted mb-5">
                    SOS dispatches in {countdown} second{countdown !== 1 ? 's' : ''}. Press cancel to abort.
                </p>

                {/* Emergency Payload */}
                <div className="bg-slate-50 border border-border-light rounded-lg p-3 mb-5">
                    <p className="text-xs text-slate-body font-mono leading-relaxed break-all">
                        {generatePayload()}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-border-light text-slate-body hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-crimson text-white hover:bg-brand-crimson-dark transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy Emergency Payload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
