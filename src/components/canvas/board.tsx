"use client";

import React, { useCallback } from "react";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTheme } from "next-themes";

const initialNodes: Node[] = [
    { id: "1", position: { x: 0, y: 0 }, data: { label: "Welcome to Canvas" } },
    { id: "2", position: { x: 0, y: 100 }, data: { label: "Drag me!" } },
];

const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

export function CanvasBoard() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { theme } = useTheme();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="h-[calc(100vh-4rem)] w-full glass-card rounded-lg overflow-hidden border-border bg-background/50 backdrop-blur-xl">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-background/50"
            >
                <Controls className="bg-background border-border text-foreground" />
                <MiniMap
                    className="bg-background border-border"
                    nodeColor={theme === 'dark' ? '#fff' : '#000'}
                    maskColor={theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
                />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} color={theme === 'dark' ? '#444' : '#ddd'} />
            </ReactFlow>
        </div>
    );
}
