import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowRightLeft, Trophy, FileText, Info, Search, Filter, HelpCircle, Star } from 'lucide-react';

export function FantasyView() {
  const [activeTab, setActiveTab] = useState('squad');

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 flex flex-col h-[calc(100vh-8rem)]">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Fantasy World Cup
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Manage your ultimate squad & conquer the global leaderboard</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="bg-secondary/30 border border-border/50 p-2 rounded-xl mb-4 shrink-0 overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent h-10 p-0 space-x-2 w-full justify-start">
            <TabsTrigger value="squad" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30 flex items-center gap-2"><Shield className="w-3.5 h-3.5"/> My Squad</TabsTrigger>
            <TabsTrigger value="transfers" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30 flex items-center gap-2"><ArrowRightLeft className="w-3.5 h-3.5"/> Transfers</TabsTrigger>
            <TabsTrigger value="leagues" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30 flex items-center gap-2"><Trophy className="w-3.5 h-3.5"/> Leagues</TabsTrigger>
            <TabsTrigger value="rules" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-white h-full px-4 border border-transparent data-[state=active]:border-white/10 flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> Rules & Scoring</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          
          {/* SQUAD BUILDER */}
          <TabsContent value="squad" className="m-0 h-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-0 w-full h-1 bg-emerald-500 leading-none"></div>
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1 mt-1">Gameweek Pts</span>
                 <span className="text-3xl font-black text-white">64</span>
               </div>
               <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Overall Rank</span>
                 <span className="text-xl font-black text-white">#12,402</span>
               </div>
               <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Total Points</span>
                 <span className="text-xl font-black text-white">215</span>
               </div>
               <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-0 w-full h-1 bg-yellow-400"></div>
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1 mt-1">Team Value</span>
                 <span className="text-xl font-black text-white font-mono">€101.4m</span>
               </div>
            </div>

            {/* Pitch Container */}
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-emerald-900 border-2 border-emerald-800/50 rounded-2xl relative flex flex-col min-h-[500px] overflow-hidden shadow-2xl">
              {/* Field lines */}
              <div className="absolute inset-x-0 top-0 h-1/2 border-b-2 border-white/20"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/20"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/20 rounded-t-sm"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white/20 rounded-b-sm"></div>
              
              <div className="relative z-10 flex-1 flex flex-col justify-around py-4">
                {/* Forwards */}
                <div className="flex justify-center gap-8 md:gap-16">
                  <PlayerCard name="Mbappé" team="FRA" price="12.5m" position="FWD" points="12" isCaptain />
                  <PlayerCard name="Álvarez" team="ARG" price="9.0m" position="FWD" points="8" />
                </div>
                {/* Midfielders */}
                <div className="flex justify-center gap-4 md:gap-8">
                  <PlayerCard name="Bellingham" team="ENG" price="10.5m" position="MID" points="6" />
                  <PlayerCard name="Pedri" team="ESP" price="8.5m" position="MID" points="3" />
                  <PlayerCard name="Musiala" team="GER" price="9.5m" position="MID" points="9" />
                  <PlayerCard name="Enzo" team="ARG" price="8.0m" position="MID" points="2" />
                </div>
                {/* Defenders */}
                <div className="flex justify-center gap-4 md:gap-10">
                  <PlayerCard name="Davies" team="CAN" price="7.0m" position="DEF" points="6" />
                  <PlayerCard name="Romero" team="ARG" price="6.5m" position="DEF" points="6" />
                  <PlayerCard name="Saliba" team="FRA" price="6.5m" position="DEF" points="6" />
                  <PlayerCard name="Aké" team="NED" price="6.0m" position="DEF" points="2" />
                </div>
                {/* Goalkeeper */}
                <div className="flex justify-center">
                  <PlayerCard name="E. Martínez" team="ARG" price="6.0m" position="GK" points="6" />
                </div>
              </div>
            </div>

            {/* Bench */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Substititutes</h3>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Bench Boost: Unused</span>
              </div>
              <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto">
                <PlayerCard name="Livakovic" team="CRO" price="5.0m" position="GK" points="0" isBench />
                <PlayerCard name="Gvardiol" team="CRO" price="6.5m" position="DEF" points="0" isBench />
                <PlayerCard name="Valverde" team="URU" price="8.5m" position="MID" points="0" isBench />
                <PlayerCard name="Núñez" team="URU" price="8.5m" position="FWD" points="0" isBench />
              </div>
            </div>
          </TabsContent>

          {/* TRANSFERS */}
          <TabsContent value="transfers" className="m-0 h-full animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
               <div className="lg:col-span-8 space-y-4">
                 
                 <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Free Transfers</span>
                     <span className="text-2xl font-black text-white">1</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Cost</span>
                     <span className="text-2xl font-black text-red-400 font-mono">-0 pts</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Bank</span>
                     <span className="text-2xl font-black text-primary font-mono">€1.5m</span>
                   </div>
                 </div>

                 <div className="bg-card border border-border rounded-xl flex flex-col relative min-h-[400px]">
                    <div className="p-4 border-b border-border/50 flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search players..." className="w-full bg-secondary border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                      <Button variant="outline" size="sm" className="bg-secondary border-border hover:bg-white/5 h-9"><Filter className="w-4 h-4 mr-2"/> Filters</Button>
                    </div>
                    <div className="flex-1 p-2">
                       <table className="w-full text-left text-xs">
                         <thead>
                           <tr className="text-[9px] uppercase font-bold text-slate-500 border-b border-border/50">
                             <th className="p-2 w-10">Pos</th>
                             <th className="p-2">Player</th>
                             <th className="p-2 text-center">Team</th>
                             <th className="p-2 text-right">Price</th>
                             <th className="p-2 text-right">Selected</th>
                             <th className="p-2 text-right">Pts</th>
                             <th className="p-2 w-10"></th>
                           </tr>
                         </thead>
                         <tbody className="font-mono text-[11px] divide-y divide-border/50">
                           {[
                             { name: 'H. Kane', pos: 'FWD', team: 'ENG', price: 11.5, sel: '34.2%', pts: 42 },
                             { name: 'Vini Jr.', pos: 'FWD', team: 'BRA', price: 10.5, sel: '41.1%', pts: 38 },
                             { name: 'K. De Bruyne', pos: 'MID', team: 'BEL', price: 10.0, sel: '22.4%', pts: 35 },
                             { name: 'B. Saka', pos: 'MID', team: 'ENG', price: 9.5, sel: '28.9%', pts: 40 },
                             { name: 'A. Hakimi', pos: 'DEF', team: 'MAR', price: 6.5, sel: '18.2%', pts: 29 },
                           ].map((p, i) => (
                             <tr key={i} className="hover:bg-white/5 transition-colors">
                               <td className="p-2 text-slate-400">{p.pos}</td>
                               <td className="p-2 font-sans font-bold text-white flex items-center gap-2">
                                 <Info className="w-3 h-3 text-primary cursor-pointer" /> {p.name}
                               </td>
                               <td className="p-2 text-center text-slate-300">{p.team}</td>
                               <td className="p-2 text-right text-white">€{p.price.toFixed(1)}m</td>
                               <td className="p-2 text-right text-slate-400">{p.sel}</td>
                               <td className="p-2 text-right font-bold text-emerald-400">{p.pts}</td>
                               <td className="p-2 text-right">
                                 <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-400 hover:text-white hover:bg-emerald-500/20">+</Button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                 </div>
               </div>
               
               <div className="lg:col-span-4 space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-[10px] font-black uppercase text-white tracking-widest mb-4">Transfers Out</h3>
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Click a player to remove</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-[10px] font-black uppercase text-white tracking-widest mb-4">Transfers In</h3>
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Select player from list</div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full font-black uppercase tracking-widest text-xs h-12" disabled>Confirm Transfers</Button>
               </div>
            </div>
          </TabsContent>

          {/* RULES & SCORING */}
          <TabsContent value="rules" className="m-0 h-full animate-in fade-in duration-300 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {/* Architecture / Database Explanation Box */}
               <div className="lg:col-span-3 bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4">
                  <div className="shrink-0 pt-1">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Fantasy Engine Architecture</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">The Fantasy World Cup engine runs on dedicated relational schemas optimized for high locking concurrency during transfer deadlines:</p>
                    <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1 font-mono">
                      <li><span className="text-white">fantasy_teams:</span> Budget, Active Chips (Wildcard, Bench Boost), Total Points.</li>
                      <li><span className="text-white">fantasy_players:</span> Live pricing models, ownership %, cumulative stats.</li>
                      <li><span className="text-white">fantasy_rosters:</span> Junction table strictly enforcing formation rules (e.g., Min 3 DEF, 1 FWD). Tracks Captain flags.</li>
                      <li><span className="text-white">fantasy_transfers:</span> Ledger of all movements, calculating point deductions (-4 pts) if free transfers are exceeded.</li>
                    </ul>
                  </div>
               </div>

               {/* Playing Rules */}
               <div className="bg-card border border-border rounded-xl p-5">
                 <h3 className="text-[11px] font-black uppercase text-white tracking-widest mb-4 border-b border-border/50 pb-2">Squad Rules</h3>
                 <ul className="text-xs text-slate-300 space-y-3">
                   <li className="flex justify-between"><span>Squad Size:</span> <span className="font-bold text-white">15 Players</span></li>
                   <li className="flex justify-between"><span>Starting XI:</span> <span className="font-bold text-white">11 Players</span></li>
                   <li className="flex justify-between"><span>Max per Team:</span> <span className="font-bold text-white">3 Players</span></li>
                   <li className="flex justify-between"><span>Starting Budget:</span> <span className="font-bold text-emerald-400 font-mono">€100.0m</span></li>
                   <li className="flex justify-between"><span>Free Transfers:</span> <span className="font-bold text-white">1 per Round</span></li>
                   <li className="flex justify-between"><span>Extra Transfer Cost:</span> <span className="font-bold text-red-400 font-mono">-4 Points</span></li>
                 </ul>
               </div>

               {/* Points System - Actions */}
               <div className="bg-card border border-border rounded-xl p-5">
                 <h3 className="text-[11px] font-black uppercase text-white tracking-widest mb-4 border-b border-border/50 pb-2">Scoring: Attack</h3>
                 <ul className="text-xs text-slate-300 space-y-3">
                   <li className="flex justify-between"><span>Goal (FWD):</span> <span className="font-bold text-emerald-400 font-mono">+4 pts</span></li>
                   <li className="flex justify-between"><span>Goal (MID):</span> <span className="font-bold text-emerald-400 font-mono">+5 pts</span></li>
                   <li className="flex justify-between"><span>Goal (DEF/GK):</span> <span className="font-bold text-emerald-400 font-mono">+6 pts</span></li>
                   <li className="flex justify-between"><span>Assist (All):</span> <span className="font-bold text-emerald-400 font-mono">+3 pts</span></li>
                   <li className="flex justify-between"><span>Penalty Miss:</span> <span className="font-bold text-red-400 font-mono">-2 pts</span></li>
                 </ul>
               </div>

               {/* Points System - Defense */}
               <div className="bg-card border border-border rounded-xl p-5">
                 <h3 className="text-[11px] font-black uppercase text-white tracking-widest mb-4 border-b border-border/50 pb-2">Scoring: Defense</h3>
                 <ul className="text-xs text-slate-300 space-y-3">
                   <li className="flex justify-between"><span>Clean Sheet (DEF/GK):</span> <span className="font-bold text-emerald-400 font-mono">+4 pts</span></li>
                   <li className="flex justify-between"><span>Clean Sheet (MID):</span> <span className="font-bold text-emerald-400 font-mono">+1 pt</span></li>
                   <li className="flex justify-between"><span>Every 3 Saves (GK):</span> <span className="font-bold text-emerald-400 font-mono">+1 pt</span></li>
                   <li className="flex justify-between"><span>Penalty Save (GK):</span> <span className="font-bold text-emerald-400 font-mono">+5 pts</span></li>
                   <li className="flex justify-between"><span>Every 2 Goals Conceded:</span> <span className="font-bold text-red-400 font-mono">-1 pt</span></li>
                 </ul>
               </div>
             </div>
          </TabsContent>

          {/* LEAGUES */}
          <TabsContent value="leagues" className="m-0 h-full animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center p-10 bg-card border border-border rounded-xl text-center space-y-4 mt-8">
              <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Global & Private Leagues</h2>
              <p className="text-sm text-slate-400 max-w-md">Create custom leagues with specific scoring rules, invite your friends, and compete for the ultimate World Cup Fantasy crown.</p>
              <div className="flex gap-4 mt-4">
                <Button className="font-bold uppercase tracking-wider text-xs">Create League</Button>
                <Button variant="outline" className="font-bold uppercase tracking-wider text-xs bg-transparent border-border hover:bg-white/5">Join via Code</Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Mini components for the Pitch view
function PlayerCard({ name, team, price, position, points, isCaptain, isBench }: any) {
  return (
    <div className={`flex flex-col items-center justify-center group cursor-pointer w-16 md:w-24 ${isBench ? 'opacity-80 scale-90' : ''}`}>
      <div className="relative">
        {/* Simple shirt representation */}
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-t-lg border-2 ${isBench ? 'border-dashed border-white/20 bg-secondary' : 'bg-primary border-primary shadow-lg'} flex items-center justify-center relative overflow-hidden group-hover:-translate-y-1 transition-transform`}>
           <span className="text-[9px] md:text-xs font-black text-black">{position}</span>
        </div>
        {/* Captain badge */}
        {isCaptain && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-black text-black z-10 shadow-sm">
            C
          </div>
        )}
      </div>
      
      <div className="mt-1 flex flex-col items-center w-full">
        {/* Name Bar */}
        <div className="bg-background w-full text-center rounded-t-sm px-1 py-0.5 border-x border-t border-border overflow-hidden whitespace-nowrap text-ellipsis">
          <span className="text-[9px] md:text-[10px] font-bold text-white block">{name}</span>
        </div>
        {/* Info Bar */}
        <div className={`w-full text-center rounded-b-sm px-1 py-0.5 border border-border flex items-center justify-center gap-1 ${isBench ? 'bg-secondary' : 'bg-primary/20'}`}>
          <span className="text-[8px] md:text-[9px] font-mono text-white">{points} pts</span>
        </div>
      </div>
    </div>
  )
}
