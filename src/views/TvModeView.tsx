import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Trophy, Activity, Users, Clock, X, ChevronRight, TrendingUp } from 'lucide-react';
import { useMatches, useRankings, useTeams, useNewsArticles } from '../hooks/useData';
import { runMonteCarlo } from '../utils/simulatorEngine';

export function TvModeView() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  
  const { matches, loading: matchesLoading } = useMatches();
  const { rankings, loading: rankingsLoading } = useRankings();
  const { teams, loading: teamsLoading } = useTeams();
  const { news } = useNewsArticles();

  // Ticker animation and clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (matchesLoading || rankingsLoading || teamsLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background text-white flex flex-col items-center justify-center gap-4">
        <Tv className="w-12 h-12 text-primary animate-pulse" />
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
      </div>
    );
  }

  // Filter 4 recent/upcoming matches
  const displayMatches = matches.slice(0, 4);

  // Group A standings (computed dynamically from teams/matches)
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
    })
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || a.name.localeCompare(b.name))
    .slice(0, 4);

  // Run Monte Carlo simulation dynamically using ELO ratings
  const teamSims = teams.map(t => {
    const baseElo = t.elo_rating || 1500;
    const strength = Math.max(10, Math.min(100, (baseElo - 1000) / 10));
    return {
      id: t.id,
      code: t.code,
      name: t.name,
      flag_code: t.flag_code,
      group_name: t.group_name || 'A',
      fifa_rank: t.fifa_rank || 50,
      strength
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

  // Fast 1000 runs simulation for TV presentation
  const simulationResults = runMonteCarlo(teamSims, matchSims, {}, 1000);
  const topContenders = simulationResults.slice(0, 6);

  // Automatically generate ticker items from news articles and AI forecasts
  const tickerNews: string[] = [];
  if (news && news.length > 0) {
    news.slice(0, 5).forEach(article => {
      tickerNews.push(`${article.title.toUpperCase()}: ${article.summary}`);
    });
  }

  if (topContenders[0]) {
    tickerNews.push(`AI SIMULATOR: ${topContenders[0].name} leads championship win probability with ${topContenders[0].wins}% chance.`);
  }
  if (topContenders[1]) {
    tickerNews.push(`CONTENDER: ${topContenders[1].name} ranks #2 with ${topContenders[1].wins}% win probability.`);
  }
  if (rankings[0]) {
    tickerNews.push(`GLOBAL PREDICTOR LEADER: ${rankings[0].display_name} holds #1 rank with ${rankings[0].score} pts!`);
  }
  const finishedMatches = matches.filter(m => m.status === 'finished');
  if (finishedMatches.length > 0) {
    const m = finishedMatches[finishedMatches.length - 1];
    tickerNews.push(`LATEST RESULT: ${m.home_team?.name} ${m.home_score} - ${m.away_score} ${m.away_team?.name} (FT).`);
  }
  const scheduled = matches.filter(m => m.status === 'scheduled');
  if (scheduled[0]) {
    tickerNews.push(`UPCOMING FIXTURE: ${scheduled[0].home_team?.name} vs ${scheduled[0].away_team?.name} in ${scheduled[0].stadium?.city || 'TBD'}.`);
  }

  // Ensure enough items for marquee rotation
  while (tickerNews.length < 5) {
    tickerNews.push("TV TICKER: Live forecast statistics and matchday standings updating in real-time.");
  }

  return (
    <div className="fixed inset-0 z-50 bg-background text-white overflow-hidden flex flex-col font-sans animate-in fade-in duration-1000">
      {/* Top Bar */}
      <header className="h-16 shrink-0 border-b border-border/50 flex items-center justify-between px-8 bg-secondary/30">
        <div className="flex items-center gap-4">
          <Tv className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="text-3xl font-black uppercase tracking-widest">Ultimate Tracker <span className="text-primary font-mono ml-2">TV</span></h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xl font-bold uppercase tracking-widest text-red-400">Live Broadcast</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-300">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Exit TV Mode"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Grid - 3 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 p-6 pb-20">
        
        {/* Col 1: Matches & Results */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            {/* Ambient Top Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            
            <div className="p-5 border-b border-border/50 bg-secondary/50">
              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" /> Live & Recent
              </h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between">
              {displayMatches.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-slate-500 text-xs font-bold uppercase tracking-widest">No Matches Scheduled</div>
              ) : (
                displayMatches.map((match, i) => {
                  const home = match.home_team;
                  const away = match.away_team;
                  const isLive = match.status === 'live';
                  if (!home || !away) return null;
                  
                  return (
                    <div key={i} className="bg-background border border-white/5 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex flex-col items-center gap-2 w-28">
                         <img src={`https://flagcdn.com/w80/${home.flag_code.toLowerCase()}.png`} className="w-12 h-8 rounded shadow-lg" alt={home.name} />
                         <span className="text-sm font-bold uppercase text-slate-300 truncate w-full text-center">{home.name}</span>
                       </div>
                       
                       <div className="flex flex-col items-center">
                         {isLive ? (
                           <div className="text-xs font-bold text-red-400 mb-1 animate-pulse uppercase tracking-widest">72'</div>
                         ) : (
                           <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">FT</div>
                         )}
                         <div className="flex items-center gap-3 text-4xl font-mono font-black text-white">
                           <span>{match.home_score ?? '-'}</span>
                           <span className="text-slate-600">-</span>
                           <span>{match.away_score ?? '-'}</span>
                         </div>
                       </div>

                       <div className="flex flex-col items-center gap-2 w-28">
                         <img src={`https://flagcdn.com/w80/${away.flag_code.toLowerCase()}.png`} className="w-12 h-8 rounded shadow-lg" alt={away.name} />
                         <span className="text-sm font-bold uppercase text-slate-300 truncate w-full text-center">{away.name}</span>
                       </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Col 2: Probabilities & AI */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
            
            <div className="p-5 border-b border-border/50 bg-secondary/50">
              <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <Activity className="w-6 h-6" /> AI Win Probability
              </h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-center gap-6">
              {topContenders.map((team, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 flex justify-center text-xl font-black text-slate-600">{idx + 1}</div>
                  <img src={`https://flagcdn.com/w40/${team.flag_code.toLowerCase()}.png`} className="w-10 h-6.5 rounded shadow border border-white/5" alt={team.name} />
                  <div className="flex-1 flex flex-col">
                     <span className="text-lg font-bold uppercase text-white leading-none mb-2">{team.name}</span>
                     <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${team.wins * 3.5}%` }}></div>
                     </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-2xl font-mono font-black text-emerald-400">{team.wins}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Split (Groups & Global Leaderboard) */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Groups Mini */}
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <div className="p-4 border-b border-border/50 bg-secondary/50">
              <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center justify-between">
                <span>Group A</span>
                <span className="text-xs text-slate-500">Live Standings</span>
              </h2>
            </div>
            <div className="p-4 flex-1">
               <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase font-bold text-slate-500 border-b border-border/50">
                      <th className="pb-3 w-8">#</th>
                      <th className="pb-3">Team</th>
                      <th className="pb-3 text-center w-8">GD</th>
                      <th className="pb-3 text-center w-12">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-base divide-y divide-border/50">
                    {groupATeams.map((team, idx) => (
                      <tr key={team.id} className={idx === 0 ? "bg-white/5" : ""}>
                        <td className="py-3 font-black text-emerald-400">{idx + 1}</td>
                        <td className="py-3 font-sans font-bold text-white flex items-center gap-3">
                          <img src={`https://flagcdn.com/w20/${team.flag_code.toLowerCase()}.png`} className="w-5 h-3.5 rounded-sm" alt={team.name}/> 
                          {team.name}
                        </td>
                        <td className="py-3 text-center text-slate-300">{team.GD >= 0 ? `+${team.GD}` : team.GD}</td>
                        <td className="py-3 text-center font-black text-white">{team.Pts}</td>
                      </tr>
                    ))}
                    {groupATeams.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 text-xs font-bold uppercase">No Teams Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
          </div>

          {/* Social Leaderboard */}
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
            <div className="p-4 border-b border-border/50 bg-secondary/50">
              <h2 className="text-lg font-black uppercase tracking-widest text-yellow-500 flex items-center gap-3">
                <Trophy className="w-5 h-5" /> Global Leaders
              </h2>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              {rankings.slice(0, 4).map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${idx === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="w-10 h-10 rounded-full border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-white text-lg">
                        {p.display_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-lg font-bold text-white uppercase tracking-wider truncate max-w-[120px]">{p.display_name}</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-primary">{p.score} <span className="text-[10px] text-slate-500 font-bold uppercase">pts</span></span>
                </div>
              ))}
              {rankings.length === 0 && (
                <div className="flex items-center justify-center flex-1 text-slate-500 text-xs font-bold uppercase">Leaderboard Empty</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Ticker at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-primary text-background border-t-4 border-emerald-400 flex items-center overflow-hidden z-10">
         <div className="bg-black/90 text-white h-full px-8 flex items-center font-black uppercase tracking-widest shrink-0 border-r border-white/20 shadow-2xl z-20">
           LATEST NEWS
         </div>
         {/* Marquee Animation */}
         <div className="flex-1 overflow-hidden relative h-full">
            <div className="absolute whitespace-nowrap h-full flex items-center animate-ticker will-change-transform z-10 gap-16 px-16 font-mono font-bold text-lg">
               {tickerNews.map((news, i) => (
                 <span key={i} className="flex items-center gap-2">
                   <TrendingUp className="inline-block w-5 h-5 mr-2 -mt-1 opacity-50"/>
                   {news}
                   <span className="ml-16">•</span>
                 </span>
               ))}
               
               {/* Duplicate for seamless infinite scroll */}
               {tickerNews.map((news, i) => (
                 <span key={`dup-${i}`} className="flex items-center gap-2">
                   <TrendingUp className="inline-block w-5 h-5 mr-2 -mt-1 opacity-50"/>
                   {news}
                   <span className="ml-16">•</span>
                 </span>
               ))}
            </div>
         </div>
      </div>
      
      {/* Ticker Keyframes injected via generic style block for speed */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
