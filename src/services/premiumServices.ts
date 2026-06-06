import { supabase } from '../lib/supabase';

export const premiumServices = {
  async getMatchEvents(matchId: string) {
    const { data, error } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getMatchLineups(matchId: string) {
    const { data, error } = await supabase
      .from('lineups')
      .select('*')
      .eq('match_id', matchId);
    if (error) throw error;
    return data;
  },

  async getMatchStatistics(matchId: string) {
    const { data, error } = await supabase
      .from('match_statistics')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getH2HHistory(homeTeamCode: string, awayTeamCode: string) {
    // Attempt cache read
    const { data: cache } = await supabase
      .from('h2h_cache')
      .select('*')
      .or(`and(home_team_code.eq.${homeTeamCode},away_team_code.eq.${awayTeamCode}),and(home_team_code.eq.${awayTeamCode},away_team_code.eq.${homeTeamCode})`)
      .maybeSingle();
    
    if (cache) {
      return cache.data;
    }
    return null;
  },

  async getPlayerStats() {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(name, flag_code),
        stats:player_stats(*)
      `);
    if (error) throw error;
    return data;
  },

  async getNewsArticles() {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTournamentInsights() {
    const { data, error } = await supabase
      .from('tournament_insights')
      .select('*');
    if (error) throw error;
    return data;
  }
};
