import { useState, useRef, useEffect } from 'react';
import { Network, Search, Filter, Maximize2, ZoomIn, ZoomOut, Database, History, User, Flag, Trophy, MapPin, Award, BookOpen, ChevronRight, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock Data for the Knowledge Graph
const MOCK_NODES = [
  { id: 'n1', label: 'Lionel Messi', type: 'player', img: 'https://flagcdn.com/w40/ar.png' },
  { id: 'n2', label: 'Argentina', type: 'team', img: 'https://flagcdn.com/w40/ar.png' },
  { id: 'n3', label: 'Qatar 2022', type: 'tournament', img: 'https://flagcdn.com/w40/qa.png' },
  { id: 'n4', label: 'Diego Maradona', type: 'player', img: 'https://flagcdn.com/w40/ar.png' },
  { id: 'n5', label: 'Mexico 1986', type: 'tournament', img: 'https://flagcdn.com/w40/mx.png' },
  { id: 'n6', label: 'Brazil', type: 'team', img: 'https://flagcdn.com/w40/br.png' },
  { id: 'n7', label: 'Pelé', type: 'player', img: 'https://flagcdn.com/w40/br.png' },
  { id: 'n8', label: 'Most Goals (Player)', type: 'record', img: '' },
  { id: 'n9', label: 'Miroslav Klose', type: 'player', img: 'https://flagcdn.com/w40/de.png' },
  { id: 'n10', label: 'Germany', type: 'team', img: 'https://flagcdn.com/w40/de.png' },
  { id: 'n11', label: 'Brazil 2014', type: 'tournament', img: 'https://flagcdn.com/w40/br.png' },
  { id: 'n12', label: 'Maracanazo', type: 'event', img: '' },
  { id: 'n13', label: 'Uruguay', type: 'team', img: 'https://flagcdn.com/w40/uy.png' },
  { id: 'n14', label: 'Brazil 1950', type: 'tournament', img: 'https://flagcdn.com/w40/br.png' },
  { id: 'n15', label: 'Estadio Azteca', type: 'stadium', img: '' },
  { id: 'n16', label: 'Lionel Scaloni', type: 'coach', img: '' }
];

const MOCK_EDGES = [
  { source: 'n1', target: 'n2', label: 'Plays For' },
  { source: 'n1', target: 'n3', label: 'Won' },
  { source: 'n2', target: 'n3', label: 'Won' },
  { source: 'n4', target: 'n2', label: 'Played For' },
  { source: 'n4', target: 'n5', label: 'Won' },
  { source: 'n2', target: 'n5', label: 'Won' },
  { source: 'n7', target: 'n6', label: 'Played For' },
  { source: 'n6', target: 'n14', label: 'Lost Final' },
  { source: 'n13', target: 'n14', label: 'Won' },
  { source: 'n12', target: 'n14', label: 'Occurred In' },
  { source: 'n12', target: 'n6', label: 'Trauma' },
  { source: 'n12', target: 'n13', label: 'Glory' },
  { source: 'n9', target: 'n10', label: 'Played For' },
  { source: 'n9', target: 'n11', label: 'Won' },
  { source: 'n10', target: 'n11', label: 'Won' },
  { source: 'n9', target: 'n8', label: 'Holds (16 Goals)' },
  { source: 'n4', target: 'n15', label: 'Hand of God' },
  { source: 'n5', target: 'n15', label: 'Final Venue' },
  { source: 'n16', target: 'n2', label: 'Manages' },
  { source: 'n16', target: 'n3', label: 'Won As Coach' }
];

const TYPE_COLORS: Record<string, string> = {
  player: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
  team: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
  tournament: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
  stadium: 'text-orange-400 bg-orange-500/20 border-orange-500/50',
  record: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
  coach: 'text-pink-400 bg-pink-500/20 border-pink-500/50',
  event: 'text-red-400 bg-red-500/20 border-red-500/50'
};

const TYPE_ICONS: Record<string, any> = {
  player: User,
  team: Flag,
  tournament: Trophy,
  stadium: MapPin,
  record: Award,
  coach: BookOpen,
  event: History
};

export function UniverseView() {
  const [activeNode, setActiveNode] = useState<string | null>('n1');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple static simulation for visual presentation purposes
  const getPositions = () => {
    return MOCK_NODES.map((node, i) => {
      // Create a nice spread
      const angle = (i / MOCK_NODES.length) * 2 * Math.PI;
      const radius = 200 + (i % 3) * 60; // Concentric rings
      
      // Force specific nodes to specific centers
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle) * radius;

      if (node.id === 'n3') { x = -100; y = -100; }
      if (node.id === 'n1') { x = -150; y = -150; }
      if (node.id === 'n2') { x = -200; y = -50; }
      if (node.id === 'n4') { x = -300; y = -100; }
      if (node.id === 'n6') { x = 150; y = 150; }
      if (node.id === 'n7') { x = 250; y = 150; }
      if (node.id === 'n9') { x = 0; y = 200; }
      if (node.id === 'n10') { x = -100; y = 250; }
      
      return { ...node, x, y };
    });
  };

  const nodesWithPositions = getPositions();

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const activeNodeData = MOCK_NODES.find(n => n.id === activeNode);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 pb-4">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Network className="w-6 h-6 text-primary" />
          Universo Mundialista
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Knowledge Graph: Explora la historia de los Mundiales</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        
        {/* Left Panel: Search & Filters */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Buscar jugadores, equipos..." className="pl-9 bg-secondary border-border text-xs" />
            </div>
            <div className="flex flex-wrap gap-2">
               {['player', 'team', 'tournament', 'record', 'stadium'].map(type => (
                 <Badge key={type} variant="outline" className={`text-[9px] uppercase cursor-pointer hover:bg-white/10 ${TYPE_COLORS[type]}`}>
                   {type}
                 </Badge>
               ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar p-0">
            <div className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Descubrimientos Populares</div>
            <div className="space-y-1 p-2">
              {MOCK_NODES.slice(0, 8).map(node => {
                const Icon = TYPE_ICONS[node.type];
                return (
                  <button 
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${activeNode === node.id ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${TYPE_COLORS[node.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold truncate ${activeNode === node.id ? 'text-primary' : 'text-white'}`}>{node.label}</div>
                      <div className="text-[9px] uppercase text-slate-500 font-bold">{node.type}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center Panel: Interactive Canvas */}
        <div className="lg:col-span-2 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-background to-background border border-border rounded-xl overflow-hidden">
          
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
               <ZoomIn className="w-4 h-4" />
             </Button>
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
               <ZoomOut className="w-4 h-4" />
             </Button>
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => { setZoom(1); setPan({x: 0, y: 0}); }}>
               <Maximize2 className="w-4 h-4" />
             </Button>
          </div>

          <div className="absolute top-4 left-4 z-20">
             <div className="bg-secondary/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full flex items-center gap-2">
               <Database className="w-3.5 h-3.5 text-primary" />
               <span className="text-[10px] uppercase font-bold tracking-widest text-white">Graph Database Status</span>
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
             </div>
          </div>

          {/* Canvas Implementation */}
          <div 
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing absolute inset-0 overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
             <div 
               className="w-full h-full relative origin-center"
               style={{ 
                 transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                 transition: isDragging ? 'none' : 'transform 0.3s ease-out'
               }}
             >
                {/* Center point logic for relative positioning */}
                <div className="absolute top-1/2 left-1/2 w-0 h-0">
                  {/* Edges calculation (Visual logic only) */}
                  <svg className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0 }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-slate-600" />
                      </marker>
                    </defs>
                    {MOCK_EDGES.map((edge, i) => {
                        const s = nodesWithPositions.find(n => n.id === edge.source);
                        const t = nodesWithPositions.find(n => n.id === edge.target);
                        if (!s || !t) return null;
                        
                        const isActive = edge.source === activeNode || edge.target === activeNode;
                        const isPrimaryActive = edge.source === activeNode;
                        
                        return (
                          <g key={i}>
                            <path 
                              d={`M ${s.x} ${s.y} L ${t.x} ${t.y}`} 
                              stroke={isActive ? (isPrimaryActive ? '#3b82f6' : '#64748b') : '#1e293b'} 
                              strokeWidth={isActive ? 2 : 1}
                              fill="none"
                              markerEnd="url(#arrow)"
                              className="transition-colors duration-300"
                            />
                            {/* Edge Label (only show for active node connections to reduce clutter) */}
                            {isActive && (
                               <foreignObject 
                                 x={(s.x + t.x) / 2 - 40} 
                                 y={(s.y + t.y) / 2 - 10} 
                                 width="80" 
                                 height="20"
                               >
                                  <div className="bg-background border border-border text-[8px] font-mono font-bold text-slate-400 text-center rounded px-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                    {edge.label}
                                  </div>
                               </foreignObject>
                            )}
                          </g>
                        );
                    })}
                  </svg>

                  {/* Nodes */}
                  {nodesWithPositions.map((node) => {
                    const isSelected = activeNode === node.id;
                    const isConnected = MOCK_EDGES.some(e => 
                      (e.source === activeNode && e.target === node.id) || 
                      (e.target === activeNode && e.source === node.id)
                    );
                    const opacity = activeNode ? (isSelected || isConnected ? 1 : 0.3) : 1;
                    const Icon = TYPE_ICONS[node.type];

                    return (
                      <div
                        key={node.id}
                        onClick={(e) => { e.stopPropagation(); setActiveNode(node.id); }}
                        className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group"
                        style={{ left: node.x, top: node.y, opacity, zIndex: isSelected ? 10 : 1 }}
                      >
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-xl cursor-pointer transition-transform ${isSelected ? 'scale-125 ring-4 ring-primary/20' : 'group-hover:scale-110'} bg-card ${TYPE_COLORS[node.type]}`}>
                            {node.img ? (
                              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center p-2 bg-secondary">
                                {node.type === 'team' || node.type === 'tournament' ? 
                                   <img src={node.img} className="w-full object-cover" alt="" /> :
                                   <Icon className="w-5 h-5" />
                                }
                              </div>
                            ) : (
                               <Icon className="w-5 h-5" />
                            )}
                         </div>
                         <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold text-center whitespace-nowrap bg-background border border-border shadow-lg ${isSelected ? 'text-primary' : 'text-slate-300'}`}>
                           {node.label}
                         </div>
                      </div>
                    )
                  })}
                </div>
             </div>
          </div>
        </div>

        {/* Right Panel: Entity Inspector */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden relative">
          {!activeNodeData ? (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
               <Network className="w-12 h-12 text-slate-700" />
               <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Select Node</h3>
               <p className="text-xs text-slate-600">Click any entity in the network graph to inspect its details and relationships.</p>
             </div>
          ) : (
             <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className={`h-24 ${TYPE_COLORS[activeNodeData.type].split(' ')[1]} border-b border-border relative flex justify-center items-end pb-4`}>
                   <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/50 hover:text-white" onClick={() => setActiveNode(null)}>
                     <X className="w-4 h-4" />
                   </Button>
                   <Badge variant="outline" className={`absolute top-2 left-2 text-[9px] uppercase font-bold border-white/20 bg-background text-white`}>
                     {activeNodeData.type}
                   </Badge>
                   
                   <div className="w-16 h-16 rounded-xl bg-background border-2 border-border shadow-2xl absolute -bottom-8 flex items-center justify-center text-primary overflow-hidden">
                     {activeNodeData.img && (activeNodeData.type === 'team' || activeNodeData.type === 'tournament') ? 
                        <img src={activeNodeData.img} className="w-10 h-auto" alt="" /> :
                        <div className={`w-full h-full flex flex-col items-center justify-center ${TYPE_COLORS[activeNodeData.type]}`}>
                          {<activeNodeData.type className="w-6 h-6" />}
                        </div>
                     }
                   </div>
                </div>

                <div className="pt-12 p-4 text-center border-b border-border/50">
                  <h2 className="text-lg font-black text-white">{activeNodeData.label}</h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {activeNodeData.id}</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                   <div>
                     <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-3">Conexiones Directas</h3>
                     <div className="space-y-2">
                       {MOCK_EDGES.filter(e => e.source === activeNode || e.target === activeNode).map((e, idx) => {
                          const isIncoming = e.target === activeNode;
                          const otherNodeId = isIncoming ? e.source : e.target;
                          const otherNode = MOCK_NODES.find(n => n.id === otherNodeId);
                          if (!otherNode) return null;

                          return (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-secondary/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveNode(otherNode.id)}>
                               <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center shrink-0 border border-border">
                                {isIncoming ? <ChevronRight className="w-3 h-3 text-emerald-400 rotate-180" /> : <ChevronRight className="w-3 h-3 text-blue-400" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="text-[9px] font-mono text-slate-400">{e.label}</div>
                                 <div className="text-xs font-bold text-white truncate">{otherNode.label}</div>
                               </div>
                            </div>
                          )
                       })}
                     </div>
                   </div>

                   <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 mb-2">
                        <Database className="w-3 h-3" /> Metadatos
                      </h3>
                      <div className="font-mono text-[9px] text-slate-400 space-y-1">
                        <div className="flex justify-between"><span>Created:</span> <span className="text-white">2026-06-05</span></div>
                        <div className="flex justify-between"><span>Degree:</span> <span className="text-white">{MOCK_EDGES.filter(e => e.source === activeNode || e.target === activeNode).length} edges</span></div>
                        <div className="flex justify-between"><span>Status:</span> <span className="text-emerald-400">Verified</span></div>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
