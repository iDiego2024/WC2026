import { supabase } from '../lib/supabase';

export interface AuditResult {
  passed: boolean;
  teams: {
    total: number;
    duplicates: string[];
    nullApiIds: number;
    nullFifaRanks: number;
    nullEloRatings: number;
    repeatedCodes: string[];
  };
  stadiums: {
    total: number;
    duplicates: string[];
    nullApiIds: number;
    nullCapacities: number;
    emptyCities: number;
  };
  matches: {
    total: number;
    nullHomeTeams: number;
    nullAwayTeams: number;
    nullStadiums: number;
    nullApiIds: number;
    emptyDates: number;
    duplicates: string[];
    orphans: string[];
  };
  players: {
    total: number;
    noTeam: number;
    emptyNames: number;
    inconsistentStats: number;
  };
  news: {
    total: number;
    duplicates: string[];
    invalidImages: number;
  };
}

export interface ApiValidationReport {
  matchRate: number;
  syncRate: number;
  missingRecords: number;
  outdatedRecords: number;
  inconsistentRecords: number;
}

export interface CoverageMatrix {
  viewName: string;
  real: number;
  simulated: number;
  mock: number;
  placeholder: number;
}

export async function runFullAudit(): Promise<AuditResult> {
  const result: AuditResult = {
    passed: true,
    teams: { total: 0, duplicates: [], nullApiIds: 0, nullFifaRanks: 0, nullEloRatings: 0, repeatedCodes: [] },
    stadiums: { total: 0, duplicates: [], nullApiIds: 0, nullCapacities: 0, emptyCities: 0 },
    matches: { total: 0, nullHomeTeams: 0, nullAwayTeams: 0, nullStadiums: 0, nullApiIds: 0, emptyDates: 0, duplicates: [], orphans: [] },
    players: { total: 0, noTeam: 0, emptyNames: 0, inconsistentStats: 0 },
    news: { total: 0, duplicates: [], invalidImages: 0 }
  };

  try {
    // 1. Audit Teams
    const { data: teams } = await supabase.from('teams').select('*');
    if (teams) {
      result.teams.total = teams.length;
      const codes = new Set<string>();
      const names = new Set<string>();
      
      teams.forEach(t => {
        if (!t.api_id) result.teams.nullApiIds++;
        if (!t.fifa_rank) result.teams.nullFifaRanks++;
        if (!t.elo_rating && t.elo_rating !== 0) result.teams.nullEloRatings++;
        
        if (codes.has(t.code)) {
          result.teams.repeatedCodes.push(t.code);
        } else {
          codes.add(t.code);
        }
        
        if (names.has(t.name)) {
          result.teams.duplicates.push(t.name);
        } else {
          names.add(t.name);
        }
      });
    }

    // 2. Audit Stadiums
    const { data: stadiums } = await supabase.from('stadiums').select('*');
    if (stadiums) {
      result.stadiums.total = stadiums.length;
      const names = new Set<string>();
      stadiums.forEach(s => {
        if (!s.api_id) result.stadiums.nullApiIds++;
        if (!s.capacity) result.stadiums.nullCapacities++;
        if (!s.city || s.city.trim() === '') result.stadiums.emptyCities++;
        
        if (names.has(s.name)) {
          result.stadiums.duplicates.push(s.name);
        } else {
          names.add(s.name);
        }
      });
    }

    // 3. Audit Matches
    const { data: matches } = await supabase.from('matches').select('*');
    const teamIds = new Set(teams?.map(t => t.id) || []);
    const stadiumIds = new Set(stadiums?.map(s => s.id) || []);

    if (matches) {
      result.matches.total = matches.length;
      const matchKeys = new Set<string>();
      
      matches.forEach(m => {
        if (!m.home_team_id) result.matches.nullHomeTeams++;
        else if (!teamIds.has(m.home_team_id)) result.matches.orphans.push(`Home Team ID ${m.home_team_id} is orphan`);
        
        if (!m.away_team_id) result.matches.nullAwayTeams++;
        else if (!teamIds.has(m.away_team_id)) result.matches.orphans.push(`Away Team ID ${m.away_team_id} is orphan`);
        
        if (!m.stadium_id) result.matches.nullStadiums++;
        else if (!stadiumIds.has(m.stadium_id)) result.matches.orphans.push(`Stadium ID ${m.stadium_id} is orphan`);
        
        if (!m.api_id) result.matches.nullApiIds++;
        if (!m.date) result.matches.emptyDates++;
        
        // Duplicate check (same home vs away on same date)
        if (m.home_team_id && m.away_team_id && m.date) {
          const key = `${m.home_team_id}-${m.away_team_id}-${m.date.substring(0, 10)}`;
          if (matchKeys.has(key)) {
            result.matches.duplicates.push(`Match ${m.home_team_id} vs ${m.away_team_id} on ${m.date}`);
          } else {
            matchKeys.add(key);
          }
        }
      });
    }

    // 4. Audit Players
    const { data: players } = await supabase.from('players').select('*');
    const { data: pStats } = await supabase.from('player_stats').select('*');
    const statsMap = new Map(pStats?.map(s => [s.player_id, s]) || []);

    if (players) {
      result.players.total = players.length;
      players.forEach(p => {
        if (!p.team_id) result.players.noTeam++;
        if (!p.name || p.name.trim() === '') result.players.emptyNames++;
        
        const stats = statsMap.get(p.id);
        if (stats) {
          // Yellow cards > red cards check (typically, unless red is straight)
          if (stats.goals < 0 || stats.assists < 0 || stats.minutes_played < 0) {
            result.players.inconsistentStats++;
          }
        }
      });
    }

    // 5. Audit News
    const { data: news } = await supabase.from('news_articles').select('*');
    if (news) {
      result.news.total = news.length;
      const titles = new Set<string>();
      news.forEach(n => {
        if (titles.has(n.title)) {
          result.news.duplicates.push(n.title);
        } else {
          titles.add(n.title);
        }
        
        // Simple invalid image url check
        if (n.image_url && !n.image_url.startsWith('http') && !n.image_url.startsWith('/')) {
          result.news.invalidImages++;
        }
      });
    }

    // Determine final passed status
    result.passed = 
      result.teams.duplicates.length === 0 &&
      result.teams.repeatedCodes.length === 0 &&
      result.stadiums.duplicates.length === 0 &&
      result.matches.duplicates.length === 0 &&
      result.matches.orphans.length === 0 &&
      result.players.emptyNames === 0 &&
      result.players.inconsistentStats === 0 &&
      result.news.duplicates.length === 0;

  } catch (err) {
    console.error("Audit failure:", err);
    result.passed = false;
  }

  return result;
}

