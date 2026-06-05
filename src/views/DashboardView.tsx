import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Activity, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTeams, useMatches } from "../hooks/useData";

export function DashboardView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();

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
                  {teams.filter(t => t.group_name === 'A').slice(0, 4).map((team, index) => {
                    const isTop = index === 0;
                    const pts = isTop ? 3 : 0;
                    const prob = isTop ? '84.2%' : index === 1 ? '61.8%' : index === 2 ? '44.1%' : '9.9%';
                    const opacityClass = index === 2 ? 'opacity-70' : index === 3 ? 'opacity-50' : '';
                    return (
                      <tr key={team.id} className={`${opacityClass} hover:bg-white/5 transition-colors`}>
                        <td className={`py-2.5 font-bold ${isTop ? 'text-primary' : 'text-slate-500'}`}>{index + 1}</td>
                        <td className="py-2.5"><div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-4 h-3 rounded-[2px]" alt={team.code}/><span className={`font-bold ${isTop ? 'text-white' : 'text-slate-300'}`}>{team.code}</span></div></td>
                        <td className={`py-2.5 text-center font-bold ${isTop ? 'text-white' : 'text-slate-300'}`}>{pts}</td>
                        <td className={`py-2.5 text-center font-mono ${isTop ? 'text-slate-400' : 'text-slate-500'}`}>{prob}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/10">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-1">{t('Nota Monte Carlo', 'Monte Carlo Insight')}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">{t('La simulación sugiere que México tiene un 22% de prob. de alcanzar las Semis.', 'Simulation (100k runs) suggests Mexico has a 22% chance to reach the Semifinals.')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 rounded-xl border border-blue-500/20 p-4 flex flex-col justify-between h-32">
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{t('Mi Puntaje de Predicción', 'My Prediction Score')}</div>
              <div className="text-2xl font-black text-white mt-1">2,450 <span className="text-[10px] font-bold text-blue-300/50 uppercase">pts</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-blue-200">{t('Rango', 'Rank')} <span className="text-white font-bold">#4,102</span></div>
              <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 bg-card rounded-xl border border-border relative overflow-hidden flex flex-col">
            <div className="p-6 flex flex-col items-center justify-center relative z-10 flex-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">{t('Modelo de Probabilidad • Análisis IA', 'Probability Model • AI Analysis')}</div>
              
              <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
                <div className="flex flex-col items-center gap-4 group cursor-pointer w-24">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary p-3 border border-border group-hover:border-primary/50 transition-colors flex items-center justify-center">
                    {fHome ? <img src={`https://flagcdn.com/w80/${fHome.flag_code.toLowerCase()}.png`} className="w-full h-auto rounded shadow-sm" alt={fHome.code} /> : <div className="w-full h-full bg-primary/20 rounded-full" />}
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-xl font-black text-white tracking-wide">{fHome ? fHome.name.toUpperCase() : 'TBD'}</div>
                    <div className="text-primary font-mono text-sm md:text-lg font-bold">58.2%</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-slate-700 font-black text-4xl md:text-6xl italic">VS</div>
                  <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase mt-2 text-center">{t('Empate', 'Draw')} 14.8%</div>
                </div>
                
                <div className="flex flex-col items-center gap-4 group cursor-pointer w-24">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary p-3 border border-border group-hover:border-red-500/50 transition-colors flex items-center justify-center">
                    {fAway ? <img src={`https://flagcdn.com/w80/${fAway.flag_code.toLowerCase()}.png`} className="w-full h-auto rounded shadow-sm" alt={fAway.code} /> : <div className="w-full h-full bg-red-500/20 rounded-full" />}
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-xl font-black text-white tracking-wide">{fAway ? fAway.name.toUpperCase() : 'TBD'}</div>
                    <div className="text-slate-500 font-mono text-sm md:text-lg font-bold">27.0%</div>
                  </div>
                </div>
              </div>
              
              {/* Comparative Bars */}
              <div className="w-full max-w-sm mt-10 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    <span>{t('Fuerza de Ataque', 'Attack Strength')}</span>
                    <span className="text-white font-mono">89 | 72</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary">
                    <div className="h-full w-[65%] bg-blue-500"></div>
                    <div className="h-full w-[35%] bg-red-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    <span>{t('Ranking FIFA', 'FIFA Ranking')}</span>
                    <span className="text-white font-mono">{fHome?.fifa_rank || '?'} | {fAway?.fifa_rank || '?'}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary">
                    <div className="h-full w-[88%] bg-blue-500"></div>
                    <div className="h-full w-[12%] bg-red-500"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 bg-secondary/30 p-3 grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('Predecir Res', 'Predict Score')}</span>
                <span className="text-[9px] text-slate-500">+50 pts</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 p-2 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('Simular Juego', 'Simulate Game')}</span>
                <span className="text-[9px] text-primary/60">{t('Motor Monte Carlo', 'Monte Carlo Engine')}</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('Historial H2H', 'H2H History')}</span>
                <span className="text-[9px] text-slate-500">ARG 7-1</span>
              </button>
            </div>
          </div>
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
              <div className="bg-secondary/50 rounded-lg p-2.5 border-l-2 border-primary">
                <p className="text-[10px] leading-relaxed text-slate-300">"{t('Argentina nunca ha perdido el partido inaugural en América bajo Scaloni.', 'Argentina has never lost an opening match in the Americas under Scaloni.')}"</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5 border-l-2 border-blue-500">
                <p className="text-[10px] leading-relaxed text-slate-300">"{t('Alphonso Davies promedia 4.2 acarreos contra el top 10 FIFA.', 'Alphonso Davies averages 4.2 progressive carries per game against top-10 FIFA.')}"</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5 border-l-2 border-orange-500">
                <p className="text-[10px] leading-relaxed text-slate-300">"{t('Patrones de clima en Vancouver favorecen presión de alta intensidad.', 'Weather patterns for Vancouver match favor high-intensity pressing styles.')}"</p>
              </div>
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
            <button className="p-2 text-[9px] font-bold text-slate-500 hover:text-white hover:bg-white/5 uppercase tracking-wider text-center border-t border-border/50 transition-colors">
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

