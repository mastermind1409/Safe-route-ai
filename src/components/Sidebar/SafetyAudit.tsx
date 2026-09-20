import { Sun, ShieldCheck, Store } from 'lucide-react';
import type { SafetyBreakdown } from '../../types';

interface SafetyAuditProps {
    breakdown: SafetyBreakdown;
}

const meters = [
    { key: 'lighting' as const, label: 'Street Lighting', icon: Sun, color: 'bg-amber-500' },
    { key: 'policeProximity' as const, label: 'Police Proximity', icon: ShieldCheck, color: 'bg-brand-teal' },
    { key: 'commercialDensity' as const, label: 'Commercial Density', icon: Store, color: 'bg-brand-emerald' },
];

export default function SafetyAudit({ breakdown }: SafetyAuditProps) {
    return (
        <div className="bg-surface border border-border-light rounded-lg p-4">
            <h4 className="text-xs font-semibold text-slate-heading uppercase tracking-wider mb-3">
                Safety Audit
            </h4>
            <div className="flex flex-col gap-3">
                {meters.map(({ key, label, icon: Icon, color }) => (
                    <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-body">
                                <Icon className="w-3.5 h-3.5 text-slate-muted" />
                                {label}
                            </div>
                            <span className="text-xs font-semibold text-slate-heading">
                                {breakdown[key]}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${color}`}
                                style={{ width: `${breakdown[key]}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
