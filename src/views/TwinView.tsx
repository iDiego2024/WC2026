import { useState } from 'react';
import { Layers, RefreshCcw, Save, ChevronRight, Activity, TrendingUp, Trophy, GitBranch, PlayCircle, Settings2, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMatches } from '../hooks/useData';

export function TwinView() {
  const [twinName, setTwinName] = useState('My Chaos Scenario #1');
  const [isCalculating, setIsCalculating] = useState(false);
  const { matches, loading: matchesLoading } = useMatches();
  
  // State for editable scores in our "Twin" universe.
  // Pre-seed with actual data structure for the first 2 matches.
  const [overrides, setOverrides] = useState<Record<string, { h: string, a: string }>>({
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': { h: '2', a: '1' }
  });

  const handleRecalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 1500);
  };

  const handleScoreChange = (matchId: string, side: 'h' | 'a', value: string) => {
    setOverrides(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value
      }
    }));
  };

  if (matchesLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter first 4 matches for sandbox
  const displayMatches = matches.slice(0, 4);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 pb-4">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            Digital Twin
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Fork reality. Modify results. See the butterfly effect.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={twinName} 
            onChange={(e) => setTwinName(e.target.value)}
            className="bg-secondary/50 border border-border rounded px-3 py-1.5 text-xs text-white font-bold w-48 focus:outline-none focus:border-primary/50"
          />
          <Button variant="outline" size="sm" className="bg-secondary border-border h-8 text-[10px] font-bold uppercase"><Save className="w-3 h-3 mr-2"/> Save Twin</Button>
          <Button 
            size="sm" 
            onClick={handleRecalculate}
            disabled={isCalculating}
            className={`h-8 text-[10px] font-bold uppercase ${isCalculating ? 'bg-secondary text-primary' : ''}`}
          >
            {isCalculating ? <RefreshCcw className="w-3 h-3 mr-2 animate-spin" /> : <PlayCircle className="w-3 h-3 mr-2" />}
            {isCalculating ? 'Computing Divergence...' : 'Recalculate Engine'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Result Editor */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
          
          <div className="bg-card rounded-xl border border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-blue-400" /> State Modifier
              </h3>
              <Badge variant="outline" className="text-[9px] font-mono border-blue-500/30 text-blue-400 bg-blue-500/10">Active Fork</Badge>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Group Stage Results</div>
              
              {displayMatches.map((match) => {
                const home = match.home_team;
                const away = match.away_team;
                if (!home || !away) return null;

                const matchState = overrides[match.id] || { h: '', a: '' };
                const isOverridden = overrides[match.id] !== undefined;

                return (
                  <div key={match.id} className={`flex items-center justify-between p-2 rounded-lg border ${isOverridden ? 'bg-primary/5 border-primary/30' : 'bg-secondary/50 border-white/5'} transition-colors`}>
                    <div className="flex items-center gap-2 w-24">
                      <img src={`https://flagcdn.com/w20/${home.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={home.name} />
                      <span className="text-[11px] font-bold text-white truncate">{home.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={matchState.h}
                        onChange={(e) => handleScoreChange(match.id, 'h', e.target.value)}
                        className={`w-8 h-8 rounded text-center font-mono font-black text-sm border-2 focus:outline-none transition-colors ${isOverridden ? 'bg-background border-primary text-primary' : 'bg-background border-border text-white focus:border-slate-400'}`}
                        placeholder="-"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">vs</span>
                      <input 
                        type="text" 
                        value={matchState.a}
                        onChange={(e) => handleScoreChange(match.id, 'a', e.target.value)}
                         className={`w-8 h-8 rounded text-center font-mono font-black text-sm border-2 focus:outline-none transition-colors ${isOverridden ? 'bg-background border-primary text-primary' : 'bg-background border-border text-white focus:border-slate-400'}`}
                        placeholder="-"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 w-24">
                      <span className="text-[11px] font-bold text-white text-right truncate">{away.name}</span>
                      <img src={`https://flagcdn.com/w20/${away.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={away.name} />
                    </div>
                  </div>
                )
              })}

              <Button variant="ghost" className="w-full text-[9px] uppercase font-bold text-slate-400 hover:text-white h-8 border border-dashed border-border mt-2">
                Load More Matches...
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
             <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
                <Settings2 className="w-3.5 h-3.5 text-orange-400" /> Twin Settings
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tiebreaker Protocol</span>
                <span className="text-[10px] font-mono text-emerald-400">FIFA Official</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-Simulate Unplayed</span>
                <div className="w-8 h-4 bg-primary rounded-full relative"><div className="absolute right-1 top-1 bottom-1 w-2 bg-white rounded-full"></div></div>
              </div>
          </div>

        </div>

        {/* Right Column: Dynamic Impacts */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-4 relative">
          
          {isCalculating && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl border border-primary/20">
              <div className="relative w-24 h-24 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                 <div className="absolute inset-3 border-4 border-blue-500/30 border-b-blue-500 rounded-full animate-spin-reverse"></div>
                 <GitBranch className="w-8 h-8 text-primary animate-pulse" />
              </div>
               <div className="mt-4 text-[10px] font-mono uppercase text-primary tracking-widest text-center">
                 <div>Recompiling Bracket Topology...</div>
                 <div className="text-slate-400 mt-1">Executing WASM tiebreaker engine</div>
               </div>
            </div>
          )}

          {/* Group Recalculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-yellow-400" /> Live Standings: Group A</span>
                  <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/20">Altered</Badge>
                </h3>
                
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] uppercase font-bold text-slate-500 border-b border-border/50">
                      <th className="pb-2">Team</th>
                      <th className="pb-2 text-center w-8">P</th>
                      <th className="pb-2 text-center w-8">GD</th>
                      <th className="pb-2 text-center w-8">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px] divide-y divide-border/50">
                    <tr className="bg-emerald-500/10">
                      <td className="py-2.5 font-sans font-bold text-emerald-400 flex items-center gap-2"><div className="w-1 h-3 bg-emerald-500 rounded-full"></div> 1. Canada (Q)</td>
                      <td className="py-2.5 text-center text-white">3</td>
                      <td className="py-2.5 text-center text-white">+2</td>
                      <td className="py-2.5 text-center font-black text-white">7</td>
                    </tr>
                    <tr className="bg-emerald-500/5">
                      <td className="py-2.5 font-sans font-bold text-white flex items-center gap-2"><div className="w-1 h-3 bg-emerald-500/50 rounded-full"></div> 2. Argentina (Q)</td>
                      <td className="py-2.5 text-center text-slate-300">3</td>
                      <td className="py-2.5 text-center text-slate-300">+1</td>
                      <td className="py-2.5 text-center font-black text-white">6</td>
                    </tr>
                    <tr className="opacity-50 grayscale hover:grayscale-0 transition-all">
                      <td className="py-2.5 font-sans font-bold text-slate-300 flex items-center gap-2"><div className="w-1 h-3 bg-red-500/50 rounded-full"></div> 3. Mexico</td>
                      <td className="py-2.5 text-center text-slate-400">3</td>
                      <td className="py-2.5 text-center text-slate-400">-1</td>
                      <td className="py-2.5 text-center font-bold text-slate-300">4</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex flex-col items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-red-400 tracking-widest">Butterfly Effect Divergence</div>
                    <div className="text-xs text-slate-300 mt-1 leading-relaxed">By forcing <span className="font-bold text-white">CAN 2-1 ARG</span>, Argentina drops to 2nd place in Group A, pushing them into the other side of the knockout bracket.</div>
                  </div>
                </div>
             </div>
          </div>

          {/* Probabilities Output */}
          <div className="bg-card rounded-xl border border-border flex flex-col flex-1">
             <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/30">
               <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-emerald-400" /> AI Championship Probability Matrix
               </h3>
               <Badge className="text-[8px] uppercase font-mono tracking-wider">Post-Recalculation</Badge>
             </div>
             
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-border/50 pb-2">New Favourites</h4>
                  {[
                    { name: 'France', flag: 'fr', prob: 18.2, trend: '+4.0%', up: true },
                    { name: 'Brazil', flag: 'br', prob: 15.5, trend: '+3.7%', up: true },
                    { name: 'England', flag: 'gb-eng', prob: 12.1, trend: '0.0%', up: null },
                  ].map((team, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-slate-600">{i+1}</span>
                         <img src={`https://flagcdn.com/w20/${team.flag}.png`} className="w-5 h-3.5 rounded-[2px]" alt={team.name} />
                         <span className="text-xs font-bold text-white">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-emerald-400">{team.prob}%</span>
                        <Badge variant="outline" className={`w-14 justify-center text-[9px] font-mono border-background ${team.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-slate-400'}`}>
                           {team.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Top Fallers</h4>
                  {[
                    { name: 'Argentina', flag: 'ar', prob: 9.4, trend: '-7.0%', down: true },
                    { name: 'Spain', flag: 'es', prob: 8.1, trend: '-1.2%', down: true },
                  ].map((team, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <img src={`https://flagcdn.com/w20/${team.flag}.png`} className="w-5 h-3.5 rounded-[2px]" alt={team.name} />
                         <span className="text-xs font-bold text-white opacity-80">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-300">{team.prob}%</span>
                        <Badge variant="outline" className={`w-14 justify-center text-[9px] font-mono border-background bg-red-500/20 text-red-400`}>
                           {team.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

             </div>

             <div className="mt-auto p-4 border-t border-border/50 bg-secondary/10">
               <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Model notes: Argentina's harder path significantly boosts France and Brazil's statistical chances of reaching the final.</span>
               </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
