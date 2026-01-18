import React, { useState } from 'react';
import { Search, Server, Folder, Shield, User, UserPlus } from 'lucide-react';

const InventorySearch = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Member Add Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newMember, setNewMember] = useState("");
    const [addStatus, setAddStatus] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openAddMemberModal = (groupName) => {
        setSelectedGroup(groupName);
        setNewMember("");
        setAddStatus(null);
        setIsModalOpen(true);
    };

    const [checkStatus, setCheckStatus] = useState(null); // null, 'checking', 'valid', 'invalid'
    const [userData, setUserData] = useState(null);

    const handleCheckName = async () => {
        if (!newMember.trim()) return;
        setCheckStatus('checking');
        setUserData(null);

        try {
            const res = await fetch(`/api/ad/check-user?username=${encodeURIComponent(newMember)}`);
            const data = await res.json();

            if (data.exists) {
                setCheckStatus('valid');
                setUserData(data);
            } else {
                setCheckStatus('invalid');
            }
        } catch (e) {
            console.error(e);
            setCheckStatus('invalid');
        }
    };

    const handleAddMember = async () => {
        if (!newMember.trim()) return;
        // Optionally enforce check first
        if (checkStatus !== 'valid') {
            // If not checked yet, try to check quickly? 
            // Or just proceed but warn layout? 
            // Let's assume user must check or we implicitly check.
            // For strict UX, disable Add until Valid.
            // But for flexibility, let's just proceed.
        }

        setAddStatus('loading');

        try {
            const res = await fetch(`/api/groups/${selectedGroup}/members?member=${encodeURIComponent(newMember)}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.status === 'success') {
                setAddStatus('success');
                setTimeout(() => {
                    setIsModalOpen(false);
                    setCheckStatus(null);
                    setUserData(null);
                }, 1500);
            } else {
                setAddStatus('error');
            }
        } catch (e) {
            setAddStatus('error');
        }
    };

    return (
        <div className="p-6 relative">
            {/* ... Modal ... */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl transform scale-100 transition-all">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-teal-400" />
                            Add Member to Group
                        </h3>

                        <div className="mb-4">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">Target Group</label>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 font-mono text-sm">
                                {selectedGroup}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">Username (samAccountName)</label>
                            <div className="flex gap-2">
                                <input
                                    className={`flex-1 bg-slate-950 border rounded p-3 text-white focus:outline-none transition-colors ${checkStatus === 'valid' ? 'border-emerald-500/50 focus:border-emerald-500' :
                                        checkStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-teal-500'
                                        }`}
                                    placeholder="e.g. jdoe"
                                    value={newMember}
                                    onChange={(e) => { setNewMember(e.target.value); setCheckStatus(null); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckName()}
                                />
                                <button
                                    onClick={handleCheckName}
                                    disabled={!newMember || checkStatus === 'checking'}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded font-medium text-sm transition-colors border border-slate-700"
                                >
                                    {checkStatus === 'checking' ? '...' : 'Check'}
                                </button>
                            </div>

                            {/* Validation Feedback */}
                            {checkStatus === 'valid' && (
                                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <Shield size={12} />
                                    Verified: {userData?.displayName || userData?.cn || "User Exists"}
                                </div>
                            )}
                            {checkStatus === 'invalid' && (
                                <div className="mt-2 text-xs text-red-400 flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <Shield size={12} />
                                    User not found in Active Directory
                                </div>
                            )}
                        </div>

                        {addStatus === 'success' && <div className="mb-4 text-emerald-400 text-sm font-medium">✓ User added successfully!</div>}
                        {addStatus === 'error' && <div className="mb-4 text-red-400 text-sm font-medium">✗ Failed to add user.</div>}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={addStatus === 'loading' || !newMember || checkStatus !== 'valid'}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-teal-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {addStatus === 'loading' ? 'Adding...' : 'Add User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-6">Inventory Search & Access Auditor</h2>

            {/* Search Bar */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl mb-8">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search for folder names, server paths, or username..."
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 placeholder-slate-500 transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-teal-900/20 transition-all">
                        Search
                    </button>
                </form>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {results.length > 0 && <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Search Results</h3>}

                {results.map((item) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.type === 'folder' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {item.type === 'folder' ? <Folder size={24} /> : <User size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                                        {item.name}
                                        {item.full_name && <span className="text-slate-500 text-sm font-normal ml-2">({item.full_name})</span>}
                                    </h4>

                                    {item.path && (
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                            <Server size={14} />
                                            <span>{item.server}</span>
                                            <span className="text-slate-700 mx-1">•</span>
                                            <span className="font-mono text-slate-400">{item.path}</span>
                                        </div>
                                    )}

                                    {item.access && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {item.access.map((acc, i) => (
                                                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">{acc}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Access/Groups Chips */}
                            <div className="flex flex-col items-end gap-2">
                                {item.groups && item.groups.map(grp => (
                                    <div key={grp} className="group/chip flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-slate-400 hover:border-slate-600 transition-colors">
                                        <Shield size={12} className={grp.includes('_MW') || grp.includes('_RW') ? 'text-orange-400' : 'text-emerald-400'} />
                                        <span>{grp}</span>
                                        <button
                                            onClick={() => openAddMemberModal(grp)}
                                            className="ml-2 hover:text-white hover:bg-teal-600/20 p-1 rounded transition-colors opacity-0 group-hover/chip:opacity-100"
                                            title="Add User to Group"
                                        >
                                            <UserPlus size={14} />
                                        </button>
                                    </div>
                                ))}
                                {item.type === 'group' && (
                                    <button
                                        onClick={() => openAddMemberModal(item.name)}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <UserPlus size={14} />
                                        Add Member
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {results.length === 0 && query && (
                    <div className="text-center py-12 text-slate-500">
                        No results found for "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventorySearch;
