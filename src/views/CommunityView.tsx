import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Trophy, Users, Star, ArrowUpRight, Flame, BrainCircuit, Crosshair, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useAuth, useLeagues, useRankings } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';

export function CommunityView() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('feed');
  const { user, signInWithGoogle } = useAuth();
  const { leagues, createLeague, joinLeague, loading: leaguesLoading } = useLeagues(user?.id);
  const { rankings, loading: rankingsLoading } = useRankings();

  // Dialog / Input states
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      await joinLeague(inviteCode);
      setInviteCode('');
      setShowJoin(false);
    } catch (err: any) {
      alert(err.message || 'Error joining league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    setIsSubmitting(true);
    try {
      await createLeague(newLeagueName);
      setNewLeagueName('');
      setShowCreate(false);
    } catch (err: any) {
      alert(err.message || 'Error creating league');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          {/* Private Leagues */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" /> Private Leagues
              </h3>
              {user && (
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }} 
                    className="h-6 text-[9px] uppercase font-bold border-border bg-secondary hover:bg-white/10 px-2"
                  >
                    Join
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }} 
                    className="h-6 text-[9px] uppercase font-bold bg-primary hover:bg-primary/95 px-2"
                  >
                    Create
                  </Button>
                </div>
              )}
            </div>

            {/* Create League Inline Input */}
            {showCreate && (
              <form onSubmit={handleCreateLeague} className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-bold text-slate-400 uppercase">League Name</div>
                <Input 
                  type="text" 
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="e.g. Dream Team League"
                  className="h-8 text-xs bg-background border-border/50"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-6 text-[9px] uppercase font-bold">Cancel</Button>
                  <Button type="submit" size="sm" className="h-6 text-[9px] uppercase font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
            )}

            {/* Join League Inline Input */}
            {showJoin && (
              <form onSubmit={handleJoinLeague} className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Invite Code</div>
                <Input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. AB12CD"
                  className="h-8 text-xs bg-background border-border/50 uppercase"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowJoin(false)} className="h-6 text-[9px] uppercase font-bold">Cancel</Button>
                  <Button type="submit" size="sm" className="h-6 text-[9px] uppercase font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join'}
                  </Button>
                </div>
              </form>
            )}

            {!user ? (
              <div className="text-center p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Login required</p>
                <Button size="sm" onClick={signInWithGoogle} className="text-[9px] uppercase font-bold w-full h-8">Login</Button>
              </div>
            ) : leaguesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : leagues.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">No Leagues Joined</div>
            ) : (
              <div className="space-y-3">
                {leagues.map((league) => (
                  <div key={league.id} className="p-3 bg-secondary/50 rounded-lg border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{league.name}</span>
                      <span className="text-[9px] font-bold text-slate-500">{league.members?.length || 0} members</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono">Code: <span className="font-bold text-white">{league.invite_code}</span></span>
                      <span className="text-primary font-bold">Owner: {league.owner?.display_name || 'Admin'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Following - Static placeholders but clean */}
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
              ].map((u) => (
                <div key={u.handle} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="text-[10px] bg-secondary text-white font-bold">{u.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">{u.name}</div>
                      <div className="text-[9px] text-slate-500">{u.handle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-primary">{u.score.toLocaleString()}</div>
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
              {user && (
                <div className="flex gap-3 pb-4 border-b border-border/50">
                  <Avatar className="w-10 h-10 border border-border">
                    {user.photo_url && <AvatarImage src={user.photo_url} />}
                    <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <input type="text" placeholder="Share a prediction, simulation, or thought..." className="w-full bg-secondary/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><BrainCircuit className="w-3 h-3 mr-1.5"/> Share Sim</Button>
                      <Button variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><Crosshair className="w-3 h-3 mr-1.5"/> Share Prediction</Button>
                    </div>
                  </div>
                </div>
              )}

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
            </div>
          </Tabs>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pl-2 no-scrollbar">
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Global Leaderboard
            </h3>
            
            {rankingsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">Rankings Empty</div>
            ) : (
              <div className="space-y-4">
                {rankings.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        #{idx + 1}
                      </span>
                      <Avatar className="w-8 h-8 border border-border">
                        {p.photo_url && <AvatarImage src={p.photo_url} />}
                        <AvatarFallback className="text-[10px] bg-secondary text-white font-bold">
                          {p.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80px] md:max-w-[100px] truncate">
                        <span className="text-xs font-bold text-white hover:text-primary transition-colors block truncate">{p.display_name}</span>
                        <span className="text-[8px] text-slate-500 block truncate">{p.email}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">{p.score} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
