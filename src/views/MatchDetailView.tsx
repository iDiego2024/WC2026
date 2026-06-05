import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, BrainCircuit, Activity, Flame, Shield, Swords, ArrowUpRight, Crosshair, BarChart2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../context/LanguageContext";
import { useMatch, useTeams } from "../hooks/useData";

export function MatchDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { match, loading: matchLoading, error: matchError } = useMatch(id || '');
  const { loading: teamsLoading, error: teamsError } = useTeams(); // Used to ensure team data is cached or ready for future features

  const isLoading = matchLoading || teamsLoading;
  const error = matchError || teamsError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('Cargando Partido...', 'Loading Match...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
           <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Error de Conexión', 'Connection Error')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Partido No Encontrado', 'Match Not Found')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('No pudimos encontrar la información de este partido.', 'We could not find the information for this match.')}</p>
      </div>
    );
  }

  const { home_team: home, away_team: away, stadium } = match;

  if (!home || !away) {
     return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 animate-in fade-in duration-500 min-h-[400px]">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Datos Incompletos', 'Incomplete Data')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('Faltan datos de los equipos.', 'Team data is missing.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col pb-6">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-lg border border-border hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {match.stage} {match.group_name && `• ${t('Grupo', 'Group')} ${match.group_name}`} • {stadium?.name || stadium?.city || 'TBD'}
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
                <div className="text-[10px] font-bold text-slate-500 uppercase">{t('Ranking', 'Rank')} {home.fifa_rank || '?'}</div>
              </div>
            </div>

            {/* Score & Context */}
            <div className="flex flex-col items-center justify-center w-1/3 shrink-0">
              {match.status === 'live' && (
                <div className="text-xs font-bold text-primary animate-pulse mb-2 tracking-widest bg-primary/10 px-3 py-1 rounded border border-primary/20">{t('EN VIVO', 'LIVE')}</div>
              )}
              {match.status === 'finished' && (
                <div className="text-xs font-bold text-slate-400 mb-2 tracking-widest px-3 py-1 rounded">{t('FINALIZADO', 'FINISHED')}</div>
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
                <div className="text-[10px] font-bold text-slate-500 uppercase">{t('Ranking', 'Rank')} {away.fifa_rank || '?'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Probabilities Bar */}
        <div className="h-10 bg-secondary/80 border-t border-border flex items-center">
          <div className="flex items-center justify-center w-full text-[10px] font-bold h-full">
            <div className="h-full bg-blue-600 flex items-center justify-start px-4 text-white" style={{ width: '65%' }}>
              {home.code} {t('GANA', 'WIN')} 65%
            </div>
            <div className="h-full bg-slate-700 flex items-center justify-center text-slate-300" style={{ width: '20%' }}>
              {t('EMPATE', 'DRAW')} 20%
            </div>
            <div className="h-full bg-red-600 flex items-center justify-end px-4 text-white" style={{ width: '15%' }}>
              15% {away.code} {t('GANA', 'WIN')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col mt-2">
        <TabsList className="w-full bg-secondary border border-border h-10 p-1 rounded-lg shrink-0 overflow-x-auto justify-start no-scrollbar">
          <TabsTrigger value="overview" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('Resumen', 'Overview')}</TabsTrigger>
          <TabsTrigger value="stats" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('Estds y xG', 'Stats & xG')}</TabsTrigger>
          <TabsTrigger value="tactics" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">{t('Tácticas', 'Tactics')}</TabsTrigger>
          <TabsTrigger value="h2h" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-card data-[state=active]:text-primary transition-colors flex-1 min-w-[80px]">H2H</TabsTrigger>
          <TabsTrigger value="ai" className="text-[10px] font-bold uppercase rounded p-2 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 transition-colors flex items-center justify-center gap-1.5 flex-1 min-w-[90px] border border-transparent">
            <BrainCircuit className="w-3 h-3" /> {t('Predicciones', 'Predictions')}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1 h-full pb-4">
          <TabsContent value="overview" className="h-full m-0 space-y-4">
            
            {/* Momentum & Expected Goals Mini */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 flex flex-col h-48 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 z-10 relative">
                  <h3 className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-primary animate-pulse" /> {t('Impulso en Vivo', 'Live Momentum')}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 bg-secondary px-2 py-0.5 rounded">{t('Últimos 15 min', 'Last 15 mins')}</span>
                </div>
                {/* Mock Chart Area */}
                <div className="flex-1 border-b border-white/5 relative z-10 flex items-end justify-between px-2 pb-2">
                   {/* Home Momentum Bars */}
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[30%]"></div>
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[40%]"></div>
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[80%] opacity-50"></div>
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[60%] opacity-50"></div>
                   <div className="w-2 bg-blue-500/20 rounded-t-sm h-1"></div>
                   {/* Neutral/Away */}
                   <div className="w-2 bg-red-500 rounded-t-sm h-[20%] mt-auto"></div>
                   <div className="w-2 bg-red-500 rounded-t-sm h-[50%] mt-auto"></div>
                   <div className="w-2 bg-blue-500/20 rounded-t-sm h-1"></div>
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[90%] bg-gradient-to-t from-blue-500 to-blue-300"></div>
                   <div className="w-2 bg-blue-500 rounded-t-sm h-[70%]"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5 pointer-events-none"></div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 h-48 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-2">
                    <Crosshair className="w-3 h-3 text-emerald-400" /> {t('Goles Esperados (xG)', 'Expected Goals (xG)')}
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-400">1.84</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{home.name}</div>
                  </div>
                  <div className="w-px h-16 bg-border"></div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-red-400">0.42</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{away.name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl border border-border flex flex-col">
              <div className="p-3 border-b border-border/50">
                <h3 className="text-[10px] font-black uppercase text-slate-300">{t('Línea de Tiempo', 'Match Timeline')}</h3>
              </div>
              <div className="p-4 flex flex-col gap-4 relative">
                {/* Timeline vertical line */}
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-border -translate-x-1/2"></div>
                
                {/* Event 1 */}
                <div className="flex items-center w-full z-10">
                  <div className="w-1/2 pr-6 text-right">
                    <div className="text-sm font-bold text-white">Lionel Messi</div>
                    <div className="text-[10px] font-medium text-slate-400">{t('Asistencia', 'Assist')}: A. Di Maria</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex flex-col items-center justify-center shrink-0 shadow-sm relative right-1/2 translate-x-1/2">
                    <span className="text-[10px] font-bold text-primary">23'</span>
                  </div>
                  <div className="w-1/2 pl-6 flex items-center gap-2">
                     <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black text-[8px]">⚽</div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="flex items-center w-full z-10">
                  <div className="w-1/2 pr-6 flex items-center justify-end gap-2">
                     <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex flex-col items-center justify-center shrink-0 shadow-sm relative right-1/2 translate-x-1/2">
                    <span className="text-[10px] font-bold text-slate-300">41'</span>
                  </div>
                  <div className="w-1/2 pl-6">
                    <div className="text-sm font-bold text-white">Alphonso Davies</div>
                    <div className="text-[10px] font-medium text-slate-400">{t('Falta', 'Foul')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prompts / Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-col items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">{t('Nota Táctica IA', 'AI Tactical Tip')}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{t('La banda derecha de Canadá colapsa bajo presión. Espera más ataques concentrados por la izquierda desde', 'Canada\'s right flank is collapsing under pressure. Expect more attacks concentrated down the left half-space from')} {home.name}. <span className="underline decoration-primary/50 cursor-pointer text-primary">{t('Ver Mapa de Calor', 'View Heatmap')}</span>.</p>
              </div>
            </div>
            
          </TabsContent>

          {/* Other tabs placeholders */}
          <TabsContent value="stats" className="bg-card border border-border p-6 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase text-xs h-40">
            {t('Motor de Estadísticas y Heatmaps...', 'Stats & Heatmaps Engine...')}
          </TabsContent>
          <TabsContent value="tactics" className="bg-card border border-border p-6 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase text-xs h-40">
            {t('Alineaciones y Pizarra...', 'Lineups & Formation Board...')}
          </TabsContent>
          <TabsContent value="h2h" className="bg-card border border-border p-6 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase text-xs h-40">
            {t('Datos Históricos...', 'Historical Data...')}
          </TabsContent>
          <TabsContent value="ai" className="bg-card border border-border p-6 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase text-xs h-40">
            {t('Modelos Predictivos Avanzados...', 'Advanced Predictive Models...')}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
