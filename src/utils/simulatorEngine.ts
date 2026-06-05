// Monte Carlo & Poisson Simulation Engine for World Cup 2026

export type TeamSim = {
  id: string;
  code: string;
  name: string;
  flag_code: string;
  group_name: string;
  fifa_rank: number;
  strength: number; // calculated rating
};

export type MatchSim = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  group_name: string | null;
  stage: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

// Poisson goal sampler
function poissonSample(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 30); // prevent infinite loop
  return k - 1;
}

// Simulates a single match outcome using Bivariate Poisson model approximation
export function simulateMatch(
  homeStrength: number,
  awayStrength: number
): { homeScore: number; awayScore: number } {
  // Base average goals per team in World Cup is around 1.3
  const baseAvg = 1.35;
  const ratio = homeStrength / (awayStrength || 1);
  
  const homeLambda = baseAvg * Math.sqrt(ratio);
  const awayLambda = baseAvg / Math.sqrt(ratio);

  const homeScore = poissonSample(homeLambda);
  const awayScore = poissonSample(awayLambda);

  return { homeScore, awayScore };
}

export function runMonteCarlo(
  teams: TeamSim[],
  matches: MatchSim[],
  overrides: Record<string, { h: string; a: string }> = {},
  runs: number = 1000
) {
  // Initialize results tracking
  const results: Record<
    string,
    {
      teamId: string;
      code: string;
      name: string;
      flag_code: string;
      group: string;
      wins: number;
      final: number;
      semi: number;
      quarter: number;
      r16: number;
      r32: number;
    }
  > = {};

  teams.forEach(t => {
    results[t.id] = {
      teamId: t.id,
      code: t.code,
      name: t.name,
      flag_code: t.flag_code,
      group: t.group_name,
      wins: 0,
      final: 0,
      semi: 0,
      quarter: 0,
      r16: 0,
      r32: 0
    };
  });

  // Index teams for quick lookup
  const teamsById = new Map<string, TeamSim>();
  teams.forEach(t => teamsById.set(t.id, t));

  // Run iterations
  for (let r = 0; r < runs; r++) {
    // 1. Simulate Group Stages
    // Group standings accumulator
    const groupStandings: Record<
      string,
      Record<string, { points: number; gd: number; gf: number; teamId: string }>
    > = {};

    // Initialize standings
    teams.forEach(t => {
      if (!groupStandings[t.group_name]) groupStandings[t.group_name] = {};
      groupStandings[t.group_name][t.id] = { points: 0, gd: 0, gf: 0, teamId: t.id };
    });

    // Simulate group matches
    const groupMatches = matches.filter(m => m.stage === 'Group Stage');
    groupMatches.forEach(match => {
      const homeId = match.home_team_id!;
      const awayId = match.away_team_id!;
      const group = match.group_name!;

      let homeScore = 0;
      let awayScore = 0;

      // Check overrides (What-if scenario) or finished status
      if (overrides[match.id]) {
        homeScore = parseInt(overrides[match.id].h) || 0;
        awayScore = parseInt(overrides[match.id].a) || 0;
      } else if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
        homeScore = match.home_score;
        awayScore = match.away_score;
      } else {
        const homeT = teamsById.get(homeId)!;
        const awayT = teamsById.get(awayId)!;
        const sim = simulateMatch(homeT.strength, awayT.strength);
        homeScore = sim.homeScore;
        awayScore = sim.awayScore;
      }

      // Update standings
      const homeStand = groupStandings[group][homeId];
      const awayStand = groupStandings[group][awayId];

      homeStand.gf += homeScore;
      homeStand.gd += homeScore - awayScore;
      awayStand.gf += awayScore;
      awayStand.gd += awayScore - homeScore;

      if (homeScore > awayScore) {
        homeStand.points += 3;
      } else if (homeScore < awayScore) {
        awayStand.points += 3;
      } else {
        homeStand.points += 1;
        awayStand.points += 1;
      }
    });

    // Sort group standings
    const qualifiedTeams: string[] = []; // top 2 from each group
    const thirdPlaceTeams: { teamId: string; points: number; gd: number; gf: number }[] = [];

    Object.keys(groupStandings).forEach(group => {
      const sorted = Object.values(groupStandings[group]).sort((a, b) => {
        return b.points - a.points || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5;
      });

      // Top 2 qualify
      if (sorted[0]) qualifiedTeams.push(sorted[0].teamId);
      if (sorted[1]) qualifiedTeams.push(sorted[1].teamId);
      // 3rd place goes to wild-card pool
      if (sorted[2]) thirdPlaceTeams.push(sorted[2]);
    });

    // Select 8 best 3rd-place teams to complete 32 qualified teams
    thirdPlaceTeams.sort((a, b) => {
      return b.points - a.points || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5;
    });

    for (let i = 0; i < 8 && i < thirdPlaceTeams.length; i++) {
      qualifiedTeams.push(thirdPlaceTeams[i].teamId);
    }

    // Mark R32 reached
    qualifiedTeams.forEach(id => {
      if (results[id]) results[id].r32++;
    });

    // 2. Simulate Knockout Bracket (Round of 32 -> Round of 16 -> QF -> SF -> Final)
    let round32 = [...qualifiedTeams];
    // Shuffle to simulate general tournament pathways
    round32.sort(() => Math.random() - 0.5);

    // Round of 16
    const round16: string[] = [];
    for (let i = 0; i < round32.length; i += 2) {
      const teamA = round32[i];
      const teamB = round32[i + 1] || round32[i]; // handle odd sizes defensively
      const winner = simulateKnockoutMatch(teamA, teamB, teamsById);
      round16.push(winner);
      if (results[winner]) results[winner].r16++;
    }

    // Quarterfinals
    const qf: string[] = [];
    for (let i = 0; i < round16.length; i += 2) {
      const teamA = round16[i];
      const teamB = round16[i + 1] || round16[i];
      const winner = simulateKnockoutMatch(teamA, teamB, teamsById);
      qf.push(winner);
      if (results[winner]) results[winner].quarter++;
    }

    // Semifinals
    const sf: string[] = [];
    for (let i = 0; i < qf.length; i += 2) {
      const teamA = qf[i];
      const teamB = qf[i + 1] || qf[i];
      const winner = simulateKnockoutMatch(teamA, teamB, teamsById);
      sf.push(winner);
      if (results[winner]) results[winner].semi++;
    }

    // Final
    if (sf.length >= 2) {
      const winner = simulateKnockoutMatch(sf[0], sf[1], teamsById);
      const runnerUp = winner === sf[0] ? sf[1] : sf[0];
      
      if (results[winner]) {
        results[winner].wins++;
        results[winner].final++;
      }
      if (results[runnerUp]) {
        results[runnerUp].final++;
      }
    }
  }

  // Convert to percentages / probabilities
  return Object.values(results).map(r => ({
    ...r,
    r32: parseFloat(((r.r32 / runs) * 100).toFixed(1)),
    r16: parseFloat(((r.r16 / runs) * 100).toFixed(1)),
    quarter: parseFloat(((r.quarter / runs) * 100).toFixed(1)),
    semi: parseFloat(((r.semi / runs) * 100).toFixed(1)),
    final: parseFloat(((r.final / runs) * 100).toFixed(1)),
    wins: parseFloat(((r.wins / runs) * 100).toFixed(1))
  })).sort((a, b) => b.wins - a.wins);
}

function simulateKnockoutMatch(
  teamAId: string,
  teamBId: string,
  teamsById: Map<string, TeamSim>
): string {
  const teamA = teamsById.get(teamAId)!;
  const teamB = teamsById.get(teamBId)!;
  
  const sim = simulateMatch(teamA.strength, teamB.strength);
  if (sim.homeScore > sim.awayScore) return teamAId;
  if (sim.homeScore < sim.awayScore) return teamBId;

  // Extra time/penalty shootout coin flip (weighted slightly by team strength)
  const totalStrength = teamA.strength + teamB.strength;
  const winProbabilityA = teamA.strength / (totalStrength || 1);
  return Math.random() < winProbabilityA ? teamAId : teamBId;
}
