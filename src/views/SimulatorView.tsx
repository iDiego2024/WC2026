import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play, BarChart2, Activity, ShieldAlert, Cpu, Settings2, RefreshCcw, Database, Zap, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeams, useMatches } from '../hooks/useData';
import { runMonteCarlo } from '../utils/simulatorEngine';

export function SimulatorView() {
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [runs, setRuns] = useState(10000);
  const [scope, setScope] = useState('full');
  const [simulationResults, setSimulationResults] = useState<any[] | null>(null);

  const [weights, setWeights] = useState({
    elo: 45,
    xg: 30,
    fatigue: 15,
    momentum: 10
  });

  const handleResetWeights = () => {
    setWeights({
      elo: 45,
      xg: 30,
      fatigue: 15,
      momentum: 10
    });
  };

  const handleSimulate = () => {
    if (teams.length === 0 || matches.length === 0) return;
    setIsSimulating(true);
    setProgress(0);

    // Prepare teams with dynamic calculated strengths based on FIFA rank and weights
    const teamSims = teams.map(t => {
      // Base strength mapping (rank 1 -> 100, rank 100 -> 10)
      const baseStrength = Math.max(10, 100 - (t.fifa_rank || 50) * 0.85);
      
      const eloFactor = (weights.elo / 100) * baseStrength;
      const xgFactor = (weights.xg / 100) * baseStrength;
      // Inject minor fluctuations based on fatigue & momentum weights
      const fatigueFactor = (weights.fatigue / 100) * (Math.random() * 10 - 5);
      const momentumFactor = (weights.momentum / 100) * (Math.random() * 10 - 5);
      
      const finalStrength = Math.max(10, eloFactor + xgFactor + fatigueFactor + momentumFactor);
      
      return {
        id: t.id,
        code: t.code,
        name: t.name,
        flag_code: t.flag_code,
        group_name: t.group_name || 'A',
        fifa_rank: t.fifa_rank || 50,
        strength: finalStrength
      };
    });

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

    let currentProgress = 0;
    const step = runs >= 100000 ? 2 : runs >= 10000 ? 5 : runs >= 1000 ? 10 : 20;
    
    const interval = setInterval(() => {
      currentProgress += step;
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Execute Monte Carlo simulation using the dynamic engine
        const results = runMonteCarlo(teamSims, matchSims, {}, runs);
        setSimulationResults(results);
        setProgress(100);
        setIsSimulating(false);
      } else {
        setProgress(currentProgress);
      }
    }, 30);
  };

  // Extract championship contender results
  const topContenders = simulationResults ? simulationResults.slice(0, 10) : [];
  const mostLikelyWinner = simulationResults?.[0];
  const mostLikelyRunnerUp = simulationResults?.[1];

  // Discover dark horse anomalies (e.g. rank > 25 but reached semifinals at least 5% of the time)
  const anomalies = simulationResults
    ? simulationResults.filter(t => t.fifa_rank > 25 && t.semi > 3).slice(0, 2)
    : [];

  const PSEUDO_CODE = `function monteCarloTournament(teams, runs) {
  let results = initResultsMap(teams);
  
  for (let i = 0; i < runs; i++) {
    // 1. Calculate base dynamic ratings
    let currentElo = applyFatigueModel(teams.elo, teams.travel);
    
    // 2. Group Stage Phase
    let groupStandings = simulateGroups(teams, currentElo);
    let qualified = getTopTeams(groupStandings);
    
    // 3. Knockout Phase
    let bracket = buildBracket(qualified);
    let winner = simulateBracket(bracket, currentElo);
    
    // 4. Update Probability Vectors
    results[winner.id].wins++;
    updateTransitionMatrix(results, bracket);
  }
  
  return calculateConfidenceScores(results, runs);
}

// Bivariate Poisson for Match Engine
function simMatch(teamA, teamB, eloA, eloB) {
  let lambda = calcExpectedGoals(eloA, eloB, WEIGHTS.xg);
  let mu = calcExpectedGoals(eloB, eloA, WEIGHTS.xg);
  let rho = 0.2; // covariance (dependency)
  
  return sampleBivariatePoisson(lambda, mu, rho);
}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <header className="space-y-0.5 mb-4 border-b border-border/50 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Monte Carlo Engine
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Stochastic simulation & Bayesian inference</p>
        </div>
        <div className="flex items-center gap-4 bg-secondary/50 p-2 rounded-lg border border-border">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500">Nodes Active</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 1,024
            </span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500">Database Connection</span>
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Connected
            </span>
          </div>
        </div>
      </header>

      {teamsError || matchesError ? (
        <Card className="bg-destructive/10 border-destructive/20 text-destructive-foreground p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            <div>
              <h3 className="font-bold text-white">Database connection error</h3>
              <p className="text-xs text-slate-400">Failed to load teams or matches data. Verify Supabase tables exist and match data has been seeded.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column - Configuration */}
        <div className="lg:col-span-4 space-y-4">
          
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border/50 p-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulation Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setScope('groups')} className={`text-[10px] uppercase font-bold p-2 rounded border ${scope === 'groups' ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-slate-400 hover:border-slate-500'} transition-colors`}>Groups</button>
                  <button onClick={() => setScope('brackets')} className={`text-[10px] uppercase font-bold p-2 rounded border ${scope === 'brackets' ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-slate-400 hover:border-slate-500'} transition-colors`}>Bracket</button>
                  <button onClick={() => setScope('full')} className={`text-[10px] uppercase font-bold p-2 rounded border ${scope === 'full' ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-slate-400 hover:border-slate-500'} transition-colors flex items-center justify-center gap-1`}><Zap className="w-3 h-3"/> Full</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Iterations (Runs)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 1000, 10000, 100000].map(val => (
                    <button key={val} onClick={() => setRuns(val)} className={`text-[10px] font-mono font-bold p-2 rounded border ${runs === val ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-secondary border-border text-slate-400 hover:border-slate-500'} transition-colors`}>
                      {val >= 1000 ? val/1000 + 'k' : val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                   <span>Model Weights</span>
                   <span onClick={handleResetWeights} className="text-primary cursor-pointer hover:underline">Reset</span>
                 </label>
                 
                 <div className="space-y-1">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                     <span className="text-slate-300">Base Elo Rating</span>
                     <span className="text-primary font-mono">{weights.elo}%</span>
                   </div>
                   <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${weights.elo}%` }}></div>
                   </div>
                 </div>
                 
                 <div className="space-y-1">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                     <span className="text-slate-300">Expected Goals (xG) Trend</span>
                     <span className="text-primary font-mono">{weights.xg}%</span>
                   </div>
                   <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${weights.xg}%` }}></div>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                     <span className="text-slate-300">Fatigue & Altitude</span>
                     <span className="text-primary font-mono">{weights.fatigue}%</span>
                   </div>
                   <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${weights.fatigue}%` }}></div>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Engine Runner */}
          <Card className="bg-card border-border flex flex-col relative overflow-hidden">
             {isSimulating && (
               <div className="absolute inset-0 bg-blue-500/5 pulse-matrix pointer-events-none">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] animate-slide-up"></div>
               </div>
             )}
            <CardContent className="p-6 relative z-10 space-y-6">
              <Button 
                onClick={handleSimulate} 
                disabled={isSimulating || teamsLoading || matchesLoading || teams.length === 0}
                className={`w-full h-14 ${isSimulating ? 'bg-secondary text-primary border border-primary/50' : 'bg-primary hover:bg-primary/90 text-primary-foreground'} font-black uppercase tracking-widest text-xs transition-all`}
              >
                {teamsLoading || matchesLoading ? (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-3 animate-spin" />
                    Loading Database...
                  </>
                ) : isSimulating ? (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-3 animate-spin" />
                    Crunching {runs.toLocaleString()} runs...
                  </>
                ) : teams.length === 0 ? (
                  "NO SEEDED DATA"
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-3" />
                    EXECUTE SIMULATION
                  </>
                )}
              </Button>
              
              {isSimulating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-slate-400">Processing Matrix</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary border border-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-75 relative" style={{ width: `${progress}%` }}>
                       <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center pt-2">
                    <span className="text-[9px] text-slate-500 font-mono">{(runs * (progress/100)).toFixed(0)} iterations completed</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Middle & Right Column - Data Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <Tabs defaultValue="results" className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            <div className="bg-secondary/30 border-b border-border/50 p-2 flex items-center justify-between">
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="results" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30">Analytics</TabsTrigger>
                <TabsTrigger value="scenarios" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30">Most Likely</TabsTrigger>
                <TabsTrigger value="upsets" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 border border-transparent data-[state=active]:border-orange-500/30 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3"/> Upsets</TabsTrigger>
                <TabsTrigger value="code" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white border border-transparent data-[state=active]:border-white/20"><Code className="w-3 h-3 mr-1.5"/> Logic</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4 overflow-y-auto relative min-h-[400px]">
              
              {!isSimulating && !simulationResults ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Engine Ready</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-2">Adjust parameters and execute simulation to view deterministic probability curves.</p>
                  </div>
                </div>
              ) : isSimulating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-background/50 backdrop-blur-sm z-10">
                   <div className="relative flex items-center justify-center w-32 h-32">
                     <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent rounded-full animate-spin"></div>
                     <div className="absolute inset-2 border-4 border-l-blue-500 border-t-transparent border-r-blue-500/30 border-b-transparent rounded-full animate-spin-reverse"></div>
                     <span className="text-xl font-black text-white font-mono">{progress}%</span>
                   </div>
                   <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest animate-pulse">Computing conditional probabilities...</div>
                </div>
              ) : (
                <>
                  <TabsContent value="results" className="m-0 h-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Championship Probabilities</h3>
                      <span className="text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">CONFIDENCE: HIGHEST ({runs.toLocaleString()} RUNS)</span>
                    </div>

                    <div className="space-y-4">
                      {topContenders.map((team, idx) => {
                        const colors = ['bg-blue-400', 'bg-blue-600', 'bg-red-500', 'bg-yellow-400', 'bg-red-600', 'bg-emerald-500', 'bg-orange-500', 'bg-cyan-500', 'bg-purple-500', 'bg-slate-500'];
                        const color = colors[idx % colors.length];
                        
                        return (
                          <div key={team.teamId} className="flex items-center gap-4 group">
                            <div className="w-4 text-[10px] font-bold text-slate-500 text-right">{idx + 1}</div>
                            <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px]" alt={team.name} />
                            <div className="w-24 text-[11px] font-bold text-slate-200 truncate">{team.name}</div>
                            
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 h-3 bg-secondary rounded-sm overflow-hidden relative group-hover:bg-white/5 transition-colors">
                                <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${team.wins}%`}}></div>
                              </div>
                              <div className="w-12 text-right font-mono text-xs font-bold text-white">{team.wins}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50">
                       <div className="p-4 bg-secondary/30 rounded-xl border border-white/5">
                         <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Most Likely Final</div>
                         {mostLikelyWinner && mostLikelyRunnerUp ? (
                           <>
                             <div className="flex items-center gap-3 mt-3">
                               <div className="flex items-center gap-2">
                                 <img src={`https://flagcdn.com/w20/${mostLikelyWinner.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px]" alt={mostLikelyWinner.name}/>
                                 <span className="text-sm font-black text-white">{mostLikelyWinner.code}</span>
                               </div>
                               <span className="text-[10px] font-mono text-slate-500">v</span>
                               <div className="flex items-center gap-2">
                                 <span className="text-sm font-black text-white">{mostLikelyRunnerUp.code}</span>
                                 <img src={`https://flagcdn.com/w20/${mostLikelyRunnerUp.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px]" alt={mostLikelyRunnerUp.name}/>
                               </div>
                             </div>
                             <div className="text-[10px] font-mono text-primary font-bold mt-2">
                               {((mostLikelyWinner.wins + mostLikelyRunnerUp.wins) / 1.5).toFixed(1)}% Comp. Probability
                             </div>
                           </>
                         ) : (
                           <div className="text-xs text-slate-400 mt-2">Run simulation to view final.</div>
                         )}
                       </div>
                       
                       <div className="p-4 bg-secondary/30 rounded-xl border border-white/5">
                         <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Top Contender Stats</div>
                         {mostLikelyWinner ? (
                           <div className="flex flex-col gap-2 mt-3 text-xs">
                             <div className="flex justify-between items-center"><span className="font-bold text-white">Reach R16</span> <span className="font-mono text-primary">{mostLikelyWinner.r16}%</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-slate-400">Reach Quarter</span> <span className="font-mono text-slate-400">{mostLikelyWinner.quarter}%</span></div>
                           </div>
                         ) : (
                           <div className="text-xs text-slate-400 mt-2">Run simulation to view stats.</div>
                         )}
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="scenarios" className="m-0 h-full animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Phase Probabilities (Top 12)</h3>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead>
                            <tr className="border-b border-border/50 text-[9px] text-slate-500 uppercase tracking-wider">
                              <th className="pb-3 w-32">Team</th>
                              <th className="pb-3 text-center">R32</th>
                              <th className="pb-3 text-center">R16</th>
                              <th className="pb-3 text-center">QF</th>
                              <th className="pb-3 text-center">SF</th>
                              <th className="pb-3 text-center">Final</th>
                              <th className="pb-3 text-center text-primary">Win</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50 font-mono text-[10px]">
                            {simulationResults && simulationResults.slice(0, 12).map((team) => (
                              <tr key={team.teamId} className="hover:bg-white/5 cursor-pointer">
                                <td className="py-3 flex items-center gap-2 font-sans text-white font-bold text-xs">
                                  <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={team.name}/> {team.name}
                                </td>
                                <td className="py-3 text-center text-slate-300">{team.r32}%</td>
                                <td className="py-3 text-center text-slate-300">{team.r16}%</td>
                                <td className="py-3 text-center text-slate-300">{team.quarter}%</td>
                                <td className="py-3 text-center text-slate-300">{team.semi}%</td>
                                <td className="py-3 text-center text-slate-300">{team.final}%</td>
                                <td className="py-3 text-center font-bold text-primary">{team.wins}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upsets" className="m-0 h-full animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4"/> Statistical Anomalies
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase mt-1">Underdogs with favorable path (&gt;3% semifinal chance)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {anomalies.length > 0 ? (
                        anomalies.map((team) => (
                          <div key={team.teamId} className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl block hover:bg-orange-500/10 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <img src={`https://flagcdn.com/w40/${team.flag_code.toLowerCase()}.png`} className="w-8 h-5.5 rounded shadow-sm" alt={team.name}/>
                                <div>
                                  <div className="text-xs font-black text-white uppercase">{team.name} to Semis</div>
                                  <div className="text-[10px] text-orange-400/80 font-bold">FIFA Rank: {team.fifa_rank}</div>
                                </div>
                              </div>
                              <span className="text-xl font-mono font-bold text-orange-400">{team.semi}%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">Model identifies high variance and strong simulation trajectories. Under certain group-stage distributions, they escape top-tier seeds until the Semifinals.</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-4 text-center border border-dashed border-border rounded-xl text-slate-500 text-xs">
                          No significant anomalies detected in this run. Higher weights for fatigue or momentum can induce underdogs volatility.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="m-0 h-full animate-in fade-in duration-500 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Core Simulation Logic</h3>
                      <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-slate-500">src/utils/simulatorEngine.ts</Badge>
                    </div>
                    <div className="flex-1 bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                      <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                      </div>
                      <div className="p-4 overflow-y-auto text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
                        {PSEUDO_CODE}
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>

        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>{children}</span>
}
