import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "../context/LanguageContext";
import { useAuth, useMatches, usePredictions } from "../hooks/useData";
import { Trophy, LogIn, LogOut, Loader2 } from 'lucide-react';

export function PredictorView() {
  const { t } = useLanguage();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { matches, loading: matchesLoading } = useMatches();
  const { predictions, savePrediction, loading: predsLoading } = usePredictions(user?.id);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // State for edited scores that are not yet saved.
  // It is populated when a user types in the input.
  const [localDrafts, setLocalDrafts] = useState<Record<string, { home?: number; away?: number }>>({});

  const handlePredictChange = (matchId: string, team: 'home' | 'away', val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return;
    
    setLocalDrafts(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: num
      }
    }));
  };

  const handleSave = async (matchId: string) => {
    if (!user) return;
    
    const draft = localDrafts[matchId];
    const currentPred = predictions[matchId];
    
    // Get values from drafts, falling back to existing predictions or 0
    const homeScore = draft?.home !== undefined ? draft.home : (currentPred?.home ?? 0);
    const awayScore = draft?.away !== undefined ? draft.away : (currentPred?.away ?? 0);

    setSavingId(matchId);
    try {
      await savePrediction(matchId, homeScore, awayScore);
      // Clear draft for this match once successfully saved
      setLocalDrafts(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
    } catch (error) {
      console.error(error);
      alert(t("predictor.saveFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const isLoading = authLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-black">{t('predictor.signInTitle')}</h2>
        <p className="text-muted-foreground max-w-md">{t('predictor.signInDesc')}</p>
        <Button size="lg" onClick={signInWithGoogle} className="gap-2 font-bold uppercase tracking-wider text-xs">
          <LogIn className="w-5 h-5" />
          {t('predictor.signInButton')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="flex items-end justify-between mb-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('predictor.title')}</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('predictor.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user.photo_url && (
              <img src={user.photo_url} alt="avatar" className="w-8 h-8 rounded-full border border-border" />
            )}
            <span className="text-xs font-bold text-white hidden md:block">{user.display_name}</span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{user.score} pts</span>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="h-8 text-[10px] font-bold uppercase">
            <LogOut className="w-3 h-3 mr-2" />
            {t('predictor.logout')}
          </Button>
        </div>
      </header>

      {predsLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {matches.map(match => {
            const home = match.home_team;
            const away = match.away_team;
            if (!home || !away) return null;

            const currentPred = predictions[match.id];
            const draft = localDrafts[match.id];
            
            const homeVal = draft?.home !== undefined ? draft.home : (currentPred?.home ?? '');
            const awayVal = draft?.away !== undefined ? draft.away : (currentPred?.away ?? '');
            const isSaving = savingId === match.id;
            
            // Check if user changed anything compared to saved prediction
            const isDirty = draft !== undefined && 
              (draft.home !== undefined && draft.home !== currentPred?.home ||
               draft.away !== undefined && draft.away !== currentPred?.away);

            return (
              <Card key={match.id} className="shadow-none border-border bg-card">
                <CardHeader className="p-2 border-b border-border/50 bg-secondary/30">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center">
                    {match.stage} {match.group_name && `• Grupo ${match.group_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Home */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <img 
                        src={`https://flagcdn.com/w40/${home.flag_code.toLowerCase()}.png`} 
                        className="w-8 h-5 rounded-[2px] object-cover" 
                        alt={home.name} 
                      />
                      <span className="text-[11px] font-bold text-slate-300 text-center uppercase tracking-wide truncate w-full">{home.name}</span>
                      <Input 
                        type="number" 
                        min="0" max="20"
                        className="w-14 h-10 px-0 text-center text-xl font-black bg-secondary border border-border/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                        value={homeVal}
                        onChange={(e) => handlePredictChange(match.id, 'home', e.target.value)}
                      />
                    </div>

                    <div className="text-slate-500 font-mono font-bold mt-8">-</div>

                    {/* Away */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <img 
                        src={`https://flagcdn.com/w40/${away.flag_code.toLowerCase()}.png`} 
                        className="w-8 h-5 rounded-[2px] object-cover" 
                        alt={away.name} 
                      />
                      <span className="text-[11px] font-bold text-slate-300 text-center uppercase tracking-wide truncate w-full">{away.name}</span>
                      <Input 
                        type="number" 
                        min="0" max="20"
                        className="w-14 h-10 px-0 text-center text-xl font-black bg-secondary border border-border/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                        value={awayVal}
                        onChange={(e) => handlePredictChange(match.id, 'away', e.target.value)}
                      />
                    </div>

                  </div>
                  <div className="mt-4 flex justify-center flex-col gap-2">
                    <Button 
                      variant={isDirty ? "default" : "outline"} 
                      className={`w-full h-8 text-[10px] font-bold uppercase tracking-wider ${isDirty ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-slate-400 bg-transparent border-border hover:bg-white/5'}`}
                      disabled={isSaving || homeVal === '' || awayVal === ''}
                      onClick={() => handleSave(match.id)}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : null}
                      {currentPred ? t('predictor.updatePrediction') : t('predictor.savePrediction')}
                    </Button>
                    
                    {currentPred?.points !== undefined && match.status === 'finished' && (
                      <div className="text-center text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 py-1 rounded border border-emerald-500/20">
                        {t('predictor.pointsEarned')}: +{currentPred.points}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
