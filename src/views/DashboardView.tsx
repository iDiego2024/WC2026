import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MATCHES, getTeam } from "@/src/data";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export function DashboardView() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      
      {/* Live Match Horizontal Ticker */}
      <div className="h-16 border border-border bg-secondary flex items-center px-4 gap-4 overflow-x-auto shrink-0 rounded-xl no-scrollbar">
        <div className="flex-none text-[10px] font-bold text-primary uppercase tracking-widest px-2 whitespace-nowrap">{t('Jornada 1', 'Matchday 1')}</div>
        <div className="flex gap-3">
          <div onClick={() => navigate(`/match/m2`)} className="bg-white/5 cursor-pointer hover:bg-white/10 transition-colors rounded p-2 flex items-center gap-3 w-44 border border-white/5 shrink-0">
            <div className="flex flex-col gap-1 w-12">
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ca.png" className="w-4 h-3 rounded-[2px]" alt="CAN"/><span className="text-[10px] font-bold text-slate-300">CAN</span></div>
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ar.png" className="w-4 h-3 rounded-[2px]" alt="ARG"/><span className="text-[10px] font-bold text-slate-300">ARG</span></div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-bold text-white">18:00</div>
              <div className="text-[9px] text-slate-500 italic">Vancouver</div>
            </div>
          </div>
          <div onClick={() => navigate(`/match/m1`)} className="bg-white/10 cursor-pointer hover:bg-white/15 transition-colors rounded p-2 flex items-center gap-3 w-44 border border-primary/30 ring-1 ring-primary/20 shrink-0">
            <div className="flex flex-col gap-1 w-12">
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/mx.png" className="w-4 h-3 rounded-[2px]" alt="MEX"/><span className="text-[10px] font-bold text-white">MEX</span></div>
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ma.png" className="w-4 h-3 rounded-[2px]" alt="MAR"/><span className="text-[10px] font-bold text-white">MAR</span></div>
            </div>
            <div className="ml-auto text-right">
               <div className="text-[10px] font-bold text-primary animate-pulse">{t('EN VIVO', 'LIVE')}</div>
               <div className="text-[11px] font-mono font-bold text-white">2 - 1</div>
            </div>
          </div>
          <div className="bg-white/5 rounded p-2 flex items-center gap-3 w-44 border border-white/5 opacity-60 shrink-0">
            <div className="flex flex-col gap-1 w-12">
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/us.png" className="w-4 h-3 rounded-[2px]" alt="USA"/><span className="text-[10px] font-bold text-slate-300">USA</span></div>
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/kr.png" className="w-4 h-3 rounded-[2px]" alt="KOR"/><span className="text-[10px] font-bold text-slate-300">KOR</span></div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-bold text-white">21:30</div>
              <div className="text-[9px] text-slate-500 italic">Dallas</div>
            </div>
          </div>
          <div className="bg-white/5 rounded p-2 flex items-center gap-3 w-44 border border-white/5 opacity-60 shrink-0">
            <div className="flex flex-col gap-1 w-12">
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/gb-eng.png" className="w-4 h-3 rounded-[2px]" alt="ENG"/><span className="text-[10px] font-bold text-slate-300">ENG</span></div>
              <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/gh.png" className="w-4 h-3 rounded-[2px]" alt="GHA"/><span className="text-[10px] font-bold text-slate-300">GHA</span></div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] font-bold font-mono text-slate-400">{t('MAÑANA', 'TOM')}</div>
            </div>
          </div>
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
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-primary">1</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/mx.png" className="w-4 h-3 rounded-[2px]" alt="MEX"/><span className="font-bold text-white">MEX</span></div></td>
                    <td className="py-2.5 text-center font-bold text-white">3</td>
                    <td className="py-2.5 text-center text-slate-400 font-mono">84.2%</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-slate-300">2</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ca.png" className="w-4 h-3 rounded-[2px]" alt="CAN"/><span className="font-bold text-white">CAN</span></div></td>
                    <td className="py-2.5 text-center font-bold text-white">0</td>
                    <td className="py-2.5 text-center text-slate-400 font-mono">61.8%</td>
                  </tr>
                  <tr className="opacity-70 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-slate-500">3</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/it.png" className="w-4 h-3 rounded-[2px]" alt="ITA"/><span className="font-bold text-slate-300">ITA</span></div></td>
                    <td className="py-2.5 text-center font-bold text-slate-300">0</td>
                    <td className="py-2.5 text-center text-slate-500 font-mono">44.1%</td>
                  </tr>
                  <tr className="opacity-50 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-slate-500">4</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ma.png" className="w-4 h-3 rounded-[2px]" alt="MAR"/><span className="font-bold text-slate-300">MAR</span></div></td>
                    <td className="py-2.5 text-center font-bold text-slate-300">0</td>
                    <td className="py-2.5 text-center text-slate-500 font-mono">9.9%</td>
                  </tr>
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
                    <img src="https://flagcdn.com/w80/ar.png" className="w-full h-auto rounded shadow-sm" alt="ARG" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-xl font-black text-white tracking-wide">{t('ARGENTINA', 'ARGENTINA')}</div>
                    <div className="text-primary font-mono text-sm md:text-lg font-bold">58.2%</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-slate-700 font-black text-4xl md:text-6xl italic">VS</div>
                  <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase mt-2 text-center">{t('Empate', 'Draw')} 14.8%</div>
                </div>
                
                <div className="flex flex-col items-center gap-4 group cursor-pointer w-24">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary p-3 border border-border group-hover:border-red-500/50 transition-colors flex items-center justify-center">
                    <img src="https://flagcdn.com/w80/ca.png" className="w-full h-auto rounded shadow-sm" alt="CAN" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-xl font-black text-white tracking-wide">{t('CANADÁ', 'CANADA')}</div>
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
                    <span className="text-white font-mono">1 | 48</span>
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

