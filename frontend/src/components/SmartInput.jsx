import React, { useState, useEffect } from 'react';
import TreeView from './TreeView';
import { useToast } from '../context/ToastContext';

const SmartInput = () => {
    const [text, setText] = useState("");
    const [treeData, setTreeData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    // Mock Parser Logic
    useEffect(() => {
        const lines = text.split('\n');
        let root = [];
        let stack = [{ level: -1, children: root }];
        let currentServer = "SERVER"; // Default fallback

        lines.forEach((line, idx) => {
            if (!line.trim()) return;

            const level = line.search(/\S/); // count leading spaces
            const name = line.trim();

            // Determine server or folder
            const isServer = name.startsWith("[");

            if (isServer) {
                // Parse Server Name: [ANKFS01 | E:\Data] -> ANKFS01
                const serverMatch = name.match(/^\[\s*([^|\s\]]+)/);
                if (serverMatch && serverMatch[1]) {
                    currentServer = serverMatch[1];
                }
            }

            // Sanitize name for Display AND Groups
            const safeName = isServer ? name : name.replace(/\s+/g, "_");

            // Group Naming Convention
            const groups = isServer ? [] : [
                `S_${currentServer}_${safeName}_R`,
                `S_${currentServer}_${safeName}_W`
            ];

            const node = {
                id: `node-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
                name: safeName,
                type: isServer ? 'server' : 'folder',
                children: [],
                groups: groups
            };

            // Adjust stack
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length > 0) {
                stack[stack.length - 1].children.push(node);
            }

            stack.push({ level, children: node.children });
        });

        setTreeData(root);
    }, [text]);

    // Convert Tree structure back to Indented Text
    const generateTextFromTree = (nodes, depth = 0) => {
        let result = "";
        nodes.forEach(node => {
            const indent = "  ".repeat(depth);
            result += `${indent}${node.name}\n`;
            if (node.children && node.children.length > 0) {
                result += generateTextFromTree(node.children, depth + 1);
            }
        });
        return result;
    };

    // Callback to update text when tree changes
    const handleTreeUpdate = (newTree) => {
        const newText = generateTextFromTree(newTree);
        setText(newText);
    };

    const handleGroupDelete = (targetNodeId, groupIdx) => {
        // Deep clone treeData to mutate
        const newTreeData = JSON.parse(JSON.stringify(treeData));

        // Helper to find and update node
        const updateNode = (nodes) => {
            for (let node of nodes) {
                if (node.id === targetNodeId) {
                    if (node.groups) {
                        node.groups.splice(groupIdx, 1);
                        return true;
                    }
                }
                if (node.children && node.children.length > 0) {
                    if (updateNode(node.children)) return true;
                }
            }
            return false;
        };

        updateNode(newTreeData);
        setTreeData(newTreeData);
    };

    const handleGroupRename = (targetNodeId, groupIdx, newName) => {
        if (!newName || !newName.trim()) return;

        // Deep clone treeData to mutate
        const newTreeData = JSON.parse(JSON.stringify(treeData));

        // Helper to find and update node
        const updateNode = (nodes) => {
            for (let node of nodes) {
                if (node.id === targetNodeId) {
                    if (node.groups && node.groups[groupIdx] !== undefined) {
                        node.groups[groupIdx] = newName.trim();
                        return true;
                    }
                }
                if (node.children && node.children.length > 0) {
                    if (updateNode(node.children)) return true;
                }
            }
            return false;
        };

        updateNode(newTreeData);
        setTreeData(newTreeData);
    };

    const handleProvision = async () => {
        if (treeData.length === 0) return;
        setIsLoading(true);

        try {
            // 1. Validate Structure
            addToast("Validating structure with agents...", "info");
            const valResponse = await fetch('/api/execute/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tree: treeData })
            });
            const valData = await valResponse.json();

            if (valData.status === 'success' && valData.conflicts && valData.conflicts.length > 0) {
                // Block execution
                setIsLoading(false);
                addToast("Validation Failed: Folders already exist!", "error");
                alert("The following items already exist on the target server and cannot be created:\n\n" + valData.conflicts.join("\n"));
                return;
            }

            // 2. Execute Provisioning
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tree: treeData })
            });
            const res = await response.json();

            if (res.status === 'success') {
                addToast(`Provisioning ID #${res.id} Initiated Successfully!`, 'success');
                setTreeData([]);
                setText("");
            } else {
                throw new Error(res.error || 'Unknown error');
            }
        } catch (e) {
            addToast(`Provisioning Failed: ${e.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-6 relative">


            {/* Smart Text Area */}
            <div className="w-1/2 flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Input Configuration
                    </h2>
                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        Markdown / Tab Indent Supported
                    </span>
                </div>
                <textarea
                    className="w-full flex-1 p-6 bg-slate-950 font-mono text-sm text-slate-300 focus:outline-none resize-none leading-relaxed selection:bg-teal-500/30"
                    placeholder="[Server01 | D:\Data]&#10;  Finance&#10;    Reports&#10;  Quality Plan"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = e.target.selectionStart;
                            const end = e.target.selectionEnd;
                            // Insert 2 spaces for tab
                            const newText = text.substring(0, start) + "  " + text.substring(end);
                            setText(newText);
                            // Move cursor
                            setTimeout(() => {
                                e.target.selectionStart = e.target.selectionEnd = start + 2;
                            }, 0);
                        }
                    }}
                    spellCheck={false}
                />
            </div>

            {/* Live Tree View */}
            <div className="w-1/2 flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Live Preview
                    </h2>
                </div>
                <div className="flex-1 p-6 overflow-auto bg-slate-950 custom-scrollbar">
                    <TreeView
                        data={treeData}
                        onUpdate={handleTreeUpdate}
                        onGroupRename={handleGroupRename}
                        onGroupDelete={handleGroupDelete}
                    />
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                        onClick={() => { setTreeData([]); setText(""); }}
                        disabled={isLoading}
                    >
                        Reset
                    </button>
                    <button
                        className={`font-bold py-2 px-6 rounded-lg shadow-lg transition-all flex items-center gap-2 ${isLoading || treeData.length === 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-teal-900/20 transform hover:scale-105 active:scale-95'
                            }`}
                        onClick={handleProvision}
                        disabled={isLoading || treeData.length === 0}
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
                                Processing...
                            </>
                        ) : (
                            "Provision Infrastructure"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default SmartInput;
