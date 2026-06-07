import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Trophy, Users, Star, ArrowUpRight, Flame, BrainCircuit, Crosshair, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useAuth, useLeagues, useRankings } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { AuthCard } from '../components/AuthCard';

type SocialComment = {
  id: string;
  userName: string;
  avatar: string;
  content: string;
  timeText: string;
};

type SocialPost = {
  id: string;
  userName: string;
  userHandle: string;
  avatar: string;
  content: string;
  isPro?: boolean;
  timeText: string;
  likes: number;
  hasLiked?: boolean;
  comments: SocialComment[];
  simulation?: {
    homeCode: string;
    homeFlag: string;
    awayCode: string;
    awayFlag: string;
    detail: string;
    prob: string;
  };
};

const DEFAULT_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    userName: 'Marcus_Sim',
    userHandle: '@marcus99',
    avatar: 'M',
    isPro: true,
    timeText: 'Hace 2 horas',
    content: 'Acabo de correr una simulación Monte Carlo de 100k iteraciones en el Grupo F. El modelo tiene alta confianza en una sorpresa.',
    likes: 24,
    hasLiked: false,
    comments: [
      { id: 'c-1', userName: 'Sarah_Goal', avatar: 'S', content: 'Marruecos tiene una plantilla muy fuerte este año, ¡no es una sorpresa!', timeText: 'Hace 1 hora' }
    ],
    simulation: {
      homeCode: 'MAR',
      homeFlag: 'ma',
      awayCode: 'BEL',
      awayFlag: 'be',
      detail: 'Marruecos clasifica Grupo F',
      prob: '68.4% Prob'
    }
  },
  {
    id: 'post-2',
    userName: 'Diego Tracker',
    userHandle: '@diegotr',
    avatar: 'D',
    timeText: 'Hace 5 horas',
    content: 'Argentina se ve extremadamente sólida. El modelo de predicción califica su fuerza de ataque en 94.',
    likes: 42,
    hasLiked: true,
    comments: []
  }
];

