import { useState, useEffect } from 'react';
import { Layers, RefreshCcw, Save, ChevronRight, Activity, TrendingUp, Trophy, GitBranch, PlayCircle, Settings2, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTeams, useMatches } from '../hooks/useData';
import { runMonteCarlo } from '../utils/simulatorEngine';

export function TwinView() {
  const [twinName, setTwinName] = useState('My Chaos Scenario #1');
  const [isCalculating, setIsCalculating] = useState(false);
  const { teams, loading: teamsLoading } = useTeams();
  const { matches, loading: matchesLoading } = useMatches();
  
  // State for editable scores in our "Twin" universe.
  const [overrides, setOverrides] = useState<Record<string, { h: string, a: string }>>({});
  const [baselineResults, setBaselineResults] = useState<any[] | null>(null);
  const [simulationResults, setSimulationResults] = useState<any[] | null>(null);

  // Compute baseline once data is loaded
  useEffect(() => {
    if (teams.length > 0 && matches.length > 0 && !baselineResults) {
      const teamSims = teams.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        flag_code: t.flag_code,
        group_name: t.group_name || 'A',
        fifa_rank: t.fifa_rank || 50,
        strength: Math.max(10, 100 - (t.fifa_rank || 50) * 0.85)
      }));
      const matchSims = matches.map(m => ({
        id: m.id,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        group_name: m.group_name,
        stage: m.stage,
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score
      }));
      
      const baseRes = runMonteCarlo(teamSims, matchSims, {}, 1000);
      setBaselineResults(baseRes);
      setSimulationResults(baseRes);
    }
  }, [teams, matches, baselineResults]);

  const handleRecalculate = () => {
    if (teams.length === 0 || matches.length === 0) return;
    setIsCalculating(true);
    
    setTimeout(() => {
      const teamSims = teams.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        flag_code: t.flag_code,
        group_name: t.group_name || 'A',
        fifa_rank: t.fifa_rank || 50,
        strength: Math.max(10, 100 - (t.fifa_rank || 50) * 0.85)
      }));
      const matchSims = matches.map(m => ({
        id: m.id,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        group_name: m.group_name,
        stage: m.stage,
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score
      }));

      const res = runMonteCarlo(teamSims, matchSims, overrides, 1000);
      setSimulationResults(res);
      setIsCalculating(false);
    }, 800);
  };

  const handleScoreChange = (matchId: string, side: 'h' | 'a', value: string) => {
    setOverrides(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { h: '', a: '' },
        [side]: value
      }
    }));
  };

  const getDivergence = () => {
    if (!baselineResults || !simulationResults) return { gainers: [], fallers: [] };
    
    const diffs = simulationResults.map(sim => {
      const base = baselineResults.find(b => b.teamId === sim.teamId);
      const baseProb = base ? base.wins : 0;
      const diff = parseFloat((sim.wins - baseProb).toFixed(1));
      return {
        ...sim,
        diff,
        baseProb
      };
    });

    const gainers = diffs.filter(d => d.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 3);
    const fallers = diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 3);

    return { gainers, fallers };
  };

  const getGroupStandings = (groupLetter: string) => {
    const groupTeams = teams.filter(t => t.group_name === groupLetter);
    const groupMatches = matches.filter(m => m.group_name === groupLetter && m.stage === 'Group Stage');

    const standings = groupTeams.map(t => ({
      id: t.id,
      name: t.name,
      flag_code: t.flag_code,
      played: 0,
      gd: 0,
      points: 0
    }));

    groupMatches.forEach(m => {
      const homeId = m.home_team_id;
      const awayId = m.away_team_id;
      if (!homeId || !awayId) return;

      const override = overrides[m.id];
      let homeScore = m.home_score;
      let awayScore = m.away_score;
      let isPlayed = m.status === 'finished' && homeScore !== null && awayScore !== null;

      if (override && override.h !== '' && override.a !== '') {
        homeScore = parseInt(override.h) || 0;
        awayScore = parseInt(override.a) || 0;
        isPlayed = true;
      }

      if (!isPlayed) return;

      const homeTeam = standings.find(s => s.id === homeId);
      const awayTeam = standings.find(s => s.id === awayId);

      if (homeTeam && awayTeam) {
        homeTeam.played++;
        awayTeam.played++;
        homeTeam.gd += (homeScore - awayScore);
        awayTeam.gd += (awayScore - homeScore);

        if (homeScore > awayScore) {
          homeTeam.points += 3;
        } else if (homeScore < awayScore) {
          awayTeam.points += 3;
        } else {
          homeTeam.points += 1;
          awayTeam.points += 1;
        }
      }
    });

    return standings.sort((a, b) => b.points - a.points || b.gd - a.gd || a.name.localeCompare(b.name));
  };

  if (matchesLoading || teamsLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Display Group A matches for direct edit and instant feedback
  const displayMatches = matches.filter(m => m.group_name === 'A' && m.stage === 'Group Stage').slice(0, 6);
  const { gainers, fallers } = getDivergence();

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
            disabled={isCalculating || teams.length === 0}
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
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Group Stage Results (Group A)</div>
              
              {displayMatches.length > 0 ? (
                displayMatches.map((match) => {
                  const home = teams.find(t => t.id === match.home_team_id);
                  const away = teams.find(t => t.id === match.away_team_id);
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
                          placeholder={match.home_score !== null ? String(match.home_score) : "-"}
                        />
                        <span className="text-slate-500 font-mono text-[10px]">vs</span>
                        <input 
                          type="text" 
                          value={matchState.a}
                          onChange={(e) => handleScoreChange(match.id, 'a', e.target.value)}
                           className={`w-8 h-8 rounded text-center font-mono font-black text-sm border-2 focus:outline-none transition-colors ${isOverridden ? 'bg-background border-primary text-primary' : 'bg-background border-border text-white focus:border-slate-400'}`}
                          placeholder={match.away_score !== null ? String(match.away_score) : "-"}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 w-24">
                        <span className="text-[11px] font-bold text-white text-right truncate">{away.name}</span>
                        <img src={`https://flagcdn.com/w20/${away.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={away.name} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic p-2 text-center">No Group A matches found. Seed the database first.</div>
              )}
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
                    {teams.length > 0 ? (
                      getGroupStandings('A').map((team, idx) => {
                        const isQual = idx < 2;
                        return (
                          <tr key={team.id} className={isQual ? (idx === 0 ? "bg-emerald-500/10" : "bg-emerald-500/5") : "opacity-75 grayscale hover:grayscale-0 transition-all"}>
                            <td className="py-2.5 font-sans font-bold text-white flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${isQual ? 'bg-emerald-500' : 'bg-slate-505'}`}></div>
                              <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={team.name}/>
                              {idx + 1}. {team.name} {isQual ? '(Q)' : ''}
                            </td>
                            <td className="py-2.5 text-center text-white">{team.played}</td>
                            <td className="py-2.5 text-center text-white">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                            <td className="py-2.5 text-center font-black text-white">{team.points}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 italic">No teams loaded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>

             <div className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex flex-col items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Butterfly Effect Divergence</div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Override results to see how group outcomes shift the bracket, updating dynamic championship probabilities.
                    </p>
                  </div>
                </div>
             </div>
          </div>

          {/* Probabilities Output */}
          <div className="bg-card rounded-xl border border-border flex flex-col flex-1">
             <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/30">
               <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                 <img src="https://flagcdn.com/w20/us.png" className="w-4 h-3 rounded-[2px] hidden" alt="US"/>
                 <Activity className="w-3.5 h-3.5 text-emerald-400" /> AI Championship Probability Matrix
               </h3>
               <Badge className="text-[8px] uppercase font-mono tracking-wider">Post-Recalculation</Badge>
             </div>
             
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Top Gainers</h4>
                  {gainers.length > 0 ? (
                    gainers.map((team, i) => (
                      <div key={team.teamId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-slate-600">{i+1}</span>
                           <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px]" alt={team.name} />
                           <span className="text-xs font-bold text-white">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-emerald-400">{team.wins}%</span>
                          <Badge className="w-14 justify-center text-[9px] font-mono border-background bg-emerald-500/20 text-emerald-400">
                             +{team.diff}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No gainers detected. Run simulation.</div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-border/50 pb-2">Top Fallers</h4>
                  {fallers.length > 0 ? (
                    fallers.map((team, i) => (
                      <div key={team.teamId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px]" alt={team.name} />
                           <span className="text-xs font-bold text-white opacity-80">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-300">{team.wins}%</span>
                          <Badge className="w-14 justify-center text-[9px] font-mono border-background bg-red-500/20 text-red-400">
                             {team.diff}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No fallers detected. Run simulation.</div>
                  )}
                </div>

             </div>

             <div className="mt-auto p-4 border-t border-border/50 bg-secondary/10">
               <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Model notes: Forcing results updates the bracket seeds, creating structural shifts across tournament paths.</span>
               </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
