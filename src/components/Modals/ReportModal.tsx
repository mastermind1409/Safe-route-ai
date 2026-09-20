import { useState } from 'react';
import { X, MapPin, AlertTriangle } from 'lucide-react';
import type { Coordinates, HazardType, Severity, HazardReport } from '../../types';

interface ReportModalProps {
    open: boolean;
    selectedPosition: Coordinates | null;
    onClose: () => void;
    onSubmit: (report: HazardReport) => void;
}

const hazardTypes: { value: HazardType; label: string }[] = [
    { value: 'dark_stretch', label: 'Dark Stretch' },
    { value: 'broken_streetlight', label: 'Broken Streetlight' },
    { value: 'harassment_concern', label: 'Harassment Concern' },
];

const severityLevels: { value: Severity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'border-amber-300 bg-amber-50 text-amber-700' },
    { value: 'moderate', label: 'Moderate', color: 'border-orange-300 bg-orange-50 text-orange-700' },
    { value: 'high', label: 'High', color: 'border-red-300 bg-red-50 text-red-700' },
];

export default function ReportModal({
    open,
    selectedPosition,
    onClose,
    onSubmit,
}: ReportModalProps) {
    const [type, setType] = useState<HazardType>('dark_stretch');
    const [severity, setSeverity] = useState<Severity>('moderate');

    if (!open) return null;

    const handleSubmit = () => {
        onSubmit({ type, severity, position: selectedPosition });
        setType('dark_stretch');
        setSeverity('moderate');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
            />
            {/* Modal */}
            <div className="relative bg-surface rounded-xl border border-border-light shadow-lg w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-brand-crimson" />
                        <h2 className="text-base font-semibold text-slate-heading">
                            Report Hazard
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-muted" />
                    </button>
                </div>

                {/* Drop pin location */}
                <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-md bg-slate-50 border border-border-light text-xs text-slate-body">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                    {selectedPosition ? (
                        <span>
                            Pin: {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)}
                        </span>
                    ) : (
                        <span className="text-slate-muted">Click on the map to drop a pin first</span>
                    )}
                </div>

                {/* Issue Type */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-heading mb-2">
                        Issue Type
                    </label>
                    <div className="flex flex-col gap-1.5">
                        {hazardTypes.map((ht) => (
                            <label
                                key={ht.value}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${type === ht.value
                                        ? 'border-brand-teal bg-teal-50/50 text-brand-teal font-medium'
                                        : 'border-border-light text-slate-body hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="hazard-type"
                                    value={ht.value}
                                    checked={type === ht.value}
                                    onChange={() => setType(ht.value)}
                                    className="sr-only"
                                />
                                {ht.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Severity */}
                <div className="mb-5">
                    <label className="block text-xs font-medium text-slate-heading mb-2">
                        Severity
                    </label>
                    <div className="flex gap-2">
                        {severityLevels.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setSeverity(s.value)}
                                className={`flex-1 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${severity === s.value ? s.color : 'border-border-light text-slate-muted hover:bg-slate-50'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm rounded-md border border-border-light text-slate-body hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedPosition}
                        className="flex-1 px-4 py-2 text-sm rounded-md font-semibold bg-brand-crimson text-white hover:bg-brand-crimson-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
}
