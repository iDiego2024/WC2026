import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useData';
import { useLanguage } from '../../context/LanguageContext';
import { AuthCard } from '../AuthCard';
import { ShieldAlert, Home, Loader2, KeyRound } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, loading, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-[70vh] gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AuthCard 
            title="Área de Operaciones Protegida"
            subtitle="Esta sección requiere permisos de administrador. Inicia sesión con tu cuenta autorizada para continuar."
          />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="relative overflow-hidden rounded-3xl border border-red-500/10 bg-slate-950 p-6 md:p-8 space-y-6 max-w-md w-full text-center shadow-2xl">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-red-500/5 blur-3xl" />
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight">
                Acceso Denegado
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Tu cuenta no tiene privilegios de administrador para ver las herramientas operacionales de WC2026.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
