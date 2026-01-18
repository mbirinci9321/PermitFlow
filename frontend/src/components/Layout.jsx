import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-900 font-sans text-slate-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header if needed, otherwise just main content */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
                    <h2 className="text-lg font-semibold text-white">Dashboard Overview</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">v2.0</span>
                        <span className="text-sm text-slate-400">Murat Birinci Tech Labs</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
