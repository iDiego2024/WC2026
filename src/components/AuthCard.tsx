import React from 'react';
import { useAuth } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, Shield, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function AuthCard({ title, subtitle, compact = false }: AuthCardProps) {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const benefits = [
    t('auth.benefit1') || 'Guarda tus pronósticos en la nube y evita perder tus puntos.',
    t('auth.benefit2') || 'Compite en tiempo real en la clasificación global y privada.',
    t('auth.benefit3') || 'Desbloquea 11 logros únicos y gana medallas especiales.'
  ];

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-3">
        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              {title || t('auth.titleCompact') || '¡Únete a la Competencia!'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              {subtitle || t('auth.subtitleCompact') || 'Inicia sesión para interactuar y guardar tus datos.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 text-xs font-black transition-colors shadow-lg cursor-pointer"
        >
          {/* Custom Google Icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('auth.continueWithGoogle') || 'Continuar con Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8 space-y-6 max-w-lg mx-auto text-center shadow-2xl">
      {/* Background glow animations */}
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Visual Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {title || t('auth.title') || 'Únete a la Copa del Mundo 2026'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {subtitle || t('auth.subtitle') || 'Crea tu perfil ahora para acceder a estadísticas avanzadas e interactuar con otros aficionados.'}
          </p>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-left space-y-3">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-sm transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-xl cursor-pointer"
        >
          {/* Custom Google Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('auth.continueWithGoogle') || 'Continuar con Google'}
        </button>
        <p className="text-[10px] text-slate-500 leading-normal">
          Al conectarte, aceptas guardar tus predicciones en la plataforma descentralizada WC2026.
        </p>
      </div>
    </div>
  );
}
