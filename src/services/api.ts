import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase'; // We'll create this or use any

export const teamsService = {
  async getAllTeams() {
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (error) throw error;
    return data;
  },
  
  async getTeamById(id: string) {
    const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
};

export const matchesService = {
  async getAllMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        stadium:stadiums(*)
      `)
      .order('date');
    if (error) throw error;
    return data;
  },
  
  async getMatchById(id: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        stadium:stadiums(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
};
