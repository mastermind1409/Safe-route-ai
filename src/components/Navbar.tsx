import { useRef } from 'react';
import { Navigation, Radio, Play, Pause, ShieldAlert, Map, BarChart3, Sparkles, Eye } from 'lucide-react';

export type ActiveTab = 'map' | 'dashboard';

interface NavbarProps {
    gpsActive: boolean;
    simulating: boolean;
    activeTab: ActiveTab;
    onToggleSimulation: () => void;
    onSOS: () => void;
    onTabChange: (tab: ActiveTab) => void;
    onDemo: () => void;
    highContrast: boolean;
    onToggleContrast: () => void;
}

export default function Navbar({
    gpsActive,
    simulating,
    activeTab,
    onToggleSimulation,
    onSOS,
    onTabChange,
    onDemo,
    highContrast,
    onToggleContrast,
}: NavbarProps) {
    const sosHoldTimer = useRef<number | null>(null);

    const startSOSHold = () => {
        if (sosHoldTimer.current !== null) return;
        sosHoldTimer.current = window.setTimeout(() => {
            sosHoldTimer.current = null;
            onSOS();
        }, 800);
    };

    const cancelSOSHold = () => {
        if (sosHoldTimer.current !== null) {
            window.clearTimeout(sosHoldTimer.current);
            sosHoldTimer.current = null;
        }
    };

    return (
        <header className="relative z-50 flex h-auto min-h-14 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border-light bg-surface px-2 py-1.5 xl:h-14 xl:flex-nowrap xl:gap-4 xl:px-4 xl:py-0">
            {/* Brand */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-heading leading-tight tracking-tight">
                        SafeRoute AI
                    </span>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="order-last flex w-full items-center rounded-lg bg-slate-100 p-0.5 xl:order-none xl:ml-4 xl:w-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onTabChange('map'); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors xl:flex-initial xl:px-3 ${activeTab === 'map'
                            ? 'bg-surface text-slate-heading shadow-sm'
                            : 'text-slate-muted hover:text-slate-body'
                        }`}
                >
                    <Map className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Navigation &amp; Map</span>
                    <span className="xl:hidden">Map</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onTabChange('dashboard'); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors xl:flex-initial xl:px-3 ${activeTab === 'dashboard'
                            ? 'bg-surface text-slate-heading shadow-sm'
                            : 'text-slate-muted hover:text-slate-body'
                        }`}
                >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Civic Safety Dashboard</span>
                    <span className="xl:hidden">Dashboard</span>
                </button>
            </div>

            {/* GPS Status Chip */}
            <div
                className={`ml-auto flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium xl:px-2.5 ${gpsActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
            >
                <Radio className="w-3 h-3" />
                <span className="hidden sm:inline">{gpsActive ? 'GPS Active' : 'GPS Pending'}</span>
            </div>

            {/* Simulate Walk Toggle */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDemo(); }}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                title="Run the guided hackathon demo"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Demo Mode
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleContrast(); }}
                aria-pressed={highContrast}
                className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex ${highContrast
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-surface text-slate-body border-border-light hover:bg-slate-50'
                    }`}
                title="Toggle high contrast mode"
            >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Contrast</span>
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleSimulation(); }}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors xl:px-3 ${simulating
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-surface text-slate-body border-border-light hover:bg-slate-50'
                    }`}
            >
                {simulating ? (
                    <Pause className="w-3.5 h-3.5" />
                ) : (
                    <Play className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{simulating ? 'Stop Walk' : 'Simulate Walk'}</span>
            </button>

            {/* SOS Button */}
            <button
                type="button"
                onPointerDown={(event) => {
                    event.stopPropagation();
                    startSOSHold();
                }}
                onPointerUp={cancelSOSHold}
                onPointerLeave={cancelSOSHold}
                onPointerCancel={cancelSOSHold}
                onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                        event.preventDefault();
                        startSOSHold();
                    }
                }}
                onKeyUp={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        cancelSOSHold();
                    }
                }}
                aria-label="Press and hold for 800 milliseconds to open emergency options"
                title="Press and hold for emergency options"
                className="flex select-none touch-manipulation items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-crimson text-white hover:bg-brand-crimson-dark active:bg-red-900 transition-colors"
            >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden min-[360px]:inline xl:hidden">Hold</span>
                <span className="hidden xl:inline">Hold for Help</span>
            </button>
        </header>
    );
}
