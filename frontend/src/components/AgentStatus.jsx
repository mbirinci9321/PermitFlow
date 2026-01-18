import React, { useEffect, useState } from 'react';
import { Server, Activity, Clock, Zap, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AgentStatus = () => {
    const [agents, setAgents] = useState([]);
    const [scanningAgent, setScanningAgent] = useState(null);
    const { addToast } = useToast();

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            const data = await res.json();
            setAgents(data);
        } catch (e) {
            console.error("Failed to fetch agents", e);
        }
    };

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const handleScan = async (agentId) => {
        setScanningAgent(agentId);
        addToast(`Scanning shares on ${agentId}...`, "info");
        try {
            const res = await fetch(`/api/agents/${agentId}/scan`, { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                addToast(`Found ${data.count} shares on ${agentId}. Inventory updated.`, "success");
            } else {
                addToast(`Scan failed: ${data.error}`, "error");
            }
        } catch (e) {
            addToast(`Connection error during scan`, "error");
        } finally {
            setScanningAgent(null);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Server className="text-blue-500" />
                Connected Agents
            </h2>

            <div className="mb-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex justify-between items-center">
                <div>
                    <h3 className="text-white font-semibold">Deploy New Agent</h3>
                    <p className="text-slate-400 text-sm">Download the installer script to run on your target servers.</p>
                </div>
                <a
                    href="/static/install_agent.ps1"
                    download
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Server size={18} />
                    Download Installer (.ps1)
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div key={agent.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden group">
                        {/* Status Indicator */}
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity ${agent.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></div>

                        <div className="flex justify-between items-start mb-4 relative">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{agent.hostname}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full border ${agent.status === 'online'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {agent.status.toUpperCase()}
                                    </span>
                                    <span className="text-slate-500 font-mono">{agent.id}</span>
                                </div>
                            </div>
                            <Activity className={agent.status === 'online' ? 'text-emerald-500' : 'text-slate-600'} />
                        </div>

                        <div className="space-y-3 relative">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Clock size={14} />
                                <span>Last Heartbeat:</span>
                                <span className="text-slate-200">
                                    {new Date(agent.last_heartbeat).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Zap size={14} />
                                <span>Version:</span>
                                <span className="text-slate-200">v1.2.0</span>
                            </div>
                        </div>

                        {/* Scan Button */}
                        <div className="mt-6 relative">
                            <button
                                onClick={() => handleScan(agent.id)}
                                disabled={scanningAgent === agent.id || agent.status !== 'online'}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all ${scanningAgent === agent.id
                                    ? 'bg-slate-800 text-slate-500 cursor-wait'
                                    : agent.status === 'online'
                                        ? 'bg-teal-600/10 hover:bg-teal-600 text-teal-500 hover:text-white border border-teal-500/30'
                                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                    }`}
                            >
                                <Search size={16} />
                                {scanningAgent === agent.id ? "Scanning..." : "Scan & Index Shares"}
                            </button>
                        </div>
                    </div>
                ))}

                {agents.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        <Server size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-slate-400 font-medium">No Agents Connected</h3>
                        <p className="text-slate-600 text-sm mt-2">Start the python agent script to connect.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentStatus;
