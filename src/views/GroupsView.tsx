import { TEAMS } from "@/src/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "../context/LanguageContext";

export function GroupsView() {
  const groups = ['A', 'B'];
  const { t } = useLanguage();

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="space-y-0.5 mb-4">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('Posiciones de Grupos', 'Group Standings')}</h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('Puntos en vivo y simulaciones', 'Live points and simulations')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {groups.map(g => {
          const groupTeams = TEAMS.filter(t => t.group === g).sort((a,b) => a.fifaRank - b.fifaRank); // Mock sorted
          return (
            <Card key={g} className="overflow-hidden border-border bg-card">
              <CardHeader className="bg-card py-2 px-3 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold text-white uppercase">{t('Grupo', 'Group')} {g}</CardTitle>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{t('EN VIVO', 'LIVE')}</span>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="w-8 border-r border-border/50 text-center font-bold text-slate-500 h-8">{t('POS', 'POS')}</TableHead>
                      <TableHead className="font-bold text-slate-500 h-8">{t('EQUIPO', 'TEAM')}</TableHead>
                      <TableHead className="text-center w-8 font-bold text-slate-500 h-8">{t('PJ', 'P')}</TableHead>
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
                             <img src={`https://flagcdn.com/w40/${team.flagCode.toLowerCase()}.png`} className="w-5 h-3.5 rounded-[2px] object-cover" alt={team.name} />
                             <span className="font-bold text-white">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">0</TableCell>
                        <TableCell className="text-center text-slate-500 font-medium py-2">0</TableCell>
                        <TableCell className="text-center font-bold text-white py-2">0</TableCell>
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
