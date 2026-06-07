import { NavLink } from 'react-router-dom';
import { Home, Calendar, Trophy, BarChart3, Users, MapPin, BrainCircuit, Shield, Network, Layers, Tv, Bot, Globe, Activity, Server, User, History, LogOut, LogIn } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useData';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pass t function to nav items
const getNavItems = (t: (key: string) => string) => [
  { to: '/', icon: Home, label: t('nav.home') },
  { to: '/matches', icon: Calendar, label: t('nav.matches') },
  { to: '/groups', icon: BarChart3, label: t('nav.groups') },
  { to: '/predictor', icon: Trophy, label: t('nav.predictor') },
  { to: '/history', icon: History, label: t('nav.history') },
  { to: '/profile', icon: User, label: t('nav.profile') },
  { to: '/fantasy', icon: Shield, label: t('nav.fantasy') },
  { to: '/simulator', icon: BrainCircuit, label: t('nav.simulator') },
  { to: '/universe', icon: Network, label: t('nav.universe') },
  { to: '/twin', icon: Layers, label: t('nav.twin') },
  { to: '/assistant', icon: Bot, label: t('nav.assistant') },
  { to: '/community', icon: Users, label: t('nav.community') },
  { to: '/tv', icon: Tv, label: t('nav.tv') },
  { to: '/admin', icon: Activity, label: t('nav.dataOps'), adminOnly: true },
  { to: '/ops', icon: Server, label: t('nav.opsCenter'), adminOnly: true },
];

export function Navigation() {
  const { lang, setLang, t } = useLanguage();
  const { user, signInWithGoogle, signOut, isAdmin } = useAuth() as any;
  const navItems = getNavItems(t).filter(item => !(item as any).adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-secondary border-r border-border h-screen fixed top-0 left-0">
        <div className="p-4 border-b border-border bg-secondary flex flex-col justify-center">
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 p-1.5 bg-gradient-to-br from-primary to-blue-600 rounded-lg shadow-sm text-white" />
            WC2026
          </h1>
          <p className="text-[10px] text-primary mt-2 uppercase tracking-widest font-bold">Ultimate Tracker</p>
        </div>
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto no-scrollbar pb-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors border",
                isActive ? "bg-accent/50 text-white border-border" : "text-slate-400 border-transparent hover:text-white hover:bg-accent/20"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Auth Status Block */}
        {user ? (
          <div className="p-3 border-t border-border shrink-0 bg-slate-950/20">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-primary/20 bg-slate-900 flex-shrink-0 flex items-center justify-center">
                <img
                  src={user.photo_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-white truncate">{user.display_name || 'Player'}</div>
                <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {t('auth.connectedStatus')}
                </div>
              </div>
              <button
                onClick={signOut}
                title={t('auth.logout')}
                className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950/30 hover:bg-red-500/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-900 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-400">
              <span>Puntos:</span>
              <span className="text-primary font-black">🏆 {user.score}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-border shrink-0 bg-slate-950/20 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex-shrink-0 flex items-center justify-center text-slate-500 border border-slate-800">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-slate-400">{t('auth.guestStatus')}</div>
                <div className="text-[9px] text-slate-500 font-medium truncate">{t('auth.guestWarning')}</div>
              </div>
            </div>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-primary hover:bg-primary-hover text-slate-950 text-[10px] font-black transition-colors shadow-md cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              {t('auth.signInCTA')}
            </button>
          </div>
        )}

        <div className="p-3 border-t border-border shrink-0">
          <button 
             onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
             className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white hover:bg-accent/20 transition-colors"
          >
            <span className="flex items-center gap-3"><Globe className="w-4 h-4" /> {t('nav.language')}</span>
            <span className="text-[10px] uppercase bg-black/30 px-2 py-0.5 rounded border border-border">{lang}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-border pb-safe z-50 flex overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center p-2 rounded-md text-[10px] font-bold transition-colors min-w-[70px]",
              isActive ? "text-primary bg-accent/50" : "text-slate-400 hover:bg-accent/20 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="truncate w-full text-center">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* Mobile Header Language/Auth Switcher */}
      <div className="md:hidden fixed top-2 right-2 z-50 flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5 bg-secondary/85 backdrop-blur border border-border p-1 pl-2.5 rounded-full shadow">
              <span className="text-[9px] font-black text-white">{user.score} pts</span>
              <button 
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="w-6 h-6 rounded-full bg-slate-950/65 flex items-center justify-center text-[9px] font-bold text-white uppercase border border-white/5"
              >
                {lang}
              </button>
              <button
                onClick={signOut}
                className="w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 flex items-center justify-center cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-secondary/85 backdrop-blur border border-border p-1 rounded-full shadow">
              <button 
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="w-6 h-6 rounded-full bg-slate-950/65 flex items-center justify-center text-[9px] font-bold text-white uppercase border border-white/5"
              >
                {lang}
              </button>
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-primary text-slate-950 text-[9px] font-black cursor-pointer hover:bg-primary-hover shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                {t('auth.guestStatus')}
              </button>
            </div>
          )}
      </div>
    </>
  );
}
