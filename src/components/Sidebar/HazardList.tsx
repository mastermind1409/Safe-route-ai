import { AlertTriangle, ThumbsUp, Clock } from 'lucide-react';
import type { Hazard } from '../../types';

interface HazardListProps {
    hazards: Hazard[];
    onUpvote: (id: string) => void;
}

const typeColors: Record<string, string> = {
    dark_stretch: 'bg-red-100 text-red-700',
    broken_streetlight: 'bg-amber-100 text-amber-700',
    harassment_concern: 'bg-rose-100 text-rose-700',
};

const typeLabels: Record<string, string> = {
    dark_stretch: 'Dark Stretch',
    broken_streetlight: 'Broken Light',
    harassment_concern: 'Harassment',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function HazardList({ hazards, onUpvote }: HazardListProps) {
    const sorted = [...hazards].sort(
        (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );

    return (
        <div className="bg-surface border border-border-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-heading uppercase tracking-wider">
                    Community Hazard Feed
                </h4>
                <span className="text-[10px] text-slate-muted bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {hazards.length} report{hazards.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto sidebar-scroll pr-1">
                {sorted.map((hazard) => (
                    <div
                        key={hazard.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-md border border-border-light hover:bg-slate-50 transition-colors"
                    >
                        <div className="mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeColors[hazard.type] ?? 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    {typeLabels[hazard.type] ?? hazard.type}
                                </span>
                                <span className="text-[10px] text-slate-muted flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {timeAgo(hazard.reportedAt)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-body truncate">{hazard.label}</p>
                        </div>
                        <button
                            onClick={() => onUpvote(hazard.id)}
                            className="flex items-center gap-1 px-1.5 py-1 rounded text-xs text-slate-muted hover:text-brand-teal hover:bg-teal-50 transition-colors shrink-0"
                            title="Verify this report"
                        >
                            <ThumbsUp className="w-3 h-3" />
                            <span className="font-medium">{hazard.upvotes}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
