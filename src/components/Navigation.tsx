import { NavLink } from 'react-router-dom';
import { Home, Calendar, Trophy, BarChart3, Users, MapPin, BrainCircuit, Shield, Network, Layers, Tv, Bot, Globe, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../context/LanguageContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pass t function to nav items
const getNavItems = (t: (es: string, en: string) => string) => [
  { to: '/', icon: Home, label: t('Inicio', 'Home') },
  { to: '/matches', icon: Calendar, label: t('Partidos', 'Matches') },
  { to: '/groups', icon: BarChart3, label: t('Grupos', 'Groups') },
  { to: '/predictor', icon: Trophy, label: t('Pronósticos', 'Predictor') },
  { to: '/fantasy', icon: Shield, label: t('Fantasy', 'Fantasy') },
  { to: '/simulator', icon: BrainCircuit, label: t('Simulador IA', 'AI Simulator') },
  { to: '/universe', icon: Network, label: t('Universo', 'Universe') },
  { to: '/twin', icon: Layers, label: t('Gemelo Digital', 'Digital Twin') },
  { to: '/assistant', icon: Bot, label: t('Asistente', 'Assistant') },
  { to: '/community', icon: Users, label: t('Comunidad', 'Community') },
  { to: '/tv', icon: Tv, label: t('Modo TV', 'TV Mode') },
  { to: '/admin', icon: Activity, label: t('Data Ops', 'Data Ops') },
  { to: '/ops', icon: Server, label: t('Ops Center', 'Ops Center') },
];



export function Navigation() {
  const { lang, setLang, t } = useLanguage();
  const navItems = getNavItems(t);

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
        <div className="p-4 border-t border-border shrink-0">
          <button 
             onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
             className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold text-slate-400 hover:text-white hover:bg-accent/20 transition-colors"
          >
            <span className="flex items-center gap-3"><Globe className="w-4 h-4" /> {t('Idioma', 'Language')}</span>
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
      
      {/* Mobile Header Language Switcher (optional, placed floating if needed) */}
      <div className="md:hidden fixed top-2 right-2 z-50">
          <button 
             onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
             className="w-8 h-8 rounded-full bg-secondary/80 backdrop-blur border border-border flex items-center justify-center text-xs font-bold text-white shadow"
          >
            {lang.toUpperCase()}
          </button>
      </div>
    </>
  );
}
