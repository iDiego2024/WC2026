import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

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

export const predictionsService = {
  async getPredictionsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async getPredictionsWithMatches(userId: string) {
    const { data, error } = await supabase
      .from('match_predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          stadium:stadiums(*)
        )
      `)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async savePrediction(userId: string, matchId: string, homeScore: number, awayScore: number) {
    const { data, error } = await supabase
      .from('match_predictions')
      .upsert(
        {
          user_id: userId,
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,match_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const leaguesService = {
  async getPrivateLeagues() {
    // Select leagues and their members
    const { data: leagues, error: leaguesError } = await supabase
      .from('private_leagues')
      .select(`
        *,
        owner:profiles!owner_id(*)
      `);
    if (leaguesError) throw leaguesError;

    // For each league, fetch member profiles
    const leaguesWithMembers = await Promise.all(
      leagues.map(async (league) => {
        const { data: members, error: membersError } = await supabase
          .from('league_members')
          .select(`
            joined_at,
            profile:profiles(*)
          `)
          .eq('league_id', league.id);
        if (membersError) throw membersError;
        
        return {
          ...league,
          members: members.map(m => m.profile).filter(Boolean)
        };
      })
    );

    return leaguesWithMembers;
  },

  async createLeague(name: string, ownerId: string) {
    // Generate a simple 6-digit uppercase invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 1. Insert the private league
    const { data: league, error: leagueError } = await supabase
      .from('private_leagues')
      .insert({
        name,
        owner_id: ownerId,
        invite_code: inviteCode
      })
      .select()
      .single();
    if (leagueError) throw leagueError;

    // 2. Add the owner as a member
    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: ownerId
      });
    if (memberError) throw memberError;

    return league;
  },

  async joinLeague(inviteCode: string, userId: string) {
    // 1. Find the league by invite code
    const { data: league, error: leagueError } = await supabase
      .from('private_leagues')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();
    if (leagueError) throw new Error('League not found or invalid invite code');

    // 2. Add user to the league
    const { error: joinError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userId
      });
    if (joinError) {
      if (joinError.code === '23505') { // Unique constraint violation (already joined)
        return league;
      }
      throw joinError;
    }

    return league;
  }
};

export const profilesService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async getLeaderboard() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('score', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Database['public']['Tables']['profiles']['Update']> | string,
    photoUrl?: string
  ) {
    let payload: any;
    if (typeof updates === 'string') {
      payload = {
        id: userId,
        display_name: updates,
        photo_url: photoUrl,
        updated_at: new Date().toISOString()
      };
    } else {
      payload = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      };
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const achievementsService = {
  async getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points_reward', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};
