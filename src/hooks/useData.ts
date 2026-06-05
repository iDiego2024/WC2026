import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  teamsService, 
  matchesService, 
  predictionsService, 
  leaguesService, 
  profilesService 
} from '../services/api';

export function useTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    teamsService.getAllTeams()
      .then(data => {
        setTeams(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { teams, loading, error };
}

export function useMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(() => {
    matchesService.getAllMatches()
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchMatches();

    // Set up Realtime listener for match changes
    const channel = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches(); // Reload match scores and status in real-time
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  return { matches, loading, error, refresh: fetchMatches };
}

export function useMatch(id: string) {
  const [match, setMatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatch = useCallback(() => {
    if (!id) return;
    matchesService.getMatchById(id)
      .then(data => {
        setMatch(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchMatch();

    // Listen for Realtime updates on this specific match
    const channel = supabase
      .channel(`public:matches:id=${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        () => {
          fetchMatch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchMatch]);

  return { match, loading, error, refresh: fetchMatch };
}

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile table with metadata from OAuth/Auth session
  const syncProfile = async (sessionUser: any) => {
    if (!sessionUser) return null;
    try {
      // Try to fetch profile first
      let profile;
      try {
        profile = await profilesService.getProfile(sessionUser.id);
      } catch (err) {
        // Profile doesn't exist, create it
        const displayName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Player';
        const photoUrl = sessionUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sessionUser.id}`;
        profile = await profilesService.updateProfile(sessionUser.id, displayName, photoUrl);
      }
      return profile;
    } catch (e) {
      console.error('Failed to sync profile:', e);
      // Fallback to minimal user object
      return {
        id: sessionUser.id,
        email: sessionUser.email,
        display_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
        photo_url: sessionUser.user_metadata?.avatar_url,
        score: 0
      };
    }
  };

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncProfile(session.user).then(profile => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await syncProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signInWithGoogle, signOut };
}

export function usePredictions(userId: string | undefined) {
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number; points: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(() => {
    if (!userId) {
      setPredictions({});
      setLoading(false);
      return;
    }
    predictionsService.getPredictionsByUserId(userId)
      .then(data => {
        const preds: Record<string, { home: number; away: number; points: number }> = {};
        data.forEach(p => {
          if (p.match_id) {
            preds[p.match_id] = { home: p.home_score, away: p.away_score, points: p.points_earned };
          }
        });
        setPredictions(preds);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchPredictions();
  }, [userId, fetchPredictions]);

  const savePrediction = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!userId) throw new Error('User must be logged in to save predictions');
    const result = await predictionsService.savePrediction(userId, matchId, homeScore, awayScore);
    
    // Update local state
    setPredictions(prev => ({
      ...prev,
      [matchId]: { home: homeScore, away: awayScore, points: result.points_earned }
    }));
    
    return result;
  };

  return { predictions, loading, error, savePrediction, refresh: fetchPredictions };
}

export function useLeagues(userId: string | undefined) {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeagues = useCallback(() => {
    if (!userId) {
      setLeagues([]);
      setLoading(false);
      return;
    }
    leaguesService.getPrivateLeagues()
      .then(data => {
        setLeagues(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchLeagues();
  }, [userId, fetchLeagues]);

  const createLeague = async (name: string) => {
    if (!userId) throw new Error('User must be logged in to create leagues');
    const result = await leaguesService.createLeague(name, userId);
    fetchLeagues();
    return result;
  };

  const joinLeague = async (inviteCode: string) => {
    if (!userId) throw new Error('User must be logged in to join leagues');
    const result = await leaguesService.joinLeague(inviteCode, userId);
    fetchLeagues();
    return result;
  };

  return { leagues, loading, error, createLeague, joinLeague, refresh: fetchLeagues };
}

export function useRankings() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    profilesService.getLeaderboard()
      .then(data => {
        setRankings(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { rankings, loading, error };
}
