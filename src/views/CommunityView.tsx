import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Award, Trophy, Users, Star, ArrowUpRight, Flame, Medal, BrainCircuit, Crosshair } from 'lucide-react';

export function CommunityView() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 flex flex-col h-[calc(100vh-8rem)]">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          Community Hub
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Leagues, Friends & Social Feed</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column - Leagues & Friends */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" /> My Leagues
              </h3>
              <Button variant="outline" size="sm" className="h-6 text-[9px] uppercase font-bold border-border bg-secondary hover:bg-white/10">Join</Button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-secondary/50 rounded-lg border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">Office Experts 2026</span>
                  <span className="text-[9px] font-bold text-slate-500">12 members</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400">Your Rank:</span>
                   <span className="text-[11px] font-black text-emerald-400">#2</span>
                </div>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">Family Bracket</span>
                  <span className="text-[9px] font-bold text-slate-500">8 members</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400">Your Rank:</span>
                   <span className="text-[11px] font-black text-primary">#1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3 text-blue-400" /> Following (24)
              </h3>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Marcus_Sim', handle: '@marcus99', avatar: 'M', score: 12450 },
                { name: 'Sarah_Goal', handle: '@sgoal_x', avatar: 'S', score: 11200 },
                { name: 'Diego Tracker', handle: '@diegotr', avatar: 'D', score: 10850 },
                { name: 'Alex H.', handle: '@alexh20', avatar: 'A', score: 9900 },
              ].map((user) => (
                <div key={user.handle} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="text-[10px] bg-secondary text-white font-bold">{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">{user.name}</div>
                      <div className="text-[9px] text-slate-500">{user.handle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-primary">{user.score.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500">pts</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 h-8 text-[9px] uppercase font-bold text-slate-400 hover:text-white">Find Friends</Button>
          </div>
        </div>

        {/* Center Column - Social Feed */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 bg-card rounded-xl border border-border">
            <div className="p-3 border-b border-border/50 bg-secondary/30 shrink-0">
              <TabsList className="bg-transparent h-8 p-0 space-x-2">
                <TabsTrigger value="feed" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30">Global Feed</TabsTrigger>
                <TabsTrigger value="friends" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30">Friends & Leagues</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              
              {/* Write Post */}
              <div className="flex gap-3 pb-4 border-b border-border/50">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <input type="text" placeholder="Share a prediction, simulation, or thought..." className="w-full bg-secondary/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><BrainCircuit className="w-3 h-3 mr-1.5"/> Share Sim</Button>
                    <Button variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><Crosshair className="w-3 h-3 mr-1.5"/> Share Prediction</Button>
                  </div>
                </div>
              </div>

              {/* Post 1: Simulation Share */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="bg-blue-900 text-blue-200 text-xs font-bold">M</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">Marcus_Sim <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold ml-1">PRO</span></div>
                      <div className="text-[9px] text-slate-500">2 hrs ago</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Share2 className="w-3 h-3 text-slate-400"/></Button>
                </div>
                <p className="text-xs text-slate-300">Just ran a 100k iteration Monte Carlo on Group F. The model is highly confident in an upset.</p>
                <div className="p-3 rounded-lg border border-white/5 bg-black/40">
                  <div className="flex items-center gap-2 mb-2">
                     <BrainCircuit className="w-4 h-4 text-emerald-400" />
                     <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Shared Simulation</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ma.png" className="w-4 h-3 rounded-[2px]" alt="MAR"/><span className="font-bold text-white">Morocco to win Group F</span></div>
                     <span className="font-mono text-emerald-400 font-bold">68.4% Prob</span>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 text-slate-400">
                  <button className="flex items-center gap-1.5 text-[10px] font-bold hover:text-primary transition-colors"><Heart className="w-3.5 h-3.5" /> 24</button>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold hover:text-primary transition-colors"><MessageCircle className="w-3.5 h-3.5" /> 5</button>
                </div>
              </div>

              {/* Post 2: Prediction Share */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="bg-orange-900 text-orange-200 text-xs font-bold">S</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-white">Sarah_Goal</div>
                      <div className="text-[9px] text-slate-500">4 hrs ago</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300">Locking in my prediction for tonight's opener! 🔒</p>
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                       <img src="https://flagcdn.com/w40/ca.png" className="w-8 h-5.5 rounded-[2px]" alt="CAN"/>
                       <span className="text-[10px] font-bold text-white">CAN</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-lg font-black text-white">1</div>
                      <span className="text-xs font-mono text-slate-500">-</span>
                      <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-lg font-black text-white">3</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <img src="https://flagcdn.com/w40/ar.png" className="w-8 h-5.5 rounded-[2px]" alt="ARG"/>
                       <span className="text-[10px] font-bold text-white">ARG</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 text-slate-400">
                  <button className="flex items-center gap-1.5 text-[10px] font-bold hover:text-primary transition-colors"><Heart className="w-3.5 h-3.5" /> 12</button>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold hover:text-primary transition-colors"><MessageCircle className="w-3.5 h-3.5" /> 1</button>
                </div>
              </div>

            </div>
          </Tabs>
        </div>

        {/* Right Column - Comparisons & Achievements */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar">
          
          {/* Head to Head */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4">
              <ArrowUpRight className="w-3 h-3 text-orange-400" /> Compare vs Friends
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                <span>You</span>
                <span>Accuracy</span>
                <span>Friend</span>
              </div>
              
              <div className="flex items-center justify-between">
                <Avatar className="w-8 h-8 border border-border ring-2 ring-primary relative">
                  <AvatarImage src="https://github.com/shadcn.png" />
                </Avatar>
                
                <div className="flex-1 px-3 relative h-6 flex items-center justify-center">
                  <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{width: '65%'}}></div>
                    <div className="h-full bg-blue-500" style={{width: '35%'}}></div>
                  </div>
                  <div className="bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white z-10">65% - 52%</div>
                </div>

                <Avatar className="w-8 h-8 border border-border ring-2 ring-blue-500 relative">
                  <AvatarFallback className="bg-blue-900 text-blue-200">M</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex items-center justify-between">
                <Avatar className="w-8 h-8 border border-border ring-2 ring-primary relative">
                  <AvatarImage src="https://github.com/shadcn.png" />
                </Avatar>
                
                <div className="flex-1 px-3 relative h-6 flex items-center justify-center">
                  <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{width: '65%'}}></div>
                    <div className="h-full bg-orange-500" style={{width: '85%'}}></div>
                  </div>
                  <div className="bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white z-10">65% - 78%</div>
                </div>

                <Avatar className="w-8 h-8 border border-border ring-2 ring-orange-500 relative">
                  <AvatarFallback className="bg-orange-900 text-orange-200">S</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 h-8 text-[9px] uppercase font-bold border-border hover:bg-white/5 text-slate-400">View All Rivalries</Button>
          </div>

          {/* Social Achievements */}
          <div className="bg-card rounded-xl border border-border flex flex-col flex-1">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Medal className="w-3 h-3 text-yellow-400" /> Trophies & Badges
              </h3>
            </div>
            <div className="p-4 space-y-4">
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Perfect Score Streak</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">Predict 3 exact match scores in a row.</p>
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 w-2/3"></div>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 text-right mt-1">2/3</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Master Analyst</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">Run 1,000,000 Monte Carlo simulations.</p>
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 w-full"></div>
                  </div>
                  <div className="text-[8px] font-mono text-emerald-400 font-bold text-right mt-1">UNLOCKED</div>
                </div>
              </div>

              <div className="flex gap-3 opacity-50 grayscale">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Underdog Prophet</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">Correctly predict an upset (&lt;15% probability win).</p>
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 w-0"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
