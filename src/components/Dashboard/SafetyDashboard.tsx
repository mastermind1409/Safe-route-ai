import { useState, useMemo } from 'react';
import {
    MapPin,
    Shield,
    FileWarning,
    Zap,
    Lightbulb,
    Camera,
    Users,
    Download,
    ArrowUpRight,
    ArrowRight,
    CheckCircle2,
    Search as SearchIcon,
    AlertTriangle,
    Eye,
} from 'lucide-react';
import type { Hazard, Coordinates, Route } from '../../types';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────
interface IncidentRow {
    id: string;
    hazardType: string;
    location: string;
    ward: string;
    severity: 'High' | 'Medium' | 'Low';
    upvotes: number;
    status: 'Investigating' | 'Verified' | 'Resolved';
    reportedAt: string;
    position: Coordinates;
}

interface SafetyDashboardProps {
    hazards: Hazard[];
    onShowOnMap: (position: Coordinates) => void;
    selectedRoute: Route;
}

// ──────────────────────────────────────────────────
// Static KPI Data
// ──────────────────────────────────────────────────
const kpiCards = [
    {
        label: 'Audited Corridor Coverage',
        value: '14.8 km',
        subtext: '82% coverage across 6 active ward zones',
        icon: MapPin,
        accent: 'text-brand-teal',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
    },
    {
        label: 'Avg Route Safety Index',
        value: '78.4 / 100',
        subtext: '+6.2% improvement vs last month',
        icon: Shield,
        accent: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        trend: '+6.2%',
    },
    {
        label: 'Active Micro-Reports',
        value: '24 Active',
        subtext: '14 Resolved in last 48 hrs',
        icon: FileWarning,
        accent: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
    },
    {
        label: 'Emergency Dispatches',
        value: '0 Failures',
        subtext: 'Avg response trigger: 1.8s',
        icon: Zap,
        accent: 'text-brand-crimson',
        bg: 'bg-red-50',
        border: 'border-red-200',
    },
];

const infraMetrics = [
    {
        label: 'Streetlight Uptime',
        value: 84,
        detail: '16% blackouts reported',
        icon: Lightbulb,
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
    },
    {
        label: 'CCTV & Safe-Haven Proximity',
        value: 91,
        detail: '91% corridors within 150m of verified safe hubs',
        icon: Camera,
        color: 'bg-brand-teal',
        textColor: 'text-brand-teal',
    },
    {
        label: 'Crowd Footfall Density',
        value: 67,
        detail: 'Critical Low on 4 residential bypasses',
        icon: Users,
        color: 'bg-brand-emerald',
        textColor: 'text-brand-emerald',
    },
];

// ──────────────────────────────────────────────────
// Pre-seeded incident data (merges with live hazards)
// ──────────────────────────────────────────────────
const seededIncidents: IncidentRow[] = [
    {
        id: 'inc-1',
        hazardType: 'Dark Stretch',
        location: 'GN Chetty Road Back Lane',
        ward: 'T. Nagar - Ward 173',
        severity: 'High',
        upvotes: 14,
        status: 'Verified',
        reportedAt: '2026-09-19T22:15:00',
        position: [13.0445, 80.2372],
    },
    {
        id: 'inc-2',
        hazardType: 'Broken Streetlight',
        location: 'Habibullah Rd Junction',
        ward: 'T. Nagar - Ward 173',
        severity: 'Medium',
        upvotes: 8,
        status: 'Investigating',
        reportedAt: '2026-09-20T01:30:00',
        position: [13.0498, 80.2415],
    },
    {
        id: 'inc-3',
        hazardType: 'Dark Stretch',
        location: 'Nandanam Service Road',
        ward: 'Nandanam - Ward 174',
        severity: 'High',
        upvotes: 21,
        status: 'Verified',
        reportedAt: '2026-09-19T23:45:00',
        position: [13.0548, 80.2460],
    },
    {
        id: 'inc-4',
        hazardType: 'Harassment Concern',
        location: 'Narrow Alley off Usman Rd',
        ward: 'T. Nagar - Ward 173',
        severity: 'High',
        upvotes: 32,
        status: 'Resolved',
        reportedAt: '2026-09-18T21:00:00',
        position: [13.0472, 80.2395],
    },
    {
        id: 'inc-5',
        hazardType: 'Broken Streetlight',
        location: 'Usman Rd Bend',
        ward: 'T. Nagar - Ward 173',
        severity: 'Low',
        upvotes: 3,
        status: 'Resolved',
        reportedAt: '2026-09-20T06:00:00',
        position: [13.0438, 80.2310],
    },
    {
        id: 'inc-6',
        hazardType: 'Dark Stretch',
        location: 'Burkit Rd residential bypass',
        ward: 'T. Nagar - Ward 174',
        severity: 'Medium',
        upvotes: 6,
        status: 'Investigating',
        reportedAt: '2026-09-20T07:15:00',
        position: [13.0420, 80.2350],
    },
    {
        id: 'inc-7',
        hazardType: 'Harassment Concern',
        location: 'South Boag Rd underpass',
        ward: 'Nandanam - Ward 175',
        severity: 'High',
        upvotes: 18,
        status: 'Verified',
        reportedAt: '2026-09-19T20:10:00',
        position: [13.0505, 80.2445],
    },
    {
        id: 'inc-8',
        hazardType: 'Broken Streetlight',
        location: 'Pondy Bazaar Connector',
        ward: 'T. Nagar - Ward 173',
        severity: 'Low',
        upvotes: 2,
        status: 'Resolved',
        reportedAt: '2026-09-20T04:30:00',
        position: [13.0560, 80.2472],
    },
];

