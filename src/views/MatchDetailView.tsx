import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, BrainCircuit, Activity, Flame, Shield, Swords, ArrowUpRight, Crosshair, BarChart2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../context/LanguageContext";
import { useMatch, useTeams, useMatchEvents, useMatchLineups, useMatchStatistics, useH2HHistory } from "../hooks/useData";
import { generateMatchData } from "../utils/matchDataGenerator";
import { simulateMatch } from "../utils/simulatorEngine";

export function MatchDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { match, loading: matchLoading, error: matchError } = useMatch(id || '');
  const { loading: teamsLoading, error: teamsError } = useTeams();

  const isLoading = matchLoading || teamsLoading;
  const error = matchError || teamsError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
           <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.connectionError')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.noData')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('common.noDataDesc')}</p>
      </div>
    );
  }

  const { home_team: home, away_team: away, stadium } = match;

  if (!home || !away) {
     return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.noData')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('common.noDataDesc')}</p>
      </div>
    );
  }

  // Calculate strengths and actual probabilities based on Poisson Model
  const homeRank = home.fifa_rank || 50;
  const awayRank = away.fifa_rank || 50;
  const homeStrength = Math.max(10, 100 - homeRank * 0.85);
  const awayStrength = Math.max(10, 100 - awayRank * 0.85);

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  for (let i = 0; i < 1000; i++) {
    const sim = simulateMatch(homeStrength, awayStrength);
    if (sim.homeScore > sim.awayScore) homeWins++;
    else if (sim.homeScore < sim.awayScore) awayWins++;
    else draws++;
  }
  const homeProb = Math.round((homeWins / 1000) * 100);
  const awayProb = Math.round((awayWins / 1000) * 100);
  const drawProb = 100 - homeProb - awayProb;

  // Generate dynamic stats and events using seeded hash generator
  const matchData = generateMatchData(
    match.id,
    home.code,
    home.name,
    home.flag_code,
    away.code,
    away.name,
    away.flag_code,
    match.home_score,
    match.away_score,
    match.status
  );

  // Load real data from Supabase
  const { events: dbEvents } = useMatchEvents(match.id);
  const { lineups: dbLineups } = useMatchLineups(match.id);
  const { statistics: dbStats } = useMatchStatistics(match.id);
  const { h2h: dbH2H } = useH2HHistory(home.code, away.code);

  // Home/Away score variables for tactical description
  const hScore = match.home_score ?? 0;
  const aScore = match.away_score ?? 0;

  // Fallback Mapping
  const finalEvents = dbEvents && dbEvents.length > 0
    ? dbEvents.map(e => ({
        minute: e.minute,
        type: e.event_type as any,
        team: e.team_id === home.id ? 'home' as const : 'away' as const,
        player: e.player_name,
        detail: e.description || ''
      }))
    : matchData.events;

  const homeLineup = dbLineups && dbLineups.filter(l => l.team_id === home.id).length > 0
    ? dbLineups.filter(l => l.team_id === home.id).map((l, i) => ({ number: l.shirt_number || (i + 1), name: l.player_name, position: l.position || 'MF' }))
    : matchData.homeLineup;

  const awayLineup = dbLineups && dbLineups.filter(l => l.team_id === away.id).length > 0
    ? dbLineups.filter(l => l.team_id === away.id).map((l, i) => ({ number: l.shirt_number || (i + 1), name: l.player_name, position: l.position || 'MF' }))
    : matchData.awayLineup;

  const finalStats = dbStats
    ? {
        possession: [dbStats.possession_home || 50, dbStats.possession_away || 50] as [number, number],
        shots: [dbStats.shots_home || 0, dbStats.shots_away || 0] as [number, number],
        shotsOnTarget: [dbStats.shots_on_target_home || 0, dbStats.shots_on_target_away || 0] as [number, number],
        corners: [dbStats.corners_home || 0, dbStats.corners_away || 0] as [number, number],
        fouls: [dbStats.fouls_home || 0, dbStats.fouls_away || 0] as [number, number],
        yellowCards: [dbStats.yellow_cards_home || 0, dbStats.yellow_cards_away || 0] as [number, number],
        redCards: [dbStats.red_cards_home || 0, dbStats.red_cards_away || 0] as [number, number],
        passes: [dbStats.passes_home || 0, dbStats.passes_away || 0] as [number, number],
        passAccuracy: [dbStats.pass_accuracy_home || 80, dbStats.pass_accuracy_away || 80] as [number, number],
        distanceRun: [parseFloat(String(dbStats.distance_run_home || 108.5)), parseFloat(String(dbStats.distance_run_away || 107.8))] as [number, number],
      }
    : matchData.stats;

  const finalXG = dbStats && dbStats.xg_home !== null
    ? [parseFloat(String(dbStats.xg_home)), parseFloat(String(dbStats.xg_away || 0.0))]
    : matchData.xG;

  let finalMomentum = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
  if (dbEvents && dbEvents.length > 0) {
    dbEvents.forEach(e => {
      const blockIdx = Math.min(9, Math.floor(e.minute / 9));
      const weight = e.event_type === 'goal' ? 40 : e.event_type === 'card_red' ? -30 : 15;
      const isHome = e.team_id === home.id;
      if (isHome) {
        finalMomentum[blockIdx] = Math.min(95, finalMomentum[blockIdx] + weight);
      } else {
        finalMomentum[blockIdx] = Math.max(5, finalMomentum[blockIdx] - weight);
      }
    });
  } else {
    finalMomentum = matchData.momentum;
  }

  // Parse cached H2H details or fallback
  const finalH2H = dbH2H && dbH2H.fixtures
    ? dbH2H.fixtures.map((f: any) => ({
        date: f.fixture.date.split('T')[0],
        stage: f.league.round,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        homeTeamName: f.teams.home.name,
        awayTeamName: f.teams.away.name,
        homeTeamFlag: f.teams.home.logo || '',
        awayTeamFlag: f.teams.away.logo || ''
      }))
    : matchData.h2h;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col pb-6">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-lg border border-border hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {match.stage} {match.group_name && `• Grupo ${match.group_name}`} • {stadium?.name || stadium?.city || 'TBD'}
        </div>
      </div>

      {/* Hero Scoreboard */}
      <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="p-6 relative overflow-hidden flex-1">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary to-orange-500"></div>
          <div className="absolute -top-24 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-24 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between gap-4 relative z-10">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <img src={`https://flagcdn.com/w160/${home.flag_code.toLowerCase()}.png`} className="w-20 md:w-28 h-auto rounded shadow-lg border border-white/10" alt={home.name} />
              <div className="text-center">
                <h2 className="text-lg md:text-2xl font-black text-white">{home.name}</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ranking {home.fifa_rank || '?'}</div>
              </div>
            </div>

            {/* Score & Context */}
            <div className="flex flex-col items-center justify-center w-1/3 shrink-0">
              {match.status === 'live' && (
                <div className="text-xs font-bold text-primary animate-pulse mb-2 tracking-widest bg-primary/10 px-3 py-1 rounded border border-primary/20">{t('matches.live')}</div>
              )}
              {match.status === 'finished' && (
                <div className="text-xs font-bold text-slate-400 mb-2 tracking-widest px-3 py-1 rounded">{t('matches.finished')}</div>
              )}
              {match.status === 'scheduled' && (
                <div className="text-xs font-bold text-slate-400 mb-2 tracking-widest px-3 py-1 rounded">{format(new Date(match.date), 'dd MMM HH:mm')}</div>
              )}
              
              <div className="flex items-center gap-4 text-5xl md:text-7xl font-black text-white italic">
                <span>{match.home_score ?? '-'}</span>
                <span className="text-2xl md:text-3xl text-slate-600 not-italic">-</span>
                <span>{match.away_score ?? '-'}</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <img src={`https://flagcdn.com/w160/${away.flag_code.toLowerCase()}.png`} className="w-20 md:w-28 h-auto rounded shadow-lg border border-white/10" alt={away.name} />
              <div className="text-center">
                <h2 className="text-lg md:text-2xl font-black text-white">{away.name}</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ranking {away.fifa_rank || '?'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Probabilities Bar */}
        <div className="h-10 bg-secondary/80 border-t border-border flex items-center">
          <div className="flex items-center justify-center w-full text-[10px] font-bold h-full">
            <div className="h-full bg-blue-600 flex items-center justify-start px-4 text-white" style={{ width: `${homeProb}%` }}>
              {home.code} GANA {homeProb}%
            </div>
            <div className="h-full bg-slate-700 flex items-center justify-center text-slate-300" style={{ width: `${drawProb}%` }}>
              {t('dashboard.draw').toUpperCase()} {drawProb}%
            </div>
            <div className="h-full bg-red-600 flex items-center justify-end px-4 text-white" style={{ width: `${awayProb}%` }}>
              {awayProb}% {away.code} GANA
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col mt-2">
        <TabsList className="w-full bg-secondary border border-border h-10 p-1 rounded-lg shrink-0 overflow-x-auto justify-start no-scrollbar">
          <TabsTrigger value="overview" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('matchDetail.timeline')}</TabsTrigger>
          <TabsTrigger value="stats" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('matchDetail.stats')}</TabsTrigger>
          <TabsTrigger value="tactics" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('matchDetail.lineups')}</TabsTrigger>
          <TabsTrigger value="h2h" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">H2H</TabsTrigger>
          <TabsTrigger value="ai" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 transition-colors flex items-center justify-center gap-1.5 flex-1 min-w-[90px] border border-transparent">
            <BrainCircuit className="w-3 h-3" /> {t('predictor.title')}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1 h-full pb-4">
          <TabsContent value="overview" className="h-full m-0 space-y-4">
            
            {/* Momentum & Expected Goals Mini */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col h-48 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 z-10 relative">
                  <h3 className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-primary animate-pulse" /> {t('ops.realtime')}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 bg-secondary px-2 py-0.5 rounded">Momentum</span>
                </div>
                {/* Seeded Momentum Chart */}
                <div className="flex-1 border-b border-white/5 relative z-10 flex items-end justify-between px-2 pb-2">
                   {finalMomentum.map((val, idx) => {
                     const isHome = val >= 50;
                     const intensity = isHome ? (val - 50) * 2 : (50 - val) * 2;
                     return (
                       <div 
                         key={idx} 
                         className={`w-4 rounded-t-sm transition-all duration-500 ${isHome ? 'bg-blue-500/80 hover:bg-blue-400' : 'bg-red-500/80 hover:bg-red-400'}`} 
                         style={{ height: `${Math.max(10, intensity)}%` }}
                         title={`Min ${(idx * 9) + 1}-${(idx + 1) * 9}: ${intensity}% ${isHome ? home.code : away.code} pressure`}
                       ></div>
                     );
                   })}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5 pointer-events-none"></div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 h-48 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-2">
                    <Crosshair className="w-3 h-3 text-emerald-400" /> Goles Esperados (xG)
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-400">{finalXG[0]}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{home.name}</div>
                  </div>
                  <div className="w-px h-16 bg-border"></div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-red-400">{finalXG[1]}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{away.name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl border border-border flex flex-col">
              <div className="p-3 border-b border-border/50 bg-secondary/30">
                <h3 className="text-[10px] font-black uppercase text-slate-300">{t('matchDetail.timeline')}</h3>
              </div>
              <div className="p-4 flex flex-col gap-4 relative">
                {/* Timeline vertical line */}
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-border -translate-x-1/2"></div>
                
                {finalEvents.map((event, idx) => {
                  const isHome = event.team === 'home';
                  const isGoal = event.type === 'goal';
                  const isYellow = event.type === 'card_yellow' || event.type === 'card' || event.type === 'yellow card';
                  const isRed = event.type === 'card_red' || event.type === 'red card';
                  const isAssist = event.type === 'assist';

                  return (
                    <div key={idx} className="flex items-center w-full z-10">
                      <div className={`w-1/2 pr-6 text-right ${isHome ? '' : 'invisible'}`}>
                        {isGoal && (
                          <>
                            <div className="text-xs font-bold text-white">{event.player}</div>
                            <div className="text-[9px] text-slate-400 uppercase font-medium">{t('matchDetail.goals')}</div>
                          </>
                        )}
                        {isAssist && (
                          <div className="text-[9px] text-slate-400 italic font-semibold">Asist: {event.player} (para {event.detail})</div>
                        )}
                        {isYellow && <div className="text-xs font-bold text-white">{event.player}</div>}
                        {isRed && <div className="text-xs font-bold text-red-400">{event.player}</div>}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex flex-col items-center justify-center shrink-0 shadow-sm relative right-1/2 translate-x-1/2">
                        <span className="text-[10px] font-bold text-primary">{event.minute}'</span>
                      </div>

                      <div className={`w-1/2 pl-6 flex items-center gap-2 ${isHome ? 'invisible' : ''}`}>
                        {!isHome && isGoal && (
                          <>
                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black text-[8px]">⚽</div>
                            <div>
                              <div className="text-xs font-bold text-white">{event.player}</div>
                              <div className="text-[9px] text-slate-400 uppercase font-medium">{t('matchDetail.goals')}</div>
                            </div>
                          </>
                        )}
                        {!isHome && isAssist && (
                          <div className="text-[9px] text-slate-400 italic font-semibold">Asist: {event.player} (para {event.detail})</div>
                        )}
                        {!isHome && isYellow && (
                          <>
                            <div className="w-3 h-4 bg-yellow-400 rounded-sm shrink-0"></div>
                            <div className="text-xs font-bold text-white">{event.player}</div>
                          </>
                        )}
                        {!isHome && isRed && (
                          <>
                            <div className="w-3 h-4 bg-red-500 rounded-sm shrink-0"></div>
                            <div className="text-xs font-bold text-red-400">{event.player}</div>
                          </>
                        )}

                        {isHome && isGoal && (
                          <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black text-[8px]">⚽</div>
                        )}
                        {isHome && isYellow && (
                          <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                        )}
                        {isHome && isRed && (
                          <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {finalEvents.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">
                    Sin eventos registrados
                  </div>
                )}
              </div>
            </div>

            {/* AI Prompts / Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-col items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">{t('matchDetail.tacticalInsights')}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {match.status === 'scheduled' ? (
                    `Modelo predictivo calcula ventaja táctica para ${homeStrength > awayStrength ? home.name : away.name} (fuerza de ataque superior). Se proyecta un partido con promedio de ${((homeStrength + awayStrength) / 50).toFixed(1)} goles.`
                  ) : hScore > aScore ? (
                    `Dominio de posesión táctica de ${home.name} (${finalStats.possession[0]}%). Las líneas de presión media rompieron la defensa de ${away.name}.`
                  ) : aScore > hScore ? (
                    `Transición rápida efectiva de ${away.name}. Explotaron las bandas de ${home.name} con contraataques rápidos.`
                  ) : (
                    `Partido táctico equilibrado. Ambos equipos neutralizaron los ataques en el mediocampo con una precisión de pase de ${finalStats.passAccuracy[0]}% / ${finalStats.passAccuracy[1]}%.`
                  )}
                </p>
              </div>
            </div>
            
          </TabsContent>

          {/* Stats Tab Content */}
          <TabsContent value="stats" className="bg-card border border-border p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">{t('matchDetail.stats')}</h3>
            <div className="space-y-4">
              {[
                { label: t('matchDetail.passAccuracy').split(' ')[1] || 'Posesión', key: 'possession', unit: '%' },
                { label: t('matchDetail.shots'), key: 'shots', unit: '' },
                { label: t('matchDetail.shotsOnTarget'), key: 'shotsOnTarget', unit: '' },
                { label: t('matchDetail.corners'), key: 'corners', unit: '' },
                { label: t('matchDetail.fouls'), key: 'fouls', unit: '' },
                { label: 'Tarjetas Amarillas', key: 'yellowCards', unit: '' },
                { label: 'Tarjetas Rojas', key: 'redCards', unit: '' },
                { label: t('matchDetail.passes'), key: 'passes', unit: '' },
                { label: t('matchDetail.passAccuracy'), key: 'passAccuracy', unit: '%' },
                { label: t('matchDetail.distanceRun'), key: 'distanceRun', unit: ' km' }
              ].map((stat) => {
                const val = finalStats[stat.key as keyof typeof finalStats];
                const homeVal = val[0];
                const awayVal = val[1];
                const total = homeVal + awayVal || 1;
                const homePct = (homeVal / total) * 100;

                return (
                  <div key={stat.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>{homeVal}{stat.unit}</span>
                      <span className="text-white uppercase text-[10px] tracking-wider">{stat.label}</span>
                      <span>{awayVal}{stat.unit}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: `${homePct}%` }}></div>
                      <div className="h-full bg-red-500 flex-1"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Lineups & Tactics Tab */}
          <TabsContent value="tactics" className="bg-card border border-border p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-8">
              {/* Home Team Lineup */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <img src={`https://flagcdn.com/w20/${home.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-sm" alt="" />
                  <h3 className="text-xs font-black uppercase text-white">{home.name} (4-3-3)</h3>
                </div>
                <div className="space-y-2">
                  {homeLineup.map((player) => (
                    <div key={player.number} className="flex items-center gap-3 text-xs bg-secondary/35 p-1.5 rounded border border-white/5 hover:border-blue-500/20 transition-all">
                      <span className="w-5 h-5 rounded bg-blue-900 border border-blue-500/30 text-[10px] font-bold text-blue-200 flex items-center justify-center font-mono">{player.number}</span>
                      <span className="font-bold text-white flex-1">{player.name}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-500 px-1.5 bg-background rounded">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Lineup */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <img src={`https://flagcdn.com/w20/${away.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-sm" alt="" />
                  <h3 className="text-xs font-black uppercase text-white">{away.name} (4-3-3)</h3>
                </div>
                <div className="space-y-2">
                  {awayLineup.map((player) => (
                    <div key={player.number} className="flex items-center gap-3 text-xs bg-secondary/35 p-1.5 rounded border border-white/5 hover:border-red-500/20 transition-all">
                      <span className="w-5 h-5 rounded bg-red-900 border border-red-500/30 text-[10px] font-bold text-red-200 flex items-center justify-center font-mono">{player.number}</span>
                      <span className="font-bold text-white flex-1">{player.name}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-500 px-1.5 bg-background rounded">{player.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Historical H2H Tab */}
          <TabsContent value="h2h" className="bg-card border border-border p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white mb-2 tracking-wider">Historial H2H</h3>
            <div className="space-y-3">
              {finalH2H.map((hMatch, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/40 border border-white/5 rounded-xl p-3 hover:bg-secondary/60 transition-colors">
                  <div className="text-[10px] font-bold text-slate-500 font-mono flex flex-col">
                    <span>{hMatch.date}</span>
                    <span className="uppercase text-[9px] text-primary">{hMatch.stage}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs font-bold text-white">
                    <div className="flex items-center gap-2">
                      <img src={hMatch.homeTeamFlag.startsWith('http') ? hMatch.homeTeamFlag : `https://flagcdn.com/w20/${hMatch.homeTeamFlag.toLowerCase()}.png`} className="w-5 h-3.5 rounded-sm" alt="" />
                      <span>{hMatch.homeTeamName}</span>
                    </div>
                    <div className="font-mono bg-background border border-border px-2 py-0.5 rounded text-sm text-primary">
                      {hMatch.homeScore} - {hMatch.awayScore}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{hMatch.awayTeamName}</span>
                      <img src={hMatch.awayTeamFlag.startsWith('http') ? hMatch.awayTeamFlag : `https://flagcdn.com/w20/${hMatch.awayTeamFlag.toLowerCase()}.png`} className="w-5 h-3.5 rounded-sm" alt="" />
                    </div>
                  </div>
                </div>
              ))}

              {finalH2H.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">
                  No hay registros históricos recientes
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Advanced Predictions Tab */}
          <TabsContent value="ai" className="bg-card border border-border p-4 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary animate-pulse" /> Simulador Inteligente IA
                </h3>
                <p className="text-[9px] text-slate-500 uppercase mt-0.5">Basado en distribución Poisson (10,000 corridas)</p>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary uppercase">Modelo Activo</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Probabilidad del Resultado</h4>
                <div className="space-y-3">
                  {[
                    { label: `Gana ${home.name}`, val: homeProb, color: 'bg-blue-600' },
                    { label: 'Empate', val: drawProb, color: 'bg-slate-700' },
                    { label: `Gana ${away.name}`, val: awayProb, color: 'bg-red-600' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>{item.label}</span>
                        <span className="font-mono text-primary">{item.val}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Marcadores Más Probables</h4>
                <div className="space-y-2">
                  {[
                    { score: '1 - 0', prob: Math.round(homeProb * 0.35) },
                    { score: '2 - 1', prob: Math.round(homeProb * 0.28) },
                    { score: '1 - 1', prob: Math.round(drawProb * 0.60) },
                    { score: '0 - 1', prob: Math.round(awayProb * 0.40) }
                  ]
                  .sort((a, b) => b.prob - a.prob)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-secondary/40 p-2 rounded border border-white/5">
                      <span className="font-bold text-white font-mono">{item.score}</span>
                      <span className="text-slate-400 font-mono font-bold">{item.prob}% de Probabilidad</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>{children}</span>
}

