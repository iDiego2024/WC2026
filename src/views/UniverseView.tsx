import React, { useState, useRef, useEffect } from 'react';
import { Network, Search, Filter, Maximize2, ZoomIn, ZoomOut, Database, History, User, Flag, Trophy, MapPin, Award, BookOpen, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeams, useMatches } from '../hooks/useData';

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
  const { teams, loading: teamsLoading } = useTeams();
  const { matches, loading: matchesLoading } = useMatches();

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);

  const isLoading = teamsLoading || matchesLoading;

  // Set default active node on load
  useEffect(() => {
    if (teams && teams.length > 0) {
      const groupAFirstTeam = teams.find(t => t.group_name === 'A');
      if (groupAFirstTeam) {
        setActiveNode(`team-${groupAFirstTeam.code}`);
      }
    }
  }, [teams]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Building Knowledge Graph...</p>
      </div>
    );
  }

  // 1. Gather unique stadiums from matches
  const stadiums: any[] = Array.from(
    matches.reduce((map, m) => {
      if (m.stadium) {
        map.set(m.stadium.id, m.stadium);
      }
      return map;
    }, new Map<string, any>()).values()
  );

  // 2. Gather unique groups
  const groups = Array.from(new Set(teams.map(t => t.group_name).filter(Boolean))).sort();

  // 3. Construct the entire Relational Graph
  const allNodes: any[] = [];
  const allEdges: any[] = [];

  // Group Nodes
  groups.forEach(g => {
    allNodes.push({
      id: `group-${g}`,
      label: `Group ${g}`,
      type: 'tournament',
      img: ''
    });
  });

  // Team Nodes
  teams.forEach(team => {
    allNodes.push({
      id: `team-${team.code}`,
      label: team.name,
      type: 'team',
      img: `https://flagcdn.com/w40/${team.flag_code.toLowerCase()}.png`
    });

    if (team.group_name) {
      allEdges.push({
        source: `team-${team.code}`,
        target: `group-${team.group_name}`,
        label: 'Belongs To'
      });
    }
  });

  // Stadium Nodes
  stadiums.forEach((stadium: any) => {
    allNodes.push({
      id: `stadium-${stadium.id}`,
      label: stadium.name,
      type: 'stadium',
      img: ''
    });
  });

  // Match Nodes and their relations
  matches.forEach(m => {
    const home = m.home_team;
    const away = m.away_team;
    if (!home || !away) return;

    const matchNodeId = `match-${m.id}`;
    allNodes.push({
      id: matchNodeId,
      label: `${home.code} v ${away.code}`,
      type: 'event',
      img: ''
    });

    allEdges.push({
      source: `team-${home.code}`,
      target: matchNodeId,
      label: 'Home Team'
    });

    allEdges.push({
      source: `team-${away.code}`,
      target: matchNodeId,
      label: 'Away Team'
    });

    if (m.stadium) {
      allEdges.push({
        source: `stadium-${m.stadium.id}`,
        target: matchNodeId,
        label: 'Hosts Match'
      });
    }
  });

  // 4. Apply filters to reduce visual clutter
  let filteredNodes = allNodes;
  let filteredEdges = allEdges;

  if (search.trim()) {
    const query = search.toLowerCase();
    const primaryNodeIds = new Set(
      allNodes.filter(n => n.label.toLowerCase().includes(query)).map(n => n.id)
    );

    const neighborNodeIds = new Set<string>();
    allEdges.forEach(e => {
      if (primaryNodeIds.has(e.source)) neighborNodeIds.add(e.target);
      if (primaryNodeIds.has(e.target)) neighborNodeIds.add(e.source);
    });

    const activeNodeIds = new Set([...primaryNodeIds, ...neighborNodeIds]);
    filteredNodes = allNodes.filter(n => activeNodeIds.has(n.id));
    filteredEdges = allEdges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
  } else if (selectedGroup) {
    const groupNodeId = `group-${selectedGroup}`;
    const groupTeamsCodes = new Set(
      teams.filter(t => t.group_name === selectedGroup).map(t => t.code)
    );

    const groupMatchesIds = new Set(
      matches
        .filter(m => m.home_team && groupTeamsCodes.has(m.home_team.code))
        .map(m => m.id)
    );

    const groupStadiumsIds = new Set(
      matches
        .filter(m => m.home_team && groupTeamsCodes.has(m.home_team.code) && m.stadium)
        .map(m => m.stadium.id)
    );

    filteredNodes = allNodes.filter(n => {
      if (n.id === groupNodeId) return true;
      if (n.type === 'team' && groupTeamsCodes.has(n.id.replace('team-', ''))) return true;
      if (n.type === 'event' && groupMatchesIds.has(n.id.replace('match-', ''))) return true;
      if (n.type === 'stadium' && groupStadiumsIds.has(n.id.replace('stadium-', ''))) return true;
      return false;
    });

    filteredEdges = allEdges.filter(e => {
      const srcIn = filteredNodes.some(n => n.id === e.source);
      const tgtIn = filteredNodes.some(n => n.id === e.target);
      return srcIn && tgtIn;
    });
  }

  if (activeTypeFilter) {
    filteredNodes = filteredNodes.filter(n => n.type === activeTypeFilter || n.type === 'tournament' || n.type === 'team');
    filteredEdges = filteredEdges.filter(e => {
      const srcIn = filteredNodes.some(n => n.id === e.source);
      const tgtIn = filteredNodes.some(n => n.id === e.target);
      return srcIn && tgtIn;
    });
  }

  // 5. Calculate node layout coordinates in circle arrangement
  const getPositions = (nodesList: any[]) => {
    return nodesList.map((node, i) => {
      if (node.type === 'tournament') {
        return { ...node, x: 0, y: 0 };
      }
      
      const angle = (i / (nodesList.length - 1 || 1)) * 2 * Math.PI;
      let radius = 180;
      if (node.type === 'team') radius = 100;
      if (node.type === 'stadium') radius = 230;
      if (node.type === 'event') radius = 170;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return { ...node, x, y };
    });
  };

  const nodesWithPositions = getPositions(filteredNodes);

  // Inspector details
  const activeNodeData = filteredNodes.find(n => n.id === activeNode);
  const teamDetails = activeNodeData?.type === 'team' ? teams.find(t => `team-${t.code}` === activeNode) : null;
  const matchDetails = activeNodeData?.type === 'event' ? matches.find(m => `match-${m.id}` === activeNode) : null;
  const stadiumDetails = activeNodeData?.type === 'stadium' ? stadiums.find((s: any) => `stadium-${s.id}` === activeNode) : null;

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 pb-4">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Network className="w-6 h-6 text-primary" />
          Universo Mundialista
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Knowledge Graph: Explora la historia y conexiones de la Copa 2026</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        
        {/* Left Panel: Search & Filters */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedGroup('');
                  }
                }}
                placeholder="Buscar equipos, estadios, partidos..." 
                className="pl-9 bg-secondary border-border text-xs" 
              />
            </div>
            
            <div className="space-y-1">
              <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Filtrar Grupo</div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                {groups.map(g => (
                  <button 
                    key={g} 
                    onClick={() => {
                      setSelectedGroup(g);
                      setSearch('');
                    }}
                    className={`h-5 w-7 text-[9px] font-bold rounded flex items-center justify-center border ${selectedGroup === g ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-slate-400'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
               {['team', 'stadium', 'event'].map(type => (
                 <Badge 
                   key={type} 
                   variant="outline" 
                   onClick={() => setActiveTypeFilter(activeTypeFilter === type ? null : type)}
                   className={`text-[9px] uppercase cursor-pointer hover:bg-white/10 ${activeTypeFilter === type ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''} ${TYPE_COLORS[type]}`}
                 >
                   {type}
                 </Badge>
               ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar p-0">
            <div className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Entidades Conectadas ({filteredNodes.length})</div>
            <div className="space-y-1 p-2">
              {filteredNodes.slice(0, 20).map(node => {
                const Icon = TYPE_ICONS[node.type] || Flag;
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
              {filteredNodes.length > 20 && (
                <div className="text-center text-[9px] font-mono text-slate-600 py-2">
                  Showing top 20 nodes. Search to refine.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel: Interactive Canvas */}
        <div className="lg:col-span-2 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-background to-background border border-border rounded-xl overflow-hidden">
          
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => setZoom(z => Math.min(z + 0.15, 3))}>
               <ZoomIn className="w-4 h-4" />
             </Button>
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}>
               <ZoomOut className="w-4 h-4" />
             </Button>
             <Button variant="outline" size="icon" className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm border-border hover:bg-white/10" onClick={() => { setZoom(0.85); setPan({x: 0, y: 0}); }}>
               <Maximize2 className="w-4 h-4" />
             </Button>
          </div>

          <div className="absolute top-4 left-4 z-20">
             <div className="bg-secondary/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full flex items-center gap-2">
               <Database className="w-3.5 h-3.5 text-primary" />
               <span className="text-[10px] uppercase font-bold tracking-widest text-white">Dynamic Graph Loaded</span>
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
                  {/* Edges calculation */}
                  <svg className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0 }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-slate-600" />
                      </marker>
                    </defs>
                    {filteredEdges.map((edge, i) => {
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
                    const isConnected = filteredEdges.some(e => 
                      (e.source === activeNode && e.target === node.id) || 
                      (e.target === activeNode && e.source === node.id)
                    );
                    const opacity = activeNode ? (isSelected || isConnected ? 1 : 0.25) : 1;
                    const Icon = TYPE_ICONS[node.type] || Flag;

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
                                <img src={node.img} className="w-full object-cover" alt="" />
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
                     {activeNodeData.img ? (
                        <img src={activeNodeData.img} className="w-10 h-auto" alt="" />
                     ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${TYPE_COLORS[activeNodeData.type]}`}>
                          {React.createElement(TYPE_ICONS[activeNodeData.type] || Flag, { className: "w-6 h-6" })}
                        </div>
                     )}
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
                       {filteredEdges.filter(e => e.source === activeNode || e.target === activeNode).map((e, idx) => {
                          const isIncoming = e.target === activeNode;
                          const otherNodeId = isIncoming ? e.source : e.target;
                          const otherNode = filteredNodes.find(n => n.id === otherNodeId);
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
                        {activeNodeData.type === 'team' && teamDetails && (
                          <>
                            <div className="flex justify-between"><span>FIFA Rank:</span> <span className="text-white">#{teamDetails.fifa_rank}</span></div>
                            <div className="flex justify-between"><span>Continent:</span> <span className="text-white">{teamDetails.continent}</span></div>
                            <div className="flex justify-between"><span>Group:</span> <span className="text-white">Group {teamDetails.group_name}</span></div>
                          </>
                        )}
                        {activeNodeData.type === 'event' && matchDetails && (
                          <>
                            <div className="flex justify-between"><span>Stage:</span> <span className="text-white">{matchDetails.stage}</span></div>
                            <div className="flex justify-between"><span>Status:</span> <span className="text-emerald-400">{matchDetails.status}</span></div>
                            <div className="flex justify-between"><span>Score:</span> <span className="text-white">{matchDetails.home_score ?? '-'} - {matchDetails.away_score ?? '-'}</span></div>
                          </>
                        )}
                        {activeNodeData.type === 'stadium' && stadiumDetails && (
                          <>
                            <div className="flex justify-between"><span>City:</span> <span className="text-white">{stadiumDetails.city}</span></div>
                            <div className="flex justify-between"><span>Capacity:</span> <span className="text-white">{stadiumDetails.capacity?.toLocaleString() || 'N/A'}</span></div>
                          </>
                        )}
                        <div className="flex justify-between"><span>Degree:</span> <span className="text-white">{filteredEdges.filter(e => e.source === activeNode || e.target === activeNode).length} edges</span></div>
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