export function CommunityView() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('feed');
  const { user, signInWithGoogle } = useAuth();
  const { leagues, createLeague, joinLeague, loading: leaguesLoading } = useLeagues(user?.id);
  const { rankings, loading: rankingsLoading } = useRankings();

  // Social feed states
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postText, setPostText] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Dialog / Input states
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load posts on mount
  useEffect(() => {
    const saved = localStorage.getItem('wc_community_posts');
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(DEFAULT_POSTS);
      }
    } else {
      setPosts(DEFAULT_POSTS);
      localStorage.setItem('wc_community_posts', JSON.stringify(DEFAULT_POSTS));
    }
  }, []);

  const savePostsToStorage = (newPosts: SocialPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('wc_community_posts', JSON.stringify(newPosts));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      userName: user?.display_name || 'Usuario Anónimo',
      userHandle: `@${(user?.display_name || 'user').toLowerCase().replace(/\s+/g, '')}`,
      avatar: user?.photo_url || (user?.display_name?.charAt(0) || 'U'),
      timeText: 'Hace un momento',
      content: postText,
      likes: 0,
      hasLiked: false,
      comments: []
    };

    savePostsToStorage([newPost, ...posts]);
    setPostText('');
  };

  const handleLikePost = (postId: string) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const hasLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked,
          likes: hasLiked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    });
    savePostsToStorage(updated);
  };

  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: SocialComment = {
      id: `c-${Date.now()}`,
      userName: user?.display_name || 'Usuario Anónimo',
      avatar: user?.photo_url || (user?.display_name?.charAt(0) || 'U'),
      content: commentText,
      timeText: 'Hace un momento'
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    });

    savePostsToStorage(updated);
    setCommentText('');
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      await joinLeague(inviteCode);
      setInviteCode('');
      setShowJoin(false);
    } catch (err: any) {
      alert(err.message || 'Error al unirse a la liga');
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
      alert(err.message || 'Error al crear liga');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 flex flex-col h-[calc(100vh-8rem)]">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          {t('community.title')}
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('community.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column - Leagues & Friends */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar">
          
          {/* Private Leagues */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" /> {t('predictor.signInTitle')}
              </h3>
              {user && (
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }} 
                    className="h-6 text-[9px] uppercase font-bold border-border bg-secondary hover:bg-white/10 px-2"
                  >
                    Unirse
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }} 
                    className="h-6 text-[9px] uppercase font-bold bg-primary hover:bg-primary/95 px-2"
                  >
                    Crear
                  </Button>
                </div>
              )}
            </div>

            {/* Create League Inline Input */}
            {showCreate && (
              <form onSubmit={handleCreateLeague} className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Nombre de la Liga</div>
                <Input 
                  type="text" 
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="Ej. Liga Dream Team"
                  className="h-8 text-xs bg-background border-border/50"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-6 text-[9px] uppercase font-bold">{t('common.cancel')}</Button>
                  <Button type="submit" size="sm" className="h-6 text-[9px] uppercase font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : t('ops.run')}
                  </Button>
                </div>
              </form>
            )}

            {/* Join League Inline Input */}
            {showJoin && (
              <form onSubmit={handleJoinLeague} className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Código de Invitación</div>
                <Input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej. AB12CD"
                  className="h-8 text-xs bg-background border-border/50 uppercase"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowJoin(false)} className="h-6 text-[9px] uppercase font-bold">{t('common.cancel')}</Button>
                  <Button type="submit" size="sm" className="h-6 text-[9px] uppercase font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Entrar'}
                  </Button>
                </div>
              </form>
            )}

            {!user ? (
              <div className="p-1">
                <AuthCard 
                  title="Tus Ligas Privadas"
                  subtitle="Inicia sesión con Google para crear tus propias ligas de amigos y competir."
                  compact={true}
                />
              </div>
            ) : leaguesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : leagues.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">Sin Ligas Unidas</div>
            ) : (
              <div className="space-y-3">
                {leagues.map((league) => (
                  <div key={league.id} className="p-3 bg-secondary/50 rounded-lg border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{league.name}</span>
                      <span className="text-[9px] font-bold text-slate-500">{league.members?.length || 0} miembros</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono">Código: <span className="font-bold text-white">{league.invite_code}</span></span>
                      <span className="text-primary font-bold">Líder: {league.owner?.display_name || 'Admin'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Following */}
          <div className="bg-card rounded-xl border border-border p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3 text-blue-400" /> Siguiendo (24)
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
            <Button variant="ghost" className="w-full mt-4 h-8 text-[9px] uppercase font-bold text-slate-400 hover:text-white">Buscar Amigos</Button>
          </div>
        </div>

        {/* Center Column - Social Feed */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 bg-card rounded-xl border border-border">
            <div className="p-3 border-b border-border/50 bg-secondary/30 shrink-0">
              <TabsList className="bg-transparent h-8 p-0 space-x-2">
                <TabsTrigger value="feed" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30">Muro Global</TabsTrigger>
                <TabsTrigger value="friends" className="text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4 border border-transparent data-[state=active]:border-primary/30">Amigos y Ligas</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              
              {/* Write Post */}
              {!user ? (
                <div className="pb-4 border-b border-border/50">
                  <AuthCard 
                    title="¿Quieres compartir tu opinión?"
                    subtitle="Inicia sesión con Google para publicar tus propios análisis, predicciones y simulaciones en el muro global."
                    compact={true}
                  />
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="flex gap-3 pb-4 border-b border-border/50">
                  <Avatar className="w-10 h-10 border border-border">
                    {user.photo_url && <AvatarImage src={user.photo_url} />}
                    <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder={t('community.postPlaceholder')} 
                      className="w-full bg-secondary/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors" 
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-primary hover:bg-primary/90">{t('community.postButton')}</Button>
                      <Button type="button" variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><BrainCircuit className="w-3 h-3 mr-1.5"/> Compartir Sim</Button>
                      <Button type="button" variant="outline" size="sm" className="h-6 px-3 text-[9px] uppercase tracking-wider font-bold bg-secondary border-border hover:bg-white/5"><Crosshair className="w-3 h-3 mr-1.5"/> Compartir Pronóstico</Button>
                    </div>
                  </div>
                </form>
              )}

              {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 border border-border">
                        {post.avatar.startsWith('http') ? <AvatarImage src={post.avatar} /> : null}
                        <AvatarFallback className="bg-blue-900 text-blue-200 text-xs font-bold">{post.avatar.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          {post.userName} 
                          {post.isPro && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold ml-1">PRO</span>}
                        </div>
                        <div className="text-[9px] text-slate-500">{post.timeText}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Share2 className="w-3 h-3 text-slate-400"/></Button>
                  </div>
                  
                  <p className="text-xs text-slate-300">{post.content}</p>
                  
                  {post.simulation && (
                    <div className="p-3 rounded-lg border border-white/5 bg-black/40">
                      <div className="flex items-center gap-2 mb-2">
                         <BrainCircuit className="w-4 h-4 text-emerald-400" />
                         <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Simulación Compartida</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                         <div className="flex items-center gap-2">
                           <img src={`https://flagcdn.com/w20/${post.simulation.homeFlag}.png`} className="w-4 h-3 rounded-[2px]" alt=""/>
                           <span className="font-bold text-white">{post.simulation.detail}</span>
                         </div>
                         <span className="font-mono text-emerald-400 font-bold">{post.simulation.prob}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2 text-slate-400">
                    <button 
                      onClick={() => handleLikePost(post.id)} 
                      className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${post.hasLiked ? 'text-primary' : 'hover:text-primary'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-primary text-primary' : ''}`} /> {post.likes}
                    </button>
                    <button 
                      onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)} 
                      className="flex items-center gap-1.5 text-[10px] font-bold hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> {post.comments.length}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentsPostId === post.id && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2 text-xs bg-secondary/10 p-2 rounded border border-white/5">
                            <Avatar className="w-6 h-6 border border-border shrink-0">
                              {comment.avatar.startsWith('http') ? <AvatarImage src={comment.avatar} /> : null}
                              <AvatarFallback className="text-[8px] bg-slate-800 text-white font-bold">{comment.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-white text-[10px]">{comment.userName}</span>
                                <span className="text-[8px] text-slate-500 font-mono">{comment.timeText}</span>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {user ? (
                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                          <Input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Escribe una respuesta..." 
                            className="h-8 text-xs bg-secondary/50 border-border/50 flex-1"
                          />
                          <Button type="submit" size="sm" className="h-8 text-[9px] uppercase font-bold">Responder</Button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2 bg-secondary/15 border border-border/40 p-2 rounded-xl text-[10px]">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Inicia sesión para comentar</span>
                          <button
                            onClick={signInWithGoogle}
                            className="px-2.5 py-1 bg-primary text-slate-950 font-black rounded-lg text-[9px] uppercase hover:bg-primary-hover transition-colors cursor-pointer"
                          >
                            Conectar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </Tabs>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pl-2 no-scrollbar">
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" /> {t('community.leagueStandings')}
            </h3>
            
            {rankingsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase">Sin Posiciones</div>
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
