import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Activity, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTeams, useMatches, useAuth, usePlayerStats, useNewsArticles, useTournamentInsights } from "../hooks/useData";
import { simulateMatch } from "../utils/simulatorEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  const { user } = useAuth();
  const { players } = usePlayerStats();
  const { news } = useNewsArticles();
  const { insights: dbInsights } = useTournamentInsights();

  const isLoading = teamsLoading || matchesLoading;
  const error = teamsError || matchesError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 animate-in fade-in duration-500">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('Cargando Datos de Supabase...', 'Loading Supabase Data...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
           <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Error de Conexión', 'Connection Error')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  if (!matches || matches.length === 0 || !teams || teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Sin Datos', 'No Data')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('No hay partidos o equipos definidos en Supabase. Por favor corre el seed.', 'No matches or teams defined in Supabase. Please run the seed.')}</p>
      </div>
    );
  }

  // Find featured match for the probability center
  const featureMatch = matches.find(m => m.status === 'scheduled') || matches[0];
  const fHome = featureMatch?.home_team;
  const fAway = featureMatch?.away_team;

  // Real Poisson probabilities for featureMatch
  let fHomeProb = 33;
  let fAwayProb = 33;
  let fDrawProb = 34;

  if (fHome && fAway) {
    const fHomeRank = fHome.fifa_rank || 50;
    const fAwayRank = fAway.fifa_rank || 50;
    const fHomeStrength = Math.max(10, 100 - fHomeRank * 0.85);
    const fAwayStrength = Math.max(10, 100 - fAwayRank * 0.85);

    let fHomeWins = 0;
    let fAwayWins = 0;
    let fDraws = 0;
    for (let i = 0; i < 1000; i++) {
      const sim = simulateMatch(fHomeStrength, fAwayStrength);
      if (sim.homeScore > sim.awayScore) fHomeWins++;
      else if (sim.homeScore < sim.awayScore) fAwayWins++;
      else fDraws++;
    }
    fHomeProb = Math.round((fHomeWins / 1000) * 100);
    fAwayProb = Math.round((fAwayWins / 1000) * 100);
    fDrawProb = 100 - fHomeProb - fAwayProb;
  }

  // Calculate dynamic Group A standings
  const groupATeams = teams
    .filter(t => t.group_name === 'A')
    .map(team => {
      let PJ = 0, PG = 0, PE = 0, PP = 0, GF = 0, GC = 0;
      matches.forEach(match => {
        const isFinished = match.status === 'finished';
        const homeScore = match.home_score;
        const awayScore = match.away_score;

        if (isFinished && homeScore !== null && awayScore !== null) {
          if (match.home_team_id === team.id || match.home_team?.id === team.id) {
            PJ++;
            GF += homeScore;
            GC += awayScore;
            if (homeScore > awayScore) PG++;
            else if (homeScore === awayScore) PE++;
            else PP++;
          } else if (match.away_team_id === team.id || match.away_team?.id === team.id) {
            PJ++;
            GF += awayScore;
            GC += homeScore;
            if (awayScore > homeScore) PG++;
            else if (awayScore === homeScore) PE++;
            else PP++;
          }
        }
      });
      return { ...team, GD: GF - GC, Pts: PG * 3 + PE };
    });

  // Calculate simulation probabilities based on strengths
  const sumStrength = groupATeams.reduce((acc, t) => acc + Math.max(10, 100 - (t.fifa_rank || 50) * 0.85), 0) || 1;
  const groupStandingsSim = groupATeams.map(t => {
    const strength = Math.max(10, 100 - (t.fifa_rank || 50) * 0.85);
    const winGroupProb = Math.round((strength / sumStrength) * 100);
    return {
      ...t,
      prob: `${winGroupProb}%`
    };
  }).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || a.name.localeCompare(b.name));

  // Dynamic tactical insights
  const dynamicInsights = fHome && fAway ? [
    t(`${fHome.name} llega con un ranking FIFA de #${fHome.fifa_rank} contra #${fAway.fifa_rank} de ${fAway.name}.`, `${fHome.name} enters with a FIFA ranking of #${fHome.fifa_rank} against #${fAway.fifa_rank} for ${fAway.name}.`),
    t(`La probabilidad calculada favorece a ${fHome.name} con un ${fHomeProb}% frente al ${fAwayProb}% de ${fAway.name}.`, `Calculated probability favors ${fHome.name} with ${fHomeProb}% against ${fAwayProb}% for ${fAway.name}.`),
    t(`El historial H2H proyectado y la aclimatación favorecerán un planteamiento de alta intensidad.`, `Projected H2H history and acclimatization will favor a high-intensity approach.`)
  ] : [
    t('Todos los partidos están listos para simulación.', 'All fixtures are ready for simulation.'),
    t('Ejecuta el simulador Monte Carlo para actualizar proyecciones de campeonato.', 'Run the Monte Carlo simulator to update championship projections.')
  ];

  // Define displayInsights using tournament_insights from Supabase if available
  const displayInsights = dbInsights && dbInsights.length > 0
    ? dbInsights.map(item => `${item.title}: ${item.description}`)
    : dynamicInsights;

  // Prepare top scorers and assist leaders
  const topScorers = [...players]
    .filter(p => p.stats && p.stats.goals > 0)
    .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
    .slice(0, 5);

  const topAssists = [...players]
    .filter(p => p.stats && p.stats.assists > 0)
    .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      
      {/* Live Match Horizontal Ticker */}
      <div className="h-16 border border-border bg-secondary flex items-center px-4 gap-4 overflow-x-auto shrink-0 rounded-xl no-scrollbar">
        <div className="flex-none text-[10px] font-bold text-primary uppercase tracking-widest px-2 whitespace-nowrap">{t('Jornada 1', 'Matchday 1')}</div>
        <div className="flex gap-3">
          {matches.slice(0, 4).map(match => {
            const isLive = match.status === 'live';
            const isFinished = match.status === 'finished';
            const home = match.home_team;
            const away = match.away_team;
            if (!home || !away) return null;
            
            return (
              <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className={`cursor-pointer transition-colors rounded p-2 flex items-center gap-3 w-44 shrink-0 ${isLive ? 'bg-white/10 hover:bg-white/15 border border-primary/30 ring-1 ring-primary/20' : 'bg-white/5 hover:bg-white/10 border border-white/5 opacity-80'}`}>
                <div className="flex flex-col gap-1 w-12">
                  <div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${home.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={home.code}/><span className="text-[10px] font-bold text-white">{home.code}</span></div>
                  <div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${away.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={away.code}/><span className="text-[10px] font-bold text-white">{away.code}</span></div>
                </div>
                <div className="ml-auto text-right">
                  {isLive ? (
                     <>
                       <div className="text-[10px] font-bold text-primary animate-pulse">{t('EN VIVO', 'LIVE')}</div>
                       <div className="text-[11px] font-mono font-bold text-white">{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                     </>
                  ) : isFinished ? (
                     <>
                       <div className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">FT</div>
                       <div className="text-[11px] font-mono font-bold text-white">{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                     </>
                  ) : (
                     <>
                       <div className="text-xs font-bold text-white">{format(new Date(match.date), "HH:mm")}</div>
                       <div className="text-[9px] text-slate-500 italic max-w-[50px] truncate">{match.stadium?.city || 'TBD'}</div>
                     </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-card rounded-xl border border-border flex flex-col flex-1">
            <div className="p-3 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-[10px] font-black tracking-wider text-slate-300 uppercase">{t('Posiciones Grupo A', 'Group A Standings')}</h3>
              <span className="text-[9px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{t('SIM PROB', 'PROB SIM')}</span>
            </div>
            <div className="p-2 flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-border/50 text-[9px] uppercase tracking-wider">
                    <th className="text-left pb-2 font-bold w-6">{t('Pos', 'Pos')}</th>
                    <th className="text-left pb-2 font-bold">{t('Equipo', 'Team')}</th>
                    <th className="text-center pb-2 font-bold w-8">{t('Pts', 'Pts')}</th>
                    <th className="text-center pb-2 font-bold w-10">{t('Ganar%', 'Win%')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {groupStandingsSim.map((team, index) => {
                    const isTop = index === 0;
                    const opacityClass = index === 2 ? 'opacity-70' : index === 3 ? 'opacity-50' : '';
                    return (
                      <tr key={team.id} className={`${opacityClass} hover:bg-white/5 transition-colors`}>
                        <td className={`py-2.5 font-bold ${isTop ? 'text-primary' : 'text-slate-500'}`}>{index + 1}</td>
                        <td className="py-2.5"><div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={team.code}/><span className={`font-bold ${isTop ? 'text-white' : 'text-slate-300'}`}>{team.code}</span></div></td>
                        <td className={`py-2.5 text-center font-bold ${isTop ? 'text-white' : 'text-slate-300'}`}>{team.Pts}</td>
                        <td className={`py-2.5 text-center font-mono ${isTop ? 'text-slate-400' : 'text-slate-500'}`}>{team.prob}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/10">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-1">{t('Nota Monte Carlo', 'Monte Carlo Insight')}</p>
                {groupStandingsSim[0] ? (
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t(`La simulación sugiere que ${groupStandingsSim[0].name} tiene la mayor prob. (${groupStandingsSim[0].prob}) de ganar el Grupo A.`, `Simulation suggests that ${groupStandingsSim[0].name} has the highest prob. (${groupStandingsSim[0].prob}) to win Group A.`)}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 leading-relaxed">{t('No hay simulación disponible.', 'No simulation available.')}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 rounded-xl border border-blue-500/20 p-4 flex flex-col justify-between h-32">
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{t('Mi Puntaje de Predicción', 'My Prediction Score')}</div>
              <div className="text-2xl font-black text-white mt-1">{(user?.score ?? 0).toLocaleString()} <span className="text-[10px] font-bold text-blue-300/50 uppercase">pts</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-blue-200">{t('Perfil Activo', 'Active Profile')} <span className="text-white font-bold">{user?.display_name || 'Guest'}</span></div>
              <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Premium Tabs widget */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Tabs defaultValue="forecast" className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
              <h3 className="text-[10px] font-black tracking-wider text-slate-300 uppercase">{t('Análisis y Datos del Torneo', 'Tournament Analysis & Data')}</h3>
              <TabsList className="bg-secondary/50 border border-border h-7 p-0.5 rounded-md">
                <TabsTrigger value="forecast" className="text-[9px] font-bold uppercase rounded-sm px-2.5 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Pronóstico IA', 'AI Forecast')}</TabsTrigger>
                <TabsTrigger value="players" className="text-[9px] font-bold uppercase rounded-sm px-2.5 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Top Jugadores', 'Top Players')}</TabsTrigger>
                <TabsTrigger value="news" className="text-[9px] font-bold uppercase rounded-sm px-2.5 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Noticias', 'Latest News')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="forecast" className="m-0 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-6 flex flex-col items-center justify-center relative z-10 flex-1 overflow-y-auto no-scrollbar">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">{t('Modelo de Probabilidad • Análisis IA', 'Probability Model • AI Analysis')}</div>
                
                <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
                  <div className="flex flex-col items-center gap-4 group cursor-pointer w-24" onClick={() => navigate(`/match/${featureMatch.id}`)}>
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary p-3 border border-border group-hover:border-primary/50 transition-colors flex items-center justify-center">
                      {fHome ? <img src={`https://flagcdn.com/w80/${fHome.flag_code.toLowerCase()}.png`} className="w-full h-auto rounded shadow-sm" alt={fHome.code} /> : <div className="w-full h-full bg-primary/20 rounded-full" />}
                    </div>
                    <div className="text-center">
                      <div className="text-sm md:text-xl font-black text-white tracking-wide">{fHome ? fHome.name.toUpperCase() : 'TBD'}</div>
                      <div className="text-primary font-mono text-sm md:text-lg font-bold">{fHomeProb}%</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-slate-700 font-black text-4xl md:text-6xl italic">VS</div>
                    <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase mt-2 text-center">{t('Empate', 'Draw')} {fDrawProb}%</div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 group cursor-pointer w-24" onClick={() => navigate(`/match/${featureMatch.id}`)}>
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary p-3 border border-border group-hover:border-red-500/50 transition-colors flex items-center justify-center">
                      {fAway ? <img src={`https://flagcdn.com/w80/${fAway.flag_code.toLowerCase()}.png`} className="w-full h-auto rounded shadow-sm" alt={fAway.code} /> : <div className="w-full h-full bg-red-500/20 rounded-full" />}
                    </div>
                    <div className="text-center">
                      <div className="text-sm md:text-xl font-black text-white tracking-wide">{fAway ? fAway.name.toUpperCase() : 'TBD'}</div>
                      <div className="text-slate-500 font-mono text-sm md:text-lg font-bold">{fAwayProb}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Comparative Bars */}
                <div className="w-full max-w-sm mt-8 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      <span>{t('Fuerza de Ataque', 'Attack Strength')}</span>
                      <span className="text-white font-mono">
                        {fHome && fAway ? `${Math.round(fHomeProb * 1.5)} | ${Math.round(fAwayProb * 1.5)}` : '50 | 50'}
                      </span>
                    </div>
                    <div className="flex h-1 rounded-full overflow-hidden bg-secondary">
                      <div className="h-full bg-blue-500" style={{ width: `${fHomeProb}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${fAwayProb}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      <span>{t('Ranking FIFA', 'FIFA Ranking')}</span>
                      <span className="text-white font-mono">{fHome?.fifa_rank || '?'} | {fAway?.fifa_rank || '?'}</span>
                    </div>
                    <div className="flex h-1 rounded-full overflow-hidden bg-secondary">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.max(5, 100 - (fHome?.fifa_rank || 50))}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${Math.max(5, 100 - (fAway?.fifa_rank || 50))}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics (ELO, indexes) */}
                <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm border-t border-border/30 pt-4 text-[10px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('ELO Rating', 'ELO Rating')}</span>
                      <span className="font-mono text-white font-bold">{fHome?.elo_rating || 1500} vs {fAway?.elo_rating || 1500}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('Índice de Posesión', 'Possession Index')}</span>
                      <span className="font-mono text-white font-bold">{Math.round(50 + (fHomeProb - fAwayProb) * 0.2)}% | {Math.round(50 - (fHomeProb - fAwayProb) * 0.2)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('Índice de Ataque', 'Attack Index')}</span>
                      <span className="font-mono text-white font-bold">{fHome?.attack_rating || 50} | {fAway?.attack_rating || 50}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('Índice de Defensa', 'Defense Index')}</span>
                      <span className="font-mono text-white font-bold">{fHome?.defense_rating || 50} | {fAway?.defense_rating || 50}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 bg-secondary/30 p-3 grid grid-cols-3 gap-3">
                <button onClick={() => navigate('/predictor')} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('Predecir Res', 'Predict Score')}</span>
                  <span className="text-[9px] text-slate-500">+50 pts</span>
                </button>
                <button onClick={() => navigate('/simulator')} className="flex flex-col items-center justify-center gap-1 p-2 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('Simular Juego', 'Simulate Game')}</span>
                  <span className="text-[9px] text-primary/60">{t('Motor Monte Carlo', 'Monte Carlo Engine')}</span>
                </button>
                <button onClick={() => navigate(`/match/${featureMatch.id}`)} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('Historial H2H', 'H2H History')}</span>
                  <span className="text-[9px] text-slate-500">{fHome?.code} vs {fAway?.code}</span>
                </button>
              </div>
            </TabsContent>

            <TabsContent value="players" className="m-0 flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Scorers Column */}
                <div className="bg-secondary/20 rounded-xl p-3 border border-border/50">
                  <h4 className="text-[10px] font-black tracking-wider text-primary uppercase mb-2">{t('Goleadores', 'Top Scorers')}</h4>
                  <div className="space-y-2">
                    {topScorers.length > 0 ? (
                      topScorers.map((player, idx) => (
                        <div key={player.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                            <img src={`https://flagcdn.com/w20/${player.team?.flag_code?.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt="flag" />
                            <span className="text-white font-semibold">{player.name}</span>
                          </div>
                          <span className="font-mono text-primary font-bold text-xs">{player.stats?.goals} {t('Goles', 'Goals')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 py-4 text-center">{t('Cargando estadísticas...', 'Loading stats...')}</p>
                    )}
                  </div>
                </div>

                {/* Top Assists Column */}
                <div className="bg-secondary/20 rounded-xl p-3 border border-border/50">
                  <h4 className="text-[10px] font-black tracking-wider text-blue-400 uppercase mb-2">{t('Asistencias', 'Top Assists')}</h4>
                  <div className="space-y-2">
                    {topAssists.length > 0 ? (
                      topAssists.map((player, idx) => (
                        <div key={player.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                            <img src={`https://flagcdn.com/w20/${player.team?.flag_code?.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt="flag" />
                            <span className="text-white font-semibold">{player.name}</span>
                          </div>
                          <span className="font-mono text-blue-400 font-bold text-xs">{player.stats?.assists} {t('Asist', 'Assists')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 py-4 text-center">{t('Cargando estadísticas...', 'Loading stats...')}</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="news" className="m-0 flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
              {news && news.length > 0 ? (
                news.slice(0, 6).map((article) => (
                  <div key={article.id} className="bg-secondary/30 rounded-xl p-3 border border-border/50 hover:bg-secondary/40 transition-colors flex gap-3">
                    {article.image_url && (
                      <img src={article.image_url} className="w-16 h-12 rounded object-cover flex-shrink-0" alt="news" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{article.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">{article.summary || article.description}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-500">
                        <span>{article.source_name || 'WC2026 Media'}</span>
                        <span>{format(new Date(article.published_at || article.created_at), 'dd MMM, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-10 text-xs">
                  {t('No hay noticias del torneo en este momento.', 'No tournament news available at the moment.')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-card rounded-xl border border-border flex flex-col h-[260px]">
            <div className="p-3 border-b border-border/50">
              <h3 className="text-[10px] font-black tracking-wider text-white uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                {t('Insights Inteligentes IA', 'AI Smart Insights')}
              </h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar">
              {displayInsights.map((insight, index) => {
                const borderColors = ['border-primary', 'border-blue-500', 'border-orange-500'];
                const color = borderColors[index % borderColors.length];
                return (
                  <div key={index} className={`bg-secondary/50 rounded-lg p-2.5 border-l-2 ${color}`}>
                    <p className="text-[10px] leading-relaxed text-slate-300">"{insight}"</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-[200px]">
            <div className="p-3 border-b border-border/50">
              <h3 className="text-[10px] font-black tracking-wider text-slate-300 uppercase">{t('Liga: Profesionales', 'Friends League: Pros')}</h3>
            </div>
            <div className="flex-1 p-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-blue-900 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-200">DT</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white">Diego Tracker</div>
                  <div className="text-[9px] font-bold text-primary">+150 pts {t('hoy', 'today')}</div>
                </div>
                <div className="text-xs font-black text-white">#1</div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">MS</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-300">Marcus_Sim</div>
                  <div className="text-[9px] font-bold text-red-400">-20 pts {t('hoy', 'today')}</div>
                </div>
                <div className="text-xs font-black text-slate-500">#2</div>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">SG</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-300">Sofie_Goal</div>
                  <div className="text-[9px] font-bold text-slate-500">{t('Sin actividad', 'No activity')}</div>
                </div>
                <div className="text-xs font-black text-slate-500">#3</div>
              </div>
            </div>
            <button onClick={() => navigate('/community')} className="p-2 text-[9px] font-bold text-slate-500 hover:text-white hover:bg-white/5 uppercase tracking-wider text-center border-t border-border/50 transition-colors">
              {t('Ver Tabla Completa', 'View Full League Board')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Global Stats Ticker */}
      <footer className="h-10 border border-primary/20 bg-primary/5 rounded-xl flex items-center px-4 gap-6 overflow-x-auto shrink-0 no-scrollbar">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[9px] font-bold text-primary uppercase">{t('Prob. Goleador:', 'Top Scorer Prob:')}</span>
          <span className="text-[10px] font-bold text-white">K. Mbappé (14.2%)</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[9px] font-bold text-primary uppercase">{t('Mejor Defensa:', 'Top Defense:')}</span>
          <span className="text-[10px] font-bold text-white">{t('Francia', 'France')} (0.42 xGA)</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[9px] font-bold text-primary uppercase">{t('Valor Mercado:', 'Market Value:')}</span>
          <span className="text-[10px] font-bold text-white">{t('Inglaterra', 'England')} (€1.4B)</span>
        </div>
        <div className="ml-auto flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[9px] font-bold uppercase text-slate-400">{t('Motor en Tiempo Real Activo', 'Real-time Engine Active')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

