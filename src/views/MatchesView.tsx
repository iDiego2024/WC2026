import { MATCHES, getTeam } from "@/src/data";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export function MatchesView() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <header className="space-y-0.5 mb-2">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('Partidos', 'Matches')}</h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('Calendario completo del torneo', 'Full tournament schedule')}</p>
      </header>

      <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full sm:w-auto self-start bg-secondary border border-border h-8 p-0.5 rounded-md">
          <TabsTrigger value="all" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Todos', 'All Matches')}</TabsTrigger>
          <TabsTrigger value="group" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Fase de Grupos', 'Group Stage')}</TabsTrigger>
          <TabsTrigger value="knockout" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('Eliminatorias', 'Knockout')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 mt-3 border border-border rounded-lg overflow-hidden bg-card/30 flex flex-col">
          <ScrollArea className="flex-1 w-full p-3 h-full overflow-y-auto">
            <div className="space-y-2">
              {MATCHES.map(match => {
                const home = getTeam(match.homeTeamId)!;
                const away = getTeam(match.awayTeamId)!;
                return (
                  <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-card rounded-md border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    
                    <div className="flex flex-col sm:w-1/4">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(match.date), 'MMM do')} • {match.group ? `${t('Grp', 'Grp')} ${match.group}` : match.stage}</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{format(new Date(match.date), 'HH:mm')}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-center gap-3 flex-1 my-2 sm:my-0">
                      <div className="flex items-center justify-end gap-2 w-1/2">
                        <span className="font-bold text-sm text-right text-white">{home.name}</span>
                        <img src={`https://flagcdn.com/w40/${home.flagCode.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={home.name} />
                      </div>
                      
                      <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono font-bold text-slate-400 border border-white/10">VS</div>
                      
                      <div className="flex items-center gap-2 w-1/2">
                        <img src={`https://flagcdn.com/w40/${away.flagCode.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={away.name} />
                        <span className="font-bold text-sm text-left text-white">{away.name}</span>
                      </div>
                    </div>

                    <div className="text-right sm:w-1/4 flex flex-col justify-center items-end hidden md:flex">
                       <span className="text-[10px] font-bold text-slate-400">{match.stadium}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        {/* Placeholder contents for other tabs */}
        <TabsContent value="group" className="p-3 bg-card border border-border rounded-lg mt-3">
          <div className="text-xs font-bold text-slate-500 uppercase">{t('Partidos de fase de grupos...', 'Group stage matches...')}</div>
        </TabsContent>
        <TabsContent value="knockout" className="p-3 bg-card border border-border rounded-lg mt-3">
          <div className="text-xs font-bold text-slate-500 uppercase">{t('Llaves de eliminatoria...', 'Knockout stage brackets...')}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
