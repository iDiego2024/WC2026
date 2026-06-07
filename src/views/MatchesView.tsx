import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useMatches } from "../hooks/useData";
import { AlertCircle, Activity } from "lucide-react";

export function MatchesView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { matches, loading, error } = useMatches();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4 text-slate-400 animate-in fade-in duration-500">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-3 text-slate-400 animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
           <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.connectionError')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-3 text-slate-400 animate-in fade-in duration-500">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.noData')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('common.noDataDesc')}</p>
      </div>
    );
  }

  // Helper to get translated stage/group name
  const getStageLabel = (match: any) => {
    if (match.group_name) {
      return `Grupo ${match.group_name}`;
    }
    const stage = match.stage || "";
    if (stage.toLowerCase().includes("final")) {
      return stage;
    }
    return stage;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <header className="space-y-0.5 mb-2">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('matches.title')}</h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('matches.subtitle')}</p>
      </header>

      <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full sm:w-auto self-start bg-secondary border border-border h-8 p-0.5 rounded-md">
          <TabsTrigger value="all" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('matches.allStages')}</TabsTrigger>
          <TabsTrigger value="group" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('simulator.groupStageProb')}</TabsTrigger>
          <TabsTrigger value="knockout" className="text-[10px] font-bold uppercase rounded-sm outline-none px-3 h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors">{t('ops.matches')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 mt-3 border border-border rounded-lg overflow-hidden bg-card/30 flex flex-col">
          <ScrollArea className="flex-1 w-full p-3 h-full overflow-y-auto">
            <div className="space-y-2">
              {matches.map(match => {
                const home = match.home_team;
                const away = match.away_team;
                if (!home || !away) return null;
                
                return (
                  <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-card rounded-md border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    
                    <div className="flex flex-col sm:w-1/4">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(match.date), 'dd MMM')} • {getStageLabel(match)}</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{format(new Date(match.date), 'HH:mm')}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-center gap-3 flex-1 my-2 sm:my-0">
                      <div className="flex items-center justify-end gap-2 w-1/2">
                        <span className="font-bold text-sm text-right text-white">{home.name}</span>
                        <img src={`https://flagcdn.com/w40/${home.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={home.name} />
                      </div>
                      
                      <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono font-bold text-slate-400 border border-white/10">
                         {match.status === 'live' || match.status === 'finished' ? `${match.home_score ?? 0} - ${match.away_score ?? 0}` : 'VS'}
                      </div>
                      
                      <div className="flex items-center gap-2 w-1/2">
                        <img src={`https://flagcdn.com/w40/${away.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={away.name} />
                        <span className="font-bold text-sm text-left text-white">{away.name}</span>
                      </div>
                    </div>

                    <div className="text-right sm:w-1/4 flex flex-col justify-center items-end hidden md:flex">
                       <span className="text-[10px] font-bold text-slate-400">{match.stadium?.name || match.stadium?.city || 'TBD'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        {/* Placeholder contents for other tabs */}
        <TabsContent value="group" className="p-3 bg-card border border-border rounded-lg mt-3 flex-1 overflow-hidden">
          <ScrollArea className="w-full h-full">
            <div className="space-y-2">
              {matches.filter(m => m.group_name).map(match => {
                const home = match.home_team;
                const away = match.away_team;
                if (!home || !away) return null;
                return (
                  <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-card rounded-md border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col sm:w-1/4">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(match.date), 'dd MMM')} • Grupo {match.group_name}</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{format(new Date(match.date), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-center gap-3 flex-1 my-2 sm:my-0">
                      <div className="flex items-center justify-end gap-2 w-1/2">
                        <span className="font-bold text-sm text-right text-white">{home.name}</span>
                        <img src={`https://flagcdn.com/w40/${home.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={home.name} />
                      </div>
                      <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono font-bold text-slate-400 border border-white/10">
                         {match.status === 'live' || match.status === 'finished' ? `${match.home_score ?? 0} - ${match.away_score ?? 0}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-2 w-1/2">
                        <img src={`https://flagcdn.com/w40/${away.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={away.name} />
                        <span className="font-bold text-sm text-left text-white">{away.name}</span>
                      </div>
                    </div>
                    <div className="text-right sm:w-1/4 flex flex-col justify-center items-end hidden md:flex">
                       <span className="text-[10px] font-bold text-slate-400">{match.stadium?.name || match.stadium?.city || 'TBD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="knockout" className="p-3 bg-card border border-border rounded-lg mt-3 flex-1 overflow-hidden">
          <ScrollArea className="w-full h-full">
            <div className="space-y-2">
              {matches.filter(m => !m.group_name).map(match => {
                const home = match.home_team;
                const away = match.away_team;
                if (!home || !away) return null;
                return (
                  <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-card rounded-md border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col sm:w-1/4">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(match.date), 'dd MMM')} • {match.stage}</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">{format(new Date(match.date), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-center gap-3 flex-1 my-2 sm:my-0">
                      <div className="flex items-center justify-end gap-2 w-1/2">
                        <span className="font-bold text-sm text-right text-white">{home.name}</span>
                        <img src={`https://flagcdn.com/w40/${home.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={home.name} />
                      </div>
                      <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono font-bold text-slate-400 border border-white/10">
                         {match.status === 'live' || match.status === 'finished' ? `${match.home_score ?? 0} - ${match.away_score ?? 0}` : 'VS'}
                      </div>
                      <div className="flex items-center gap-2 w-1/2">
                        <img src={`https://flagcdn.com/w40/${away.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={away.name} />
                        <span className="font-bold text-sm text-left text-white">{away.name}</span>
                      </div>
                    </div>
                    <div className="text-right sm:w-1/4 flex flex-col justify-center items-end hidden md:flex">
                       <span className="text-[10px] font-bold text-slate-400">{match.stadium?.name || match.stadium?.city || 'TBD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
