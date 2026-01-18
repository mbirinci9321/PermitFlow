import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const HistoryLog = () => {
    const [history, setHistory] = useState([]);
    const [selectedAction, setSelectedAction] = useState(null); // For Rollback Modal
    const [confirmCheck, setConfirmCheck] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            // Ensure data is an array
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                console.error("History data is not an array:", data);
                setHistory([]);
            }
        } catch (error) {
            console.error(error);
            setHistory([]);
        }
    };

    const handleRollback = async () => {
        if (!selectedAction || !confirmCheck) return;

        try {
            const res = await fetch(`/api/history/${selectedAction.id}/rollback`, { method: 'POST' });
            if (!res.ok) throw new Error("Rollback request failed");

            setSelectedAction(null);
            setConfirmCheck(false);
            addToast("Rollback initiated successfully.", "success");
            fetchHistory(); // Refresh
        } catch (e) {
            addToast("Rollback failed: " + e.message, "error");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Operations History</h2>
                <button onClick={fetchHistory} className="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                    <Clock size={16} /> Refresh
                </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-slate-400 font-medium text-sm">Action ID</th>
                            <th className="p-4 text-slate-400 font-medium text-sm">Description</th>
                            <th className="p-4 text-slate-400 font-medium text-sm">Timestamp</th>
                            <th className="p-4 text-slate-400 font-medium text-sm">Status</th>
                            <th className="p-4 text-slate-400 font-medium text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {history.map((action) => (
                            <tr key={action.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-slate-500 font-mono text-xs">#{action.id}</td>
                                <td className="p-4 text-slate-200 font-medium">{action.description}</td>
                                <td className="p-4 text-slate-500 text-sm">
                                    {new Date(action.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    {action.status === 'success' && (
                                        <span className="flex items-center gap-1 text-emerald-400 text-xs px-2 py-1 bg-emerald-950/30 rounded-full w-fit">
                                            <CheckCircle size={12} /> Success
                                        </span>
                                    )}
                                    {action.status === 'rolled_back' && (
                                        <span className="flex items-center gap-1 text-orange-400 text-xs px-2 py-1 bg-orange-950/30 rounded-full w-fit">
                                            <RotateCcw size={12} /> Rolled Back
                                        </span>
                                    )}
                                    {action.status === 'pending' && (
                                        <span className="flex items-center gap-1 text-blue-400 text-xs px-2 py-1 bg-blue-950/30 rounded-full w-fit">
                                            <Clock size={12} /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {action.status === 'success' && (
                                        <button
                                            onClick={() => setSelectedAction(action)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ml-auto"
                                        >
                                            <RotateCcw size={14} /> Undo
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rollback Modal */}
            {selectedAction && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle size={32} />
                            <h3 className="text-xl font-bold">Confirm System Rollback</h3>
                        </div>

                        <p className="text-slate-300 mb-4">
                            You are about to undo <strong>Action #{selectedAction.id}</strong>.
                            This will permanently delete created AD groups and remove folders from the file server.
                        </p>

                        <div className="bg-red-500/10 border border-red-900/50 p-4 rounded-lg mb-6">
                            <ul className="text-sm text-red-400 space-y-2 list-disc pl-4">
                                <li>All NTFS permissions assigned in this batch will be revoked.</li>
                                <li>Created data folders will be unlinked (data preservation depends on Agent settings).</li>
                                <li>This action cannot be undone.</li>
                            </ul>
                        </div>

                        <div className="flex items-center gap-2 mb-6 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer" onClick={() => setConfirmCheck(!confirmCheck)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${confirmCheck ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                {confirmCheck && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-400 select-none">I understand the risks and confirm this rollback.</span>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setSelectedAction(null); setConfirmCheck(false); }}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRollback}
                                disabled={!confirmCheck}
                                className={`px-4 py-2 rounded-lg font-bold transition-all ${confirmCheck
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Execute Rollback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryLog;