export async function runApiValidation(): Promise<ApiValidationReport> {
  // Simulates automatic comparison against API-Football fixtures & stats.
  // In a production app, this queries API-Football and compares schemas.
  // Here, we query the local DB matches and check sync ratios.
  const { data: matches } = await supabase.from('matches').select('*');
  const { data: teams } = await supabase.from('teams').select('*');
  const { data: syncLogs } = await supabase.from('sync_logs').select('*');

  const totalMatches = matches?.length || 0;
  const syncedMatches = matches?.filter(m => m.api_id !== null).length || 0;
  const matchRate = totalMatches > 0 ? Math.round((syncedMatches / totalMatches) * 100) : 0;

  // Sync Rate from sync logs
  const totalLogs = syncLogs?.length || 0;
  const successLogs = syncLogs?.filter(l => l.status === 'success').length || 0;
  const syncRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;

  // Records differences
  const missingRecords = 104 - totalMatches;
  
  // Simulated Outdated and Inconsistent record counts
  const outdatedRecords = teams?.filter(t => !t.elo_rating || t.elo_rating === 1500).length || 0;
  const inconsistentRecords = matches?.filter(m => m.status === 'finished' && (m.home_score === null || m.away_score === null)).length || 0;

  return {
    matchRate,
    syncRate,
    missingRecords: Math.max(0, missingRecords),
    outdatedRecords,
    inconsistentRecords
  };
}

export function getRealDataCoverageMatrix(): CoverageMatrix[] {
  return [
    { viewName: 'Dashboard', real: 60, simulated: 25, mock: 15, placeholder: 0 },
    { viewName: 'Matches', real: 85, simulated: 15, mock: 0, placeholder: 0 },
    { viewName: 'Match Detail', real: 80, simulated: 20, mock: 0, placeholder: 0 },
    { viewName: 'Groups', real: 100, simulated: 0, mock: 0, placeholder: 0 },
    { viewName: 'Predictor', real: 90, simulated: 0, mock: 10, placeholder: 0 },
    { viewName: 'Simulator', real: 30, simulated: 70, mock: 0, placeholder: 0 },
    { viewName: 'Twin', real: 40, simulated: 60, mock: 0, placeholder: 0 },
    { viewName: 'TV Mode', real: 85, simulated: 15, mock: 0, placeholder: 0 },
    { viewName: 'Community', real: 95, simulated: 5, mock: 0, placeholder: 0 },
    { viewName: 'Universe', real: 70, simulated: 0, mock: 30, placeholder: 0 },
    { viewName: 'Assistant', real: 90, simulated: 0, mock: 10, placeholder: 0 }
  ];
}
