import { useState } from 'react';
import { useAuth, usePredictionHistory } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { 
  Trophy, CheckCircle, XCircle, AlertCircle, Calendar, 
  MapPin, BarChart2, Star, Percent, Award, HelpCircle
} from 'lucide-react';

export function PredictionHistoryView() {
  const { user } = useAuth() as any;
  const { t, language } = useLanguage();
  const { predictions, loading, error } = usePredictionHistory(user?.id);
  const [filter, setFilter] = useState<'all' | 'perfect' | 'hit' | 'miss' | 'pending'>('all');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">{t('common.unauthorized')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-slate-400">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3 text-slate-400">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">{t('common.connectionError')}</h3>
        <p className="text-xs max-w-sm text-center opacity-80">{error.message}</p>
      </div>
    );
  }

  // Calculate stats based on predictions
  const total = predictions.length;
  const finishedPredictions = predictions.filter(p => p.match?.status === 'finished');
  const finishedCount = finishedPredictions.length;
  
  const perfectCount = finishedPredictions.filter(p => p.points_earned === 3).length;
  const hitCount = finishedPredictions.filter(p => p.points_earned > 0).length;
  const missCount = finishedPredictions.filter(p => p.points_earned === 0).length;
  const pendingCount = predictions.filter(p => p.match?.status !== 'finished').length;

  const accuracy = finishedCount > 0 ? Math.round((hitCount / finishedCount) * 100) : 0;
  const perfectAccuracy = finishedCount > 0 ? Math.round((perfectCount / finishedCount) * 100) : 0;
  
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const averagePoints = finishedCount > 0 ? (totalPoints / finishedCount).toFixed(2) : '0.00';

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'perfect') return p.match?.status === 'finished' && p.points_earned === 3;
    if (filter === 'hit') return p.match?.status === 'finished' && p.points_earned > 0;
    if (filter === 'miss') return p.match?.status === 'finished' && p.points_earned === 0;
    if (filter === 'pending') return p.match?.status !== 'finished';
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6 animate-in fade-in duration-500">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-primary" />
          {t('history.title')}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Revisa el rendimiento de tus predicciones, puntos obtenidos y nivel de precisión.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-2xl flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos Obtenidos</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{totalPoints}</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Prediction Accuracy */}
        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-2xl flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('history.accuracy')}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{accuracy}%</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Average Points */}
        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-2xl flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('history.averagePoints')}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{averagePoints}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Prediction Stats Summary */}
        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-2xl flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen General</span>
          <div className="flex flex-col gap-0.5 text-[11px] font-bold text-slate-400 mt-2">
            <div className="flex justify-between">
              <span>Aciertos Exactos (+3):</span>
              <span className="text-white">{perfectCount} ({perfectAccuracy}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Aciertos Simples (+1):</span>
              <span className="text-white">{hitCount - perfectCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Fallados (+0):</span>
              <span className="text-white">{missCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="space-y-4">
        {/* Horizontal Filters Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filter === 'all' 
                ? 'bg-white text-slate-950 border-white' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {t('history.filterAll')}
            <span className="text-[10px] font-black opacity-80">({total})</span>
          </button>

          <button
            onClick={() => setFilter('perfect')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filter === 'perfect' 
                ? 'bg-amber-400 text-slate-950 border-amber-400' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {t('history.filterPerfect')}
            <span className="text-[10px] font-black opacity-80">({perfectCount})</span>
          </button>

          <button
            onClick={() => setFilter('hit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filter === 'hit' 
                ? 'bg-emerald-500 text-white border-emerald-500' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {t('history.filterHits')}
            <span className="text-[10px] font-black opacity-80">({hitCount})</span>
          </button>

          <button
            onClick={() => setFilter('miss')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filter === 'miss' 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            {t('history.filterMisses')}
            <span className="text-[10px] font-black opacity-80">({missCount})</span>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filter === 'pending' 
                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t('history.filterPending')}
            <span className="text-[10px] font-black opacity-80">({pendingCount})</span>
          </button>
        </div>

        {/* Prediction List */}
        {filteredPredictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <HelpCircle className="w-10 h-10 mb-3 opacity-20 text-slate-400" />
            <p className="text-sm">{t('history.noPredictions')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((pred: any) => {
              const match = pred.match;
              if (!match) return null;
              
              const home = match.home_team;
              const away = match.away_team;
              const isFinished = match.status === 'finished';
              
              // Status Styling
              let statusBadgeClass = 'bg-slate-800 text-slate-400 border border-slate-700';
              let statusText = t('history.pendingBadge');
              let pointsLabel = '-';
              
              if (isFinished) {
                if (pred.points_earned === 3) {
                  statusBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                  statusText = t('history.perfectBadge');
                  pointsLabel = '+3';
                } else if (pred.points_earned > 0) {
                  statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  statusText = t('history.hitBadge');
                  pointsLabel = `+${pred.points_earned}`;
                } else {
                  statusBadgeClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
                  statusText = t('history.missBadge');
                  pointsLabel = '+0';
                }
              }

              const matchDate = new Date(match.date);

              return (
                <div 
                  key={pred.id} 
                  className="flex flex-col md:flex-row items-stretch md:items-center justify-between border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 p-4 rounded-2xl gap-4 transition-all duration-300"
                >
                  {/* Stage and Metadata */}
                  <div className="flex flex-col justify-center gap-1 min-w-[150px]">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {match.stage}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 opacity-80" />
                      <span>
                        {format(matchDate, 'dd MMM, HH:mm', { locale: language === 'es' ? esLocale : undefined })}
                      </span>
                    </div>
                    {match.stadium && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <MapPin className="w-3 h-3 opacity-60" />
                        <span>{match.stadium.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Teams and Scores row */}
                  <div className="flex-1 flex items-center justify-center md:justify-start gap-3 md:px-6">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end gap-2.5 max-w-[180px]">
                      <span className="text-xs font-bold text-white text-right truncate hidden sm:inline">{home?.name}</span>
                      <span className="text-xs font-black text-slate-400 sm:hidden">{home?.code}</span>
                      <img 
                        src={`https://flagcdn.com/w40/${home?.flag_code.toLowerCase()}.png`} 
                        alt={home?.name} 
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Scores Comparison */}
                    <div className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl bg-slate-950/50 border border-slate-900 min-w-[100px]">
                      {/* Real Score */}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resultado</span>
                      <span className="text-sm font-black text-white">
                        {isFinished ? `${match.home_score} - ${match.away_score}` : 'vs'}
                      </span>
                      
                      {/* Prediction */}
                      <div className="border-t border-slate-900/80 w-full my-0.5" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tu Pronóstico</span>
                      <span className="text-xs font-extrabold text-primary">
                        {pred.home_score} - {pred.away_score}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center justify-start gap-2.5 max-w-[180px]">
                      <img 
                        src={`https://flagcdn.com/w40/${away?.flag_code.toLowerCase()}.png`} 
                        alt={away?.name} 
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xs font-bold text-white text-left truncate hidden sm:inline">{away?.name}</span>
                      <span className="text-xs font-black text-slate-400 sm:hidden">{away?.code}</span>
                    </div>
                  </div>

                  {/* Points and Status Badge */}
                  <div className="flex items-center justify-between md:justify-end gap-3 min-w-[140px] border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                    <span className="text-xs font-medium text-slate-400 md:hidden">{t('history.pointsEarned')}:</span>
                    <div className="flex items-center gap-2">
                      {/* Points badge */}
                      <span className={`w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center ${
                        isFinished 
                          ? pred.points_earned > 0 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-800 text-slate-400' 
                          : 'bg-slate-900 text-slate-500'
                      }`}>
                        {pointsLabel}
                      </span>

                      {/* Status badge */}
                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
