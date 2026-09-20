import { Navigation, Radio, Play, Pause, ShieldAlert, Map, BarChart3 } from 'lucide-react';

export type ActiveTab = 'map' | 'dashboard';

interface NavbarProps {
    gpsActive: boolean;
    simulating: boolean;
    activeTab: ActiveTab;
    onToggleSimulation: () => void;
    onSOS: () => void;
    onTabChange: (tab: ActiveTab) => void;
}

export default function Navbar({
    gpsActive,
    simulating,
    activeTab,
    onToggleSimulation,
    onSOS,
    onTabChange,
}: NavbarProps) {
    return (
        <header className="h-14 bg-surface border-b border-border-light flex items-center px-4 gap-4 shrink-0 z-50">
            {/* Brand */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-heading leading-tight tracking-tight">
                        SafeRoute AI
                    </span>
                    <span className="text-[10px] text-slate-muted leading-tight">
                        HACKDAY 1.0
                    </span>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-4">
                <button
                    onClick={(e) => { e.stopPropagation(); onTabChange('map'); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'map'
                            ? 'bg-surface text-slate-heading shadow-sm'
                            : 'text-slate-muted hover:text-slate-body'
                        }`}
                >
                    <Map className="w-3.5 h-3.5" />
                    Navigation & Map
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onTabChange('dashboard'); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'dashboard'
                            ? 'bg-surface text-slate-heading shadow-sm'
                            : 'text-slate-muted hover:text-slate-body'
                        }`}
                >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Civic Safety Dashboard
                </button>
            </div>

            {/* GPS Status Chip */}
            <div
                className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${gpsActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
            >
                <Radio className="w-3 h-3" />
                {gpsActive ? 'GPS Active' : 'GPS Pending'}
            </div>

            {/* Simulate Walk Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleSimulation(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${simulating
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-surface text-slate-body border-border-light hover:bg-slate-50'
                    }`}
            >
                {simulating ? (
                    <Pause className="w-3.5 h-3.5" />
                ) : (
                    <Play className="w-3.5 h-3.5" />
                )}
                {simulating ? 'Stop Walk' : 'Simulate Walk'}
            </button>

            {/* SOS Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onSOS(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-crimson text-white hover:bg-brand-crimson-dark transition-colors"
            >
                <ShieldAlert className="w-3.5 h-3.5" />
                Discreet SOS
            </button>
        </header>
    );
}
