import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Shield, HardDrive, AlertTriangle } from 'lucide-react';

const HealthCheck = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setHealth(data);
            } catch (e) {
                console.error("Health check failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-xs text-slate-600 animate-pulse">Checking system...</div>;

    if (!health) return (
        <div className="flex items-center gap-2 text-red-500 bg-red-950/20 px-3 py-2 rounded-lg text-xs font-bold border border-red-900/50 w-full justify-center">
            <AlertTriangle size={14} />
            Offline
        </div>
    );

    const isHealthy = health.system_status === 'healthy';

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Main Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${isHealthy
                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30'
                : 'text-orange-400 bg-orange-950/20 border-orange-900/30'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
                <span className="flex-1 uppercase">{isHealthy ? 'System Online' : 'System Issues'}</span>
                <Activity size={14} />
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                {/* DB */}
                <div className="flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded border border-slate-800/50" title="Database">
                    <Database size={12} className={health.database === 'connected' ? 'text-emerald-500' : 'text-red-500'} />
                    <span>DB: {health.database === 'connected' ? 'OK' : 'ERR'}</span>
                </div>

                {/* AD */}
                <div className="flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded border border-slate-800/50" title="Active Directory">
                    <Shield size={12} className={health.ad_connection.includes('mock') ? 'text-blue-500' : 'text-emerald-500'} />
                    <span>{health.ad_connection === 'mock_mode' ? 'MOCK' : 'REAL'}</span>
                </div>

                {/* Agents */}
                <div className="flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded border border-slate-800/50" title="Online Agents">
                    <Server size={12} className={health.agents_online > 0 ? 'text-emerald-500' : 'text-slate-600'} />
                    <span>{health.agents_online}/{health.agents_total} AGT</span>
                </div>

                {/* Disk */}
                <div className="flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded border border-slate-800/50" title="Disk Free">
                    <HardDrive size={12} className="text-purple-500" />
                    <span>{health.disk_space.split(' ')[0]} GB</span>
                </div>
            </div>
        </div>
    );
};

export default HealthCheck;
