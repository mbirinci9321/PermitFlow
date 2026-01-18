import React, { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, Database, Server, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
            addToast("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // Save sequentially or parallel
            const promises = settings.map(s =>
                fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(s)
                })
            );
            await Promise.all(promises);
            addToast("Settings saved successfully!", "success");
        } catch (e) {
            console.error("Save error", e);
            addToast("Error saving settings", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-slate-400">Loading settings...</div>;

    const groups = {
        AD: settings.filter(s => s.key.startsWith('ad_')),
        FileServer: settings.filter(s => s.key.startsWith('fileserver_') || s.key.startsWith('agent_')),
        System: settings.filter(s => !s.key.startsWith('ad_') && !s.key.startsWith('fileserver_') && !s.key.startsWith('agent_'))
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <SettingsIcon className="text-purple-500" />
                        System Settings
                    </h2>
                    <p className="text-slate-400 mt-1">Configure your Active Directory and File Server connections.</p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </header>

            <div className="space-y-8">
                {/* Active Directory Section */}
                <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="text-blue-500" size={20} />
                        Active Directory Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.AD.map(s => (
                            <div key={s.key} className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 block">{s.description || s.key}</label>
                                <input
                                    type={s.key.includes('password') ? 'password' : 'text'}
                                    value={s.value}
                                    onChange={(e) => handleChange(s.key, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Agent Configuration Section */}
                <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Server className="text-green-500" size={20} />
                        Agent Configuration
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Install the PermitFlow Agent on each File Server you wish to manage. They will appear in the "Agent Status" page automatically.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.FileServer.map(s => (
                            <div key={s.key} className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 block">{s.description || s.key}</label>
                                <input
                                    type="text"
                                    value={s.value}
                                    onChange={(e) => handleChange(s.key, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* System Section */}
                <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Database className="text-orange-500" size={20} />
                        General System
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.System.map(s => (
                            <div key={s.key} className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 block">{s.description || s.key}</label>
                                {s.key === 'mock_mode' ? (
                                    <select
                                        value={s.value}
                                        onChange={(e) => handleChange(s.key, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    >
                                        <option value="true">Enabled (Simulation)</option>
                                        <option value="false">Disabled (Real Operations)</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={s.value}
                                        onChange={(e) => handleChange(s.key, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
