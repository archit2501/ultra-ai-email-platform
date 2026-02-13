"use client";

/**
 * NeuralNetworkViz.tsx - ULTRA PREMIUM EDITION
 *
 * Interactive neural network visualization showing:
 * - Pool connections with animated particles
 * - Dynamic node clustering
 * - Real-time data flow visualization
 * - 3D-like depth effect with parallax
 *
 * @version 3.0.0 - GOD TIER EDITION
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Network,
  Globe,
  Zap,
  Activity,
  Users,
  Shield,
  Crown,
  Diamond,
  Sparkles,
  Server,
  Cpu,
  Radio,
  Wifi,
  Signal,
  Eye,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: "account" | "premium" | "enterprise" | "hub";
  size: number;
  connections: string[];
  activity: number;
  label?: string;
}

interface NetworkConnection {
  from: string;
  to: string;
  strength: number;
  active: boolean;
}

interface NeuralNetworkVizProps {
  accounts?: Array<{
    id: string;
    email: string;
    tier: string;
    healthScore: number;
  }>;
  poolSize?: number;
  networkStrength?: number;
  memberScore?: number;
  className?: string;
}

// ============================================================================
// Particle System
// ============================================================================

interface Particle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  progress: number;
  color: string;
}

function useParticleSystem(connections: NetworkConnection[], nodes: Map<string, NetworkNode>) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly spawn particles on active connections
      const activeConnections = connections.filter((c) => c.active);
      if (activeConnections.length === 0) return;

      const randomConnection = activeConnections[Math.floor(Math.random() * activeConnections.length)];
      const fromNode = nodes.get(randomConnection.from);
      const toNode = nodes.get(randomConnection.to);

      if (fromNode && toNode) {
        const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#10B981"];
        const newParticle: Particle = {
          id: `particle-${Date.now()}-${Math.random()}`,
          x: fromNode.x,
          y: fromNode.y,
          targetX: toNode.x,
          targetY: toNode.y,
          speed: 0.01 + Math.random() * 0.02,
          progress: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
        };

        setParticles((prev) => [...prev.slice(-50), newParticle]);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [connections, nodes]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(function animate() {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            progress: p.progress + p.speed,
            x: p.x + (p.targetX - p.x) * p.speed * 2,
            y: p.y + (p.targetY - p.y) * p.speed * 2,
          }))
          .filter((p) => p.progress < 1)
      );
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return particles;
}

// ============================================================================
// Network Node Component
// ============================================================================

function NetworkNodeComponent({
  node,
  isSelected,
  onClick,
}: {
  node: NetworkNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const nodeColors = {
    account: "from-blue-500 to-cyan-500",
    premium: "from-yellow-500 to-orange-500",
    enterprise: "from-purple-500 to-pink-500",
    hub: "from-green-500 to-emerald-500",
  };

  const nodeIcons = {
    account: Users,
    premium: Crown,
    enterprise: Diamond,
    hub: Server,
  };

  const Icon = nodeIcons[node.type];

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* Glow effect */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={node.size + 10}
        fill={`url(#glow-${node.type})`}
        opacity={isSelected ? 0.8 : 0.3}
        animate={{
          r: isSelected ? [node.size + 10, node.size + 20, node.size + 10] : node.size + 10,
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Main node */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={node.size}
        fill={`url(#gradient-${node.type})`}
        stroke={isSelected ? "#fff" : "rgba(255,255,255,0.2)"}
        strokeWidth={isSelected ? 3 : 1}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      />

      {/* Activity ring */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={node.size + 5}
        fill="none"
        stroke={`url(#gradient-${node.type})`}
        strokeWidth={2}
        strokeDasharray={`${node.activity * 3} ${100 - node.activity * 3}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
      />

      {/* Label */}
      {node.label && (
        <text
          x={node.x}
          y={node.y + node.size + 20}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={10}
          fontFamily="system-ui"
        >
          {node.label}
        </text>
      )}
    </motion.g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NeuralNetworkViz({
  accounts: propAccounts,
  poolSize: propPoolSize,
  networkStrength: propNetworkStrength,
  memberScore,
  className,
}: NeuralNetworkVizProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([50]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Use memberScore to generate accounts if not provided
  const accounts = propAccounts || (memberScore !== undefined ? [
    { id: "1", email: "user@domain.com", tier: "premium", healthScore: memberScore },
  ] : []);
  const poolSize = propPoolSize || 1000;
  const networkStrength = propNetworkStrength || (memberScore ? memberScore / 100 * 95 : 85);

  // Generate nodes based on accounts and pool
  const { nodes, connections, nodeMap } = useMemo(() => {
    const nodeMap = new Map<string, NetworkNode>();
    const connections: NetworkConnection[] = [];

    // Center hub
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    nodeMap.set("hub-main", {
      id: "hub-main",
      x: centerX,
      y: centerY,
      type: "hub",
      size: 30,
      connections: [],
      activity: 100,
      label: "Pool Hub",
    });

    // Add account nodes
    accounts.forEach((account, index) => {
      const angle = (index / accounts.length) * Math.PI * 2;
      const radius = 120;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const nodeType = account.tier === "enterprise" ? "enterprise" : account.tier === "premium" ? "premium" : "account";

      nodeMap.set(account.id, {
        id: account.id,
        x,
        y,
        type: nodeType,
        size: 20,
        connections: ["hub-main"],
        activity: account.healthScore,
        label: showLabels ? account.email.split("@")[0] : undefined,
      });

      connections.push({
        from: account.id,
        to: "hub-main",
        strength: account.healthScore / 100,
        active: true,
      });
    });

    // Add simulated pool nodes
    const poolNodeCount = Math.min(20, Math.floor(poolSize / 500));
    for (let i = 0; i < poolNodeCount; i++) {
      const angle = (i / poolNodeCount) * Math.PI * 2 + Math.PI / poolNodeCount;
      const radius = 200 + Math.random() * 50;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const poolNodeId = `pool-${i}`;
      const nodeType = Math.random() > 0.7 ? "premium" : "account";

      nodeMap.set(poolNodeId, {
        id: poolNodeId,
        x,
        y,
        type: nodeType,
        size: 8 + Math.random() * 8,
        connections: [],
        activity: 50 + Math.random() * 50,
      });

      // Connect to hub or nearby account
      const targetId = Math.random() > 0.5 && accounts.length > 0
        ? accounts[Math.floor(Math.random() * accounts.length)].id
        : "hub-main";

      connections.push({
        from: poolNodeId,
        to: targetId,
        strength: 0.3 + Math.random() * 0.4,
        active: Math.random() > 0.3,
      });
    }

    return { nodes: Array.from(nodeMap.values()), connections, nodeMap };
  }, [accounts, poolSize, dimensions, showLabels]);

  // Particle system
  const particles = useParticleSystem(connections, nodeMap);

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const { width } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: Math.max(600, width - 48), height: 500 });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Network className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Neural Network Visualization
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Real-time warmup pool connections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Network Stats */}
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{nodes.length}</p>
                <p className="text-xs text-slate-400">Nodes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{connections.length}</p>
                <p className="text-xs text-slate-400">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{networkStrength}%</p>
                <p className="text-xs text-slate-400">Strength</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Switch
              id="labels"
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
            <Label htmlFor="labels" className="text-sm text-slate-400">Show Labels</Label>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Label className="text-sm text-slate-400 whitespace-nowrap">Animation Speed</Label>
            <Slider
              value={animationSpeed}
              onValueChange={setAnimationSpeed}
              min={10}
              max={100}
              step={10}
              className="flex-1"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="relative bg-slate-950/50 rounded-xl overflow-hidden">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="w-full h-auto"
          >
            {/* Definitions */}
            <defs>
              {/* Gradients */}
              <linearGradient id="gradient-account" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="gradient-premium" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="gradient-enterprise" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="gradient-hub" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              {/* Glow effects */}
              <radialGradient id="glow-account">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow-premium">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow-enterprise">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="glow-hub">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>

              {/* Connection gradient */}
              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Grid background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connections */}
            <g>
              {connections.map((connection, index) => {
                const fromNode = nodeMap.get(connection.from);
                const toNode = nodeMap.get(connection.to);
                if (!fromNode || !toNode) return null;

                return (
                  <motion.line
                    key={`${connection.from}-${connection.to}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={connection.active ? "url(#connection-gradient)" : "rgba(148,163,184,0.1)"}
                    strokeWidth={connection.active ? 2 : 1}
                    strokeDasharray={connection.active ? "none" : "4 4"}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: connection.strength }}
                    transition={{ duration: 1, delay: index * 0.02 }}
                  />
                );
              })}
            </g>

            {/* Particles */}
            <g>
              {particles.map((particle) => (
                <motion.circle
                  key={particle.id}
                  cx={particle.x}
                  cy={particle.y}
                  r={3}
                  fill={particle.color}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </g>

            {/* Nodes */}
            <g>
              {nodes.map((node) => (
                <NetworkNodeComponent
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                />
              ))}
            </g>

            {/* Center hub pulse */}
            <motion.circle
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r={50}
              fill="none"
              stroke="url(#gradient-hub)"
              strokeWidth={1}
              opacity={0.3}
              animate={{
                r: [50, 80, 50],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </svg>

          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4">
            {[
              { type: "Your Accounts", color: "from-blue-500 to-cyan-500" },
              { type: "Premium Pool", color: "from-yellow-500 to-orange-500" },
              { type: "Enterprise", color: "from-purple-500 to-pink-500" },
              { type: "Hub", color: "from-green-500 to-emerald-500" },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r", item.color)} />
                <span className="text-xs text-slate-400">{item.type}</span>
              </div>
            ))}
          </div>

          {/* Selected node info */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-xl rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Node Details</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>ID: {selectedNode}</p>
                  <p>Type: {nodeMap.get(selectedNode)?.type}</p>
                  <p>Activity: {nodeMap.get(selectedNode)?.activity.toFixed(0)}%</p>
                  <p>Connections: {nodeMap.get(selectedNode)?.connections.length || 0}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default NeuralNetworkViz;
