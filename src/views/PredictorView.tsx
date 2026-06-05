import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, loginWithGoogle, logout, db } from "@/src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { MATCHES, getTeam } from "@/src/data";
import { Trophy, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useLanguage } from "../context/LanguageContext";

export function PredictorView() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Record<string, {home: number, away: number}>>({});
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Load predictions
        try {
          const q = query(collection(db, "predictions"), where("userId", "==", u.uid));
          const snapshot = await getDocs(q);
          const preds: Record<string, {home: number, away: number}> = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            preds[data.matchId] = { home: data.homeScore, away: data.awayScore };
          });
          setPredictions(preds);
        } catch (e) {
          console.error("Error loading predictions", e);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handlePredict = (matchId: string, team: 'home' | 'away', val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return;
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: num,
        home: prev[matchId]?.home ?? 0,
        away: team === 'away' ? num : prev[matchId]?.away ?? 0
      }
    }));
  };

  const savePrediction = async (matchId: string) => {
    if (!user) return;
    const pred = predictions[matchId];
    if (!pred) return;
    
    setSaving(true);
    try {
      const predId = `${user.uid}_${matchId}`;
      await setDoc(doc(db, "predictions", predId), {
        userId: user.uid,
        matchId: matchId,
        homeScore: pred.home,
        awayScore: pred.away,
        updatedAt: serverTimestamp()
      });
      // Visual feedback could go here
    } catch (error) {
      console.error(error);
      alert(t("Falló al guardar predicción. Verifica permisos o estado de inicio de sesión.", "Failed to save prediction. Check permissions or login status."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (!user) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-black">{t('Ligas de Predicciones', 'Predictor Leagues')}</h2>
        <p className="text-muted-foreground max-w-md">{t('Inicia sesión para guardar predicciones, crear ligas privadas y competir.', 'Sign in to save your match predictions, create private leagues, and compete with friends.')}</p>
        <Button size="lg" onClick={loginWithGoogle} className="gap-2">
          <LogIn className="w-5 h-5" />
          {t('Inicia sesión con Google', 'Sign in with Google')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="flex items-end justify-between mb-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('Tus Predicciones', 'Your Predictions')}</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('Guarda tus marcadores', 'Save your scores before kickoff')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-border" />
            <span className="text-xs font-bold text-white hidden md:block">{user.displayName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="h-8 text-[10px] font-bold uppercase"><LogOut className="w-3 h-3 mr-2"/>{t('Salir', 'Logout')}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MATCHES.map(match => {
          const home = getTeam(match.homeTeamId)!;
          const away = getTeam(match.awayTeamId)!;
          const currentPred = predictions[match.id];

          return (
            <Card key={match.id} className="shadow-none border-border bg-card">
              <CardHeader className="p-2 border-b border-border/50 bg-secondary/30">
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center">{match.stage}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <div className="flex items-center justify-between gap-2">
                  
                  {/* Home */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <img src={`https://flagcdn.com/w40/${home.flagCode.toLowerCase()}.png`} className="w-8 h-5 rounded-[2px] object-cover" alt={home.name} />
                    <span className="text-[11px] font-bold text-slate-300 text-center uppercase tracking-wide">{home.name}</span>
                    <Input 
                      type="number" 
                      min="0" max="20"
                      className="w-14 h-10 px-0 text-center text-xl font-black bg-secondary border border-border/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                      value={currentPred?.home ?? ''}
                      onChange={(e) => handlePredict(match.id, 'home', e.target.value)}
                    />
                  </div>

                  <div className="text-slate-500 font-mono font-bold mt-8">-</div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <img src={`https://flagcdn.com/w40/${away.flagCode.toLowerCase()}.png`} className="w-8 h-5 rounded-[2px] object-cover" alt={away.name} />
                    <span className="text-[11px] font-bold text-slate-300 text-center uppercase tracking-wide">{away.name}</span>
                    <Input 
                      type="number" 
                      min="0" max="20"
                      className="w-14 h-10 px-0 text-center text-xl font-black bg-secondary border border-border/50 focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                      value={currentPred?.away ?? ''}
                      onChange={(e) => handlePredict(match.id, 'away', e.target.value)}
                    />
                  </div>

                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="default" 
                    className="w-full h-8 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={saving || currentPred?.home === undefined || currentPred?.away === undefined}
                    onClick={() => savePrediction(match.id)}
                  >
                    {t('Guardar Predicción', 'Save Prediction')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
