import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Search, Server, Settings } from 'lucide-react';

import HealthCheck from './HealthCheck';

const Sidebar = () => {
    const navItems = [
        { path: '/', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/history', name: 'Operations History', icon: History },
        { path: '/inventory', name: 'Inventory Search', icon: Search },
        { path: '/agents', name: 'Agent Status', icon: Server },
        { path: '/settings', name: 'System Settings', icon: Settings },
    ];

    return (
        <div className="w-64 bg-slate-950 text-white h-screen flex flex-col border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="PermitFlow" className="w-10 h-10" />
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                            PermitFlow
                        </h1>
                        <p className="text-xs text-slate-500">IT Management Console</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-slate-800 text-teal-400 shadow-lg shadow-teal-900/20'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <HealthCheck />
            </div>
        </div>
    );
};

export default Sidebar;