const typeLabels: Record<string, string> = {
    dark_stretch: 'Dark Stretch',
    broken_streetlight: 'Broken Streetlight',
    harassment_concern: 'Harassment Concern',
};

const severityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
};

const statusColors: Record<string, string> = {
    Investigating: 'bg-sky-100 text-sky-700',
    Verified: 'bg-amber-100 text-amber-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ──────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────
export default function SafetyDashboard({ hazards, onShowOnMap, selectedRoute }: SafetyDashboardProps) {
    const [filterSeverity, setFilterSeverity] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    // Merge seeded + live user-reported hazards into incident rows
    const allIncidents: IncidentRow[] = useMemo(() => {
        const liveIncidents: IncidentRow[] = hazards
            .filter((h) => h.id.startsWith('user-h-'))
            .map((h) => ({
                id: h.id,
                hazardType: typeLabels[h.type] ?? h.type,
                location: h.label,
                ward: 'T. Nagar - Ward 173',
                severity: (h.severity === 'high' ? 'High' : h.severity === 'moderate' ? 'Medium' : 'Low') as IncidentRow['severity'],
                upvotes: h.upvotes,
                status: 'Investigating' as const,
                reportedAt: h.reportedAt,
                position: h.position,
            }));
        return [...seededIncidents, ...liveIncidents];
    }, [hazards]);

    const liveKpiCards = useMemo(
        () => kpiCards.map((card) =>
            card.label === 'Active Micro-Reports'
                ? { ...card, value: `${hazards.length} Active`, subtext: `${allIncidents.length - hazards.length + 14} Resolved in last 48 hrs` }
                : card
        ),
        [hazards.length, allIncidents.length]
    );

    const filtered = useMemo(() => {
        return allIncidents.filter((row) => {
            if (filterSeverity !== 'All' && row.severity !== filterSeverity) return false;
            if (filterStatus !== 'All' && row.status !== filterStatus) return false;
            if (searchQuery && !row.location.toLowerCase().includes(searchQuery.toLowerCase()) && !row.hazardType.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [allIncidents, filterSeverity, filterStatus, searchQuery]);

    // Export handlers
    const exportCSV = () => {
        const header = 'Hazard Type,Location,Ward,Severity,Upvotes,Status,Reported At,Lat,Lng';
        const rows = allIncidents.map((r) =>
            `"${r.hazardType}","${r.location}","${r.ward}","${r.severity}",${r.upvotes},"${r.status}","${r.reportedAt}",${r.position[0]},${r.position[1]}`
        );
        const csv = [header, ...rows].join('\n');
        downloadFile(csv, 'saferoute-ward-safety-report.csv', 'text/csv');
    };

    const exportJSON = () => {
        const payload = {
            reportTitle: 'SafeRoute AI — Ward Safety Audit Report',
            generatedAt: new Date().toISOString(),
            wardZones: 6,
            corridorCoverage: '14.8 km',
            avgSafetyIndex: 78.4,
            incidents: allIncidents.map((r) => ({
                hazardType: r.hazardType,
                location: r.location,
                ward: r.ward,
                severity: r.severity,
                upvotes: r.upvotes,
                status: r.status,
                reportedAt: r.reportedAt,
                coordinates: { lat: r.position[0], lng: r.position[1] },
            })),
        };
        downloadFile(JSON.stringify(payload, null, 2), 'saferoute-ward-safety-report.json', 'application/json');
    };

    return (
        <div className="h-full min-h-0 w-full overflow-y-auto sidebar-scroll bg-canvas p-4 sm:p-6">
            <div className="mx-auto min-w-0 max-w-7xl space-y-6 pb-8">
                {/* Page Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-heading">
                            Civic Safety Analytics
                        </h1>
                        <p className="text-sm text-slate-muted mt-0.5">
                            Ward-level infrastructure audit and incident analytics
                        </p>
                        <p className="text-xs text-brand-teal font-medium mt-2">
                            Live route: {selectedRoute.name} · Safety score {selectedRoute.safetyScore}/100
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border-light text-slate-body hover:bg-slate-50 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export .CSV
                        </button>
                        <button
                            onClick={exportJSON}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-teal text-white hover:bg-brand-emerald transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export .JSON
                        </button>
                    </div>
                </div>

                {/* KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {liveKpiCards.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <div
                                key={kpi.label}
                                className={`bg-surface border ${kpi.border} rounded-lg p-4 flex flex-col gap-2`}
                                style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                                        <Icon className={`w-4 h-4 ${kpi.accent}`} />
                                    </div>
                                    {kpi.trend && (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                                            <ArrowUpRight className="w-3 h-3" />
                                            {kpi.trend}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-heading">{kpi.value}</p>
                                    <p className="text-xs text-slate-muted mt-0.5">{kpi.subtext}</p>
                                </div>
                                <p className="text-[10px] font-medium text-slate-muted uppercase tracking-wider mt-auto pt-1 border-t border-border-light">
                                    {kpi.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Infrastructure Health Breakdown */}
                <div className="bg-surface border border-border-light rounded-lg p-5" style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <h2 className="text-sm font-semibold text-slate-heading mb-4">
                        Infrastructure Health Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {infraMetrics.map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <div key={metric.label} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${metric.textColor}`} />
                                        <span className="text-sm font-medium text-slate-body">{metric.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${metric.color}`}
                                                style={{ width: `${metric.value}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-bold ${metric.textColor} w-12 text-right`}>
                                            {metric.value}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-muted">{metric.detail}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Incident Audit Table */}
                <div className="bg-surface border border-border-light rounded-lg overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    {/* Table Header */}
                    <div className="p-4 border-b border-border-light">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h2 className="text-sm font-semibold text-slate-heading">
                                Incident Log & Audit Trail
                                <span className="ml-2 text-xs font-normal text-slate-muted">
                                    ({filtered.length} of {allIncidents.length} records)
                                </span>
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative">
                                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search location..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-7 pr-3 py-1.5 text-xs border border-border-light rounded-md bg-surface focus:outline-none focus:border-brand-teal w-44"
                                    />
                                </div>
                                {/* Severity filter */}
                                <select
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="text-xs border border-border-light rounded-md px-2 py-1.5 bg-surface text-slate-body focus:outline-none focus:border-brand-teal"
                                >
                                    <option value="All">All Severity</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                {/* Status filter */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="text-xs border border-border-light rounded-md px-2 py-1.5 bg-surface text-slate-body focus:outline-none focus:border-brand-teal"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Investigating">Investigating</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-semibold text-slate-muted uppercase tracking-wider">
                                    <th className="px-4 py-3">Hazard Type</th>
                                    <th className="px-4 py-3">Location / Ward</th>
                                    <th className="px-4 py-3">Severity</th>
                                    <th className="px-4 py-3 text-center">Upvotes</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Reported</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                <span className="text-sm text-slate-body font-medium">{row.hazardType}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-slate-body">{row.location}</p>
                                            <p className="text-[10px] text-slate-muted">{row.ward}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${severityColors[row.severity]}`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-semibold text-slate-body">{row.upvotes}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${statusColors[row.status]}`}>
                                                {row.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                                                {row.status === 'Investigating' && <Eye className="w-3 h-3" />}
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-muted whitespace-nowrap">
                                            {formatDate(row.reportedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => onShowOnMap(row.position)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-brand-teal border border-teal-200 hover:bg-teal-50 transition-colors"
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                                Show on Map
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-muted">
                                            No incidents match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// Download helper
// ──────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
