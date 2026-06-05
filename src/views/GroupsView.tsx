import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "../context/LanguageContext";
import { useTeams, useMatches } from "../hooks/useData";
import { AlertCircle, Activity } from "lucide-react";

export function GroupsView() {
  const { t } = useLanguage();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();

  const isLoading = teamsLoading || matchesLoading;
  const error = teamsError || matchesError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4 text-slate-400 animate-in fade-in duration-500">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('Cargando Grupos...', 'Loading Groups...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-3 text-slate-400 animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
           <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Error de Conexión', 'Connection Error')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-3 text-slate-400 animate-in fade-in duration-500">
        <Activity className="w-10 h-10 opacity-20" />
        <h3 className="text-sm font-bold text-white tracking-wide">{t('Sin Grupos', 'No Groups')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{t('No hay equipos asignados a grupos en la base de datos.', 'No teams assigned to groups in the database.')}</p>
      </div>
    );
  }

  // Get distinct group names
  const groupsList = Array.from(new Set(teams.map(t => t.group_name))).filter(Boolean).sort();

  const getGroupStandings = (groupName: string) => {
    let groupTeams = teams.filter(t => t.group_name === groupName).map(team => {
      let PJ = 0, PG = 0, PE = 0, PP = 0, GF = 0, GC = 0;
      
      matches?.forEach(match => {
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

      const DG = GF - GC;
      const PTS = (PG * 3) + (PE * 1);

      return {
        ...team,
        PJ, PG, PE, PP, GF, GC, DG, PTS
      };
    });

    groupTeams.sort((a, b) => {
      if (b.PTS !== a.PTS) return b.PTS - a.PTS;
      if (b.DG !== a.DG) return b.DG - a.DG;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.name.localeCompare(b.name);
    });

    return groupTeams;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="space-y-0.5 mb-4">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('Posiciones de Grupos', 'Group Standings')}</h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('Puntos en vivo y simulaciones', 'Live points and simulations')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {groupsList.map(g => {
          const groupTeams = getGroupStandings(g as string);
          return (
            <Card key={g as string} className="overflow-hidden border-border bg-card">
              <CardHeader className="bg-card py-2 px-3 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold text-white uppercase">{t('Grupo', 'Group')} {g as string}</CardTitle>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{t('EN VIVO', 'LIVE')}</span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto w-full">
                <Table className="text-xs min-w-max w-full">
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="w-8 border-r border-border/50 text-center font-bold text-slate-500 h-8">{t('POS', 'POS')}</TableHead>
                      <TableHead className="min-w-[120px] font-bold text-slate-500 h-8">{t('EQUIPO', 'TEAM')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('PJ', 'P')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('PG', 'W')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('PE', 'D')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('PP', 'L')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('GF', 'GF')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('GC', 'GA')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('DG', 'GD')}</TableHead>
                      <TableHead className="text-center w-12 font-bold text-white h-8">{t('PTS', 'PTS')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupTeams.map((team, idx) => (
                      <TableRow key={team.id} className={`${idx < 2 ? "bg-primary/5 border-primary/20" : "border-border/50"} hover:bg-white/5`}>
                        <TableCell className="border-r border-border/50 font-bold text-center text-slate-400 py-2">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3">
                             <img src={`https://flagcdn.com/w40/${team.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={team.name} />
                             <span className="font-bold text-white">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.PJ}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.PG}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.PE}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.PP}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.GF}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{team.GC}</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">{(team.DG > 0 ? '+' : '') + team.DG}</TableCell>
                        <TableCell className="text-center font-bold text-white py-2">{team.PTS}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
