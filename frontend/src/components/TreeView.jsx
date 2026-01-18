import React, { useState } from 'react';
import { FolderIcon, ServerIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TreeNode = ({ node, level, isLast, onGroupRename, onGroupDelete }) => {
    // State for group editing
    const [editingGroup, setEditingGroup] = useState(null);
    const [editValue, setEditValue] = useState("");

    const handleGroupClick = (group, idx) => {
        setEditingGroup(`${node.name}-${idx}`);
        setEditValue(group);
    };

    const handleGroupBlur = (idx) => {
        if (editingGroup) {
            onGroupRename(node.id, idx, editValue);
            setEditingGroup(null);
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Enter') {
            handleGroupBlur(idx);
        }
    };

    return (
        <div className="relative">
            <div className="flex items-start">
                <div className="flex flex-col w-full">
                    {/* Horizontal Line */}
                    <div className="flex items-center gap-2 py-1 relative">
                        {level > 0 && (
                            <div className="absolute -left-[20px] top-1/2 w-[20px] border-t border-dotted border-slate-500"></div>
                        )}
                    </div>

                    {/* Node Content */}
                    <div className="flex items-start group">
                        {/* Vertical Lines */}
                        {level > 0 && (
                            <div className="absolute -left-[21px] -top-[10px] bottom-0 w-px border-l border-dotted border-slate-500 h-[calc(100%+10px)]"></div>
                        )}
                        {level > 0 && isLast && (
                            <div className="absolute -left-[21px] top-[14px] bottom-0 w-px bg-slate-950"></div>
                        )}

                        <div className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${node.type === 'server' ? '' : 'hover:bg-slate-800'}`}>
                            {node.type === 'server' ? (
                                <ServerIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                            ) : (
                                <FolderIcon className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />
                            )}

                            <span className={`font-medium whitespace-nowrap ${node.type === 'server' ? 'text-indigo-100' : 'text-slate-300'}`}>
                                {node.name}
                            </span>

                            {/* Groups (Inline Editable) */}
                            {node.groups && node.groups.length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-4 opacity-100">
                                    {node.groups.map((group, idx) => (
                                        editingGroup === `${node.name}-${idx}` ? (
                                            <input
                                                key={idx}
                                                autoFocus
                                                className="bg-slate-900 border border-blue-500 text-white rounded px-1.5 py-0.5 text-[10px] outline-none min-w-[100px]"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleGroupBlur(idx)}
                                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                            />
                                        ) : (
                                            <div key={idx} className={`relative flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed transition-colors group/chip ${group.includes('_W') || group.includes('_RW')
                                                ? 'border-red-500/30 text-red-400'
                                                : group.includes('_R') ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-500/30 text-slate-400'
                                                }`}>
                                                <span
                                                    onClick={() => handleGroupClick(group, idx)}
                                                    className="cursor-pointer hover:underline"
                                                    title="Click to rename"
                                                >
                                                    {group}
                                                </span>
                                                {/* Delete Button (Visible on Hover) */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onGroupDelete(node.id, idx); }}
                                                    className="opacity-0 group-hover/chip:opacity-100 ml-1 hover:text-white transition-opacity text-slate-500 hover:bg-red-500/20 rounded"
                                                    title="Remove Group"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Children */}
                    {node.children && node.children.length > 0 && (
                        <div className="ml-6 pl-4 py-1 relative">
                            {node.children.map((child, idx) => (
                                <TreeNode
                                    key={idx}
                                    node={child}
                                    level={level + 1}
                                    isLast={idx === node.children.length - 1}
                                    onGroupRename={onGroupRename}
                                    onGroupDelete={onGroupDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TreeView = ({ data, onGroupRename, onGroupDelete }) => {
    if (!data || data.length === 0) {
        return <div className="text-slate-500 italic p-4 text-center">Start typing in the editor to see the structure preview...</div>;
    }

    return (
        <div className="pl-2">
            {data.map((node, idx) => (
                <TreeNode key={idx} node={node} level={0} onGroupRename={onGroupRename} onGroupDelete={onGroupDelete} />
            ))}
        </div>
    );
};

export default TreeView;
