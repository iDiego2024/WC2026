import React, { useState, useEffect } from 'react';
import { useAuth, useUserAchievements, useAchievements, useTeams } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { profilesService } from '../services/api';
import { 
  Trophy, Award, Shield, Crown, Star, Flame, Zap, TrendingUp, 
  Lock, Edit3, Save, Check, AlertCircle, User, MessageSquare, Flag, MapPin
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Trophy,
  Award,
  Shield,
  Crown,
  Star,
  Flame,
  Zap,
  TrendingUp
};

export function ProfileView() {
  const { user, refreshUser } = useAuth() as any;
  const { t } = useLanguage();
  const { teams } = useTeams();
  const { achievements } = useAchievements();
  const { userAchievements, refresh: refreshUserAchievements } = useUserAchievements(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [favoriteCountry, setFavoriteCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setFavoriteTeam(user.favorite_team || '');
      setFavoriteCountry(user.favorite_country || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <User className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm">{t('common.unauthorized')}</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await profilesService.updateProfile(user.id, {
        display_name: displayName,
        bio: bio,
        favorite_team: favoriteTeam,
        favorite_country: favoriteCountry
      });

      if (refreshUser) await refreshUser();
      setSuccessMsg(t('profile.saveSuccess'));
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(t('profile.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const predictionsCount = user.predictions_count || 0;
  const exactHits = user.exact_hits || 0;
  const hitAccuracy = predictionsCount > 0 ? Math.round((exactHits / predictionsCount) * 100) : 0;
  const streak = user.streak || 0;

  // Rank Variation
  const rankGlobal = user.rank_global || null;
  const rankPrevious = user.rank_previous || null;
  let rankDiff = 0;
  if (rankGlobal !== null && rankPrevious !== null) {
    rankDiff = rankPrevious - rankGlobal; // positive means rank went up (e.g. 10th to 8th)
  }

  const isUnlocked = (achId: string) => {
    return userAchievements?.some((ua: any) => ua.achievement_id === achId);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6 animate-in fade-in duration-500">
      
      {/* Top Profile Card / Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8">
        {/* Glow Effects */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-primary/40 bg-slate-950 flex items-center justify-center p-1 shadow-xl">
                <img 
                  src={user.photo_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`} 
                  alt={user.display_name} 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center border border-slate-950 text-[10px] font-bold text-slate-950 shadow-md">
                🏆
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {user.display_name || 'Player'}
                </h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  ID: {user.id.substring(0, 8)}...
                </p>
              </div>

              {user.bio ? (
                <p className="text-sm text-slate-300 max-w-md italic font-light leading-relaxed">
                  "{user.bio}"
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {t('profile.placeholderBio')}
                </p>
              )}

              {/* Badges / Fav info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                {user.favorite_team && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                    <Flag className="w-3.5 h-3.5" />
                    {user.favorite_team}
                  </span>
                )}
                {user.favorite_country && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-sky-500/20 bg-sky-500/5 text-sky-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.favorite_country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit / Actions Button */}
          <div className="flex flex-col gap-2 items-stretch md:items-end w-full md:w-auto">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                {t('profile.editProfile')}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </div>

        {/* Editing Drawer / Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="mt-8 pt-6 border-t border-slate-800/80 space-y-4 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('profile.displayName')}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('profile.favoriteTeam')}
                </label>
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- {t('profile.favoriteTeam')} --</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('profile.bio')}
                </label>
                <textarea
                  value={bio}
                  rows={2}
                  maxLength={160}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('profile.placeholderBio')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-slate-950 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-between h-28 relative">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('profile.points')}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{user.score}</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Global Rank */}
        <div className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-between h-28 relative">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('profile.globalRank')}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">
              {rankGlobal !== null ? `#${rankGlobal}` : '—'}
            </span>
            {rankGlobal !== null && rankDiff !== 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                rankDiff > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {rankDiff > 0 ? `▲ ${rankDiff}` : `▼ ${Math.abs(rankDiff)}`}
              </span>
            )}
          </div>
        </div>

        {/* Weekly & Historic Rank */}
        <div className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-between h-28 relative">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank Semanal / Hist.</span>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">{t('profile.weeklyRank')}:</span>
              <span className="text-white">{user.rank_weekly ? `#${user.rank_weekly}` : '—'}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">{t('profile.historicRank')}:</span>
              <span className="text-white">{user.rank_historic ? `#${user.rank_historic}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Accuracy and Streak */}
        <div className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-between h-28 relative">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Predicciones / Racha</span>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white">{predictionsCount}</span>
              <span className="text-[10px] text-slate-400">{exactHits} {t('profile.exactHits')} ({hitAccuracy}%)</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-xl font-black">
                <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                {streak}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements Panels */}
      <div className="border border-slate-800 rounded-3xl bg-slate-900/20 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {t('profile.achievements')} ({userAchievements.length} / {achievements.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gana recompensas e insignias únicas prediciendo partidos y manteniendo rachas positivas.
          </p>
        </div>

        {achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Lock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">{t('profile.noAchievements')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((ach: any) => {
              const unlocked = isUnlocked(ach.id);
              const IconComponent = iconMap[ach.badge_icon] || Award;

              return (
                <div 
                  key={ach.id} 
                  className={`relative overflow-hidden border p-4 rounded-2xl flex gap-3 transition-all duration-300 ${
                    unlocked 
                      ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 shadow-md' 
                      : 'border-slate-900/50 bg-slate-950/20 opacity-50'
                  }`}
                >
                  {/* Badge Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    unlocked 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {unlocked ? (
                      <IconComponent className="w-6 h-6" />
                    ) : (
                      <Lock className="w-5 h-5 opacity-60" />
                    )}
                  </div>

                  {/* Achievement Text */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white tracking-wide">{ach.title}</h3>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded-md">
                        +{ach.points_reward} pts
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-light">
                      {ach.description}
                    </p>
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
