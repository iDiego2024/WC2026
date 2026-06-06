import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

const apiKey = process.env.RAPIDAPI_KEY || '';
const baseDomain = "https://v3.football.api-sports.io";
const headers = { "x-apisports-key": apiKey };

async function syncDetails() {
  // Fetch team maps
  const { data: dbTeams, error: teamsErr } = await supabase.from('teams').select('id, api_id');
  if (teamsErr) throw teamsErr;
  const teamIdMap: Record<number, string> = {};
  for (const t of dbTeams || []) {
    if (t.api_id) teamIdMap[t.api_id] = t.id;
  }

  // Fetch first 12 matches (Group A & Group B matches) to stay within the 100/day API rate limit
  const { data: dbMatches, error: matchesErr } = await supabase
    .from('matches')
    .select('id, api_id, stage')
    .not('api_id', 'is', null)
    .order('date')
    .limit(12);

  if (matchesErr) throw matchesErr;

  console.log(`Syncing details for ${dbMatches?.length || 0} matches...`);

  for (const m of dbMatches || []) {
    const matchId = m.id;
    const apiMatchId = m.api_id;

    console.log(`Syncing details for Match ${matchId} (API ID: ${apiMatchId})...`);

    // 1. Stats
    try {
      const statsRes = await fetch(`${baseDomain}/fixtures/statistics?fixture=${apiMatchId}`, { headers });
      if (statsRes.ok) {
        const statsBody = await statsRes.json();
        const statsArr = statsBody?.response || [];
        
        if (statsArr.length >= 2) {
          const getStatVal = (teamIdx: number, type: string): any => {
            const item = statsArr[teamIdx]?.statistics?.find((s: any) => s.type === type);
            if (!item || item.value === null) return null;
            if (typeof item.value === 'string' && item.value.includes('%')) {
              return parseInt(item.value.replace('%', ''), 10);
            }
            return item.value;
          };

          const statsPayload = {
            match_id: matchId,
            possession_home: getStatVal(0, "Ball Possession") || 50,
            possession_away: getStatVal(1, "Ball Possession") || 50,
            shots_home: getStatVal(0, "Total Shots") || 0,
            shots_away: getStatVal(1, "Total Shots") || 0,
            shots_on_target_home: getStatVal(0, "Shots on Goal") || 0,
            shots_on_target_away: getStatVal(1, "Shots on Goal") || 0,
            corners_home: getStatVal(0, "Corner Kicks") || 0,
            corners_away: getStatVal(1, "Corner Kicks") || 0,
            fouls_home: getStatVal(0, "Fouls") || 0,
            fouls_away: getStatVal(1, "Fouls") || 0,
            yellow_cards_home: getStatVal(0, "Yellow Cards") || 0,
            yellow_cards_away: getStatVal(1, "Yellow Cards") || 0,
            red_cards_home: getStatVal(0, "Red Cards") || 0,
            red_cards_away: getStatVal(1, "Red Cards") || 0,
            passes_home: getStatVal(0, "Total passes") || 0,
            passes_away: getStatVal(1, "Total passes") || 0,
            pass_accuracy_home: getStatVal(0, "Passes %") || 80,
            pass_accuracy_away: getStatVal(1, "Passes %") || 80,
            xg_home: getStatVal(0, "expected_goals") ? parseFloat(getStatVal(0, "expected_goals")) : 1.2,
            xg_away: getStatVal(1, "expected_goals") ? parseFloat(getStatVal(1, "expected_goals")) : 1.0
          };

          await supabase.from('match_statistics').upsert(statsPayload, { onConflict: 'match_id' });
          console.log(`  - Stats updated.`);
        }
      }
    } catch (e) {
      console.error(`Error syncing stats:`, e);
    }

    // 2. Events
    try {
      const eventsRes = await fetch(`${baseDomain}/fixtures/events?fixture=${apiMatchId}`, { headers });
      if (eventsRes.ok) {
        const eventsBody = await eventsRes.json();
        const eventsArr = eventsBody?.response || [];

        // Clean
        await supabase.from('match_events').delete().eq('match_id', matchId);

        const eventsToInsert = eventsArr.map((ev: any) => ({
          match_id: matchId,
          minute: ev.time.elapsed,
          event_type: ev.type?.toLowerCase() || 'other',
          player_name: ev.player?.name || 'Unknown',
          team_id: teamIdMap[ev.team?.id] || null,
          description: ev.detail || ev.comments || ''
        }));

        if (eventsToInsert.length > 0) {
          const { error } = await supabase.from('match_events').insert(eventsToInsert);
          if (error) console.error('Error inserting events:', error);
          else console.log(`  - ${eventsToInsert.length} events inserted.`);
        }
      }
    } catch (e) {
      console.error(`Error syncing events:`, e);
    }

    // 3. Lineups
    try {
      const lineupsRes = await fetch(`${baseDomain}/fixtures/lineups?fixture=${apiMatchId}`, { headers });
      if (lineupsRes.ok) {
        const lineupsBody = await lineupsRes.json();
        const lineupsArr = lineupsBody?.response || [];

        // Clean
        await supabase.from('lineups').delete().eq('match_id', matchId);

        const lineupsToInsert: any[] = [];
        for (const lineup of lineupsArr) {
          const teamId = teamIdMap[lineup.team?.id] || null;
          
          for (const item of lineup.startXI || []) {
            lineupsToInsert.push({
              match_id: matchId,
              team_id: teamId,
              player_name: item.player?.name || 'Unknown',
              position: item.player?.pos || 'M',
              starter: true,
              shirt_number: item.player?.number || null
            });
          }

          for (const item of lineup.substitutes || []) {
            lineupsToInsert.push({
              match_id: matchId,
              team_id: teamId,
              player_name: item.player?.name || 'Unknown',
              position: item.player?.pos || 'M',
              starter: false,
              shirt_number: item.player?.number || null
            });
          }
        }

        if (lineupsToInsert.length > 0) {
          const { error } = await supabase.from('lineups').insert(lineupsToInsert);
          if (error) console.error('Error inserting lineups:', error);
          else console.log(`  - ${lineupsToInsert.length} lineup players inserted.`);
        }
      }
    } catch (e) {
      console.error(`Error syncing lineups:`, e);
    }
  }

  console.log('Finished syncing match details.');
}

syncDetails().catch(console.error);
