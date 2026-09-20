import { Clock, Ruler, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Route } from '../../types';

interface RouteCardProps {
    route: Route;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export default function RouteCard({ route, isSelected, onSelect }: RouteCardProps) {
    const scoreColor =
        route.safetyScore >= 80
            ? 'text-emerald-600'
            : route.safetyScore >= 60
                ? 'text-amber-600'
                : 'text-red-600';

    const scoreBg =
        route.safetyScore >= 80
            ? 'bg-emerald-50 border-emerald-200'
            : route.safetyScore >= 60
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200';

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={(event) => {
                event.stopPropagation();
                onSelect(route.id);
            }}
            className={`route-card w-full text-left p-4 rounded-lg border transition-all duration-150 ${isSelected
                    ? 'border-brand-teal bg-teal-50/40 shadow-sm'
                    : 'border-border-light bg-surface hover:border-slate-300'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-heading">
                        {route.name}
                    </h3>
                    <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${route.recommended
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        {route.tag}
                    </span>
                </div>
                <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-bold ${scoreBg} ${scoreColor}`}
                >
                    <Shield className="w-3.5 h-3.5" />
                    {route.safetyScore}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-muted">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>
                        {route.distance >= 1000
                            ? `${(route.distance / 1000).toFixed(2)} km`
                            : `${route.distance} m`}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{route.walkTime} min walk</span>
                </div>
            </div>

            {/* Hazards & Hubs */}
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{route.hazards.length} hazard{route.hazards.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>{route.safeHubs.length} safe hub{route.safeHubs.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </button>
    );
}
