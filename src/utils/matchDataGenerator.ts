// Seeded Deterministic Generator for Match Details
// Generates realistic xG, stats, momentum timeline, lineups, and H2H based on match metadata and UUID

export type MatchEvent = {
  minute: number;
  type: 'goal' | 'card_yellow' | 'card_red' | 'assist' | 'substitution';
  team: 'home' | 'away';
  player: string;
  detail?: string;
};

export type PlayerLineup = {
  number: number;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
};

export type MatchStats = {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  passes: [number, number];
  passAccuracy: [number, number];
  distanceRun: [number, number]; // in km
};

export type H2HMatch = {
  date: string;
  stage: string;
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamFlag: string;
  awayTeamFlag: string;
};

// Seed hashing function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// LCG random generator
function createSeededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Squad roster dictionary for key countries
const FAMOUS_PLAYERS: Record<string, string[]> = {
  ARG: ['L. Messi', 'J. Álvarez', 'A. Di María', 'E. Fernández', 'R. De Paul', 'A. Mac Allister', 'L. Martínez', 'C. Romero', 'N. Otamendi', 'N. Molina', 'E. Martínez'],
  BRA: ['Vinícius Jr.', 'Rodrygo', 'Richarlison', 'Neymar Jr.', 'Casemiro', 'L. Paquetá', 'B. Guimarães', 'Marquinhos', 'É. Militão', 'Danilo', 'Alisson'],
  MEX: ['S. Giménez', 'H. Lozano', 'H. Martín', 'L. Chávez', 'E. Álvarez', 'J. Sánchez', 'J. Gallardo', 'C. Montes', 'J. Vásquez', 'N. Araujo', 'L. Malagón'],
  USA: ['C. Pulisic', 'F. Balogun', 'T. Weah', 'W. McKennie', 'Y. Musah', 'T. Adams', 'A. Robinson', 'T. Ream', 'C. Richards', 'S. Dest', 'M. Turner'],
  CAN: ['J. David', 'C. Larin', 'T. Buchanan', 'A. Davies', 'S. Eustáquio', 'I. Koné', 'A. Johnston', 'K. Miller', 'D. Cornelius', 'R. Laryea', 'M. Crépeau'],
  FRA: ['K. Mbappé', 'A. Griezmann', 'O. Dembélé', 'A. Tchouaméni', 'E. Camavinga', 'A. Rabiot', 'T. Hernandez', 'D. Upamecano', 'I. Konaté', 'J. Koundé', 'M. Maignan'],
  ENG: ['H. Kane', 'B. Saka', 'P. Foden', 'J. Bellingham', 'D. Rice', 'T. Alexander-Arnold', 'L. Shaw', 'J. Stones', 'H. Maguire', 'K. Walker', 'J. Pickford'],
  ESP: ['A. Morata', 'N. Williams', 'L. Yamal', 'Rodri', 'Pedri', 'Gavi', 'M. Cucurella', 'A. Laporte', 'R. Le Normand', 'D. Carvajal', 'U. Simón'],
  GER: ['N. Füllkrug', 'J. Musiala', 'F. Wirtz', 'T. Kroos', 'I. Gündogan', 'J. Kimmich', 'M. Mittelstädt', 'J. Tah', 'A. Rüdiger', 'D. Raum', 'M. Neuer'],
  ITA: ['G. Scamacca', 'F. Chiesa', 'N. Barella', 'Jorginho', 'D. Frattesi', 'F. Dimarco', 'A. Bastoni', 'R. Calafiori', 'M. Darmian', 'G. Di Lorenzo', 'G. Donnarumma']
};

const GENERIC_FIRST = ['John', 'David', 'Carlos', 'Luis', 'Jean', 'Pierre', 'Hans', 'Thomas', 'Ali', 'Ahmed', 'Samuel', 'Luka', 'Ivan', 'Shin', 'Ken', 'Mateo', 'Lucas', 'Oliver', 'Mohamed', 'Diego'];
const GENERIC_LAST = ['Smith', 'Jones', 'Garcia', 'Rodriguez', 'Dubois', 'Martin', 'Schmidt', 'Müller', 'Al-Sayed', 'Mensah', 'Diallo', 'Modric', 'Kovac', 'Tanaka', 'Sato', 'Silva', 'Santos', 'Onyango', 'Osei', 'Nkosi'];

function getRoster(teamCode: string, rand: () => number): string[] {
  if (FAMOUS_PLAYERS[teamCode]) {
    return [...FAMOUS_PLAYERS[teamCode]];
  }
  
  // Generate a procedural roster
  const roster: string[] = [];
  for (let i = 0; i < 11; i++) {
    const fIdx = Math.floor(rand() * GENERIC_FIRST.length);
    const lIdx = Math.floor(rand() * GENERIC_LAST.length);
    roster.push(`${GENERIC_FIRST[fIdx].substring(0, 1)}. ${GENERIC_LAST[lIdx]}`);
  }
  return roster;
}

export function generateMatchData(
  matchId: string,
  homeCode: string,
  homeName: string,
  homeFlag: string,
  awayCode: string,
  awayName: string,
  awayFlag: string,
  homeScore: number | null,
  awayScore: number | null,
  status: string
) {
  const seed = hashString(matchId);
  const rand = createSeededRandom(seed);

  // Scores default to simulated if scheduled
  const isFinished = status === 'finished';
  const isLive = status === 'live';
  const hScore = homeScore ?? (isFinished || isLive ? 0 : Math.floor(rand() * 3));
  const aScore = awayScore ?? (isFinished || isLive ? 0 : Math.floor(rand() * 2));

  // 1. Calculate xG (Expected Goals)
  const homeXG = parseFloat((hScore * 0.85 + rand() * 0.8 + 0.1).toFixed(2));
  const awayXG = parseFloat((aScore * 0.85 + rand() * 0.8 + 0.1).toFixed(2));

  // 2. Generate stats
  const possessionSkew = Math.floor((rand() * 20) - 10); // -10 to +10
  const homePossession = 50 + possessionSkew;
  const awayPossession = 50 - possessionSkew;

  const homeShots = Math.max(hScore + 2, Math.floor(rand() * 12) + 4);
  const awayShots = Math.max(aScore + 2, Math.floor(rand() * 10) + 3);

  const homeShotsOnTarget = Math.max(hScore, Math.floor(homeShots * (0.3 + rand() * 0.3)));
  const awayShotsOnTarget = Math.max(aScore, Math.floor(awayShots * (0.3 + rand() * 0.3)));

  const corners: [number, number] = [Math.floor(rand() * 8) + 2, Math.floor(rand() * 7) + 1];
  const fouls: [number, number] = [Math.floor(rand() * 10) + 8, Math.floor(rand() * 12) + 7];
  const yellowCards: [number, number] = [Math.floor(rand() * 3), Math.floor(rand() * 4)];
  const redCards: [number, number] = [rand() > 0.92 ? 1 : 0, rand() > 0.95 ? 1 : 0];

  const basePasses = 400 + Math.floor(rand() * 150);
  const homePasses = Math.floor(basePasses * (homePossession / 100));
  const awayPasses = Math.floor(basePasses * (awayPossession / 100));

  const stats: MatchStats = {
    possession: [homePossession, awayPossession],
    shots: [homeShots, awayShots],
    shotsOnTarget: [homeShotsOnTarget, awayShotsOnTarget],
    corners,
    fouls,
    yellowCards,
    redCards,
    passes: [homePasses, awayPasses],
    passAccuracy: [Math.floor(75 + rand() * 15), Math.floor(73 + rand() * 15)],
    distanceRun: [parseFloat((108 + rand() * 10).toFixed(1)), parseFloat((107 + rand() * 10).toFixed(1))]
  };

  // 3. Lineups
  const homeRoster = getRoster(homeCode, rand);
  const awayRoster = getRoster(awayCode, rand);

  const mapToLineup = (roster: string[]): PlayerLineup[] => [
    { number: 1, name: roster[10] || 'GK Player', position: 'GK' },
    { number: 2, name: roster[9] || 'DF Player 1', position: 'DF' },
    { number: 4, name: roster[8] || 'DF Player 2', position: 'DF' },
    { number: 14, name: roster[7] || 'DF Player 3', position: 'DF' },
    { number: 3, name: roster[6] || 'DF Player 4', position: 'DF' },
    { number: 5, name: roster[5] || 'MF Player 1', position: 'MF' },
    { number: 8, name: roster[4] || 'MF Player 2', position: 'MF' },
    { number: 10, name: roster[0] || 'MF Player 3', position: 'MF' },
    { number: 7, name: roster[1] || 'FW Player 1', position: 'FW' },
    { number: 9, name: roster[2] || 'FW Player 2', position: 'FW' },
    { number: 11, name: roster[3] || 'FW Player 3', position: 'FW' }
  ];

  const homeLineup = mapToLineup(homeRoster);
  const awayLineup = mapToLineup(awayRoster);

  // 4. Timeline events
  const events: MatchEvent[] = [];
  
  // Goals
  for (let i = 0; i < hScore; i++) {
    const min = Math.floor(rand() * 88) + 2;
    // Prefer players 9, 10, 7 or 11
    const pIdx = [7, 8, 9, 10][Math.floor(rand() * 4)];
    const scorer = homeLineup[pIdx]?.name || 'Home Striker';
    events.push({ minute: min, type: 'goal', team: 'home', player: scorer });
    
    // 70% chance of assist
    if (rand() > 0.3) {
      const aIdx = (pIdx + 2) % 11;
      const assister = homeLineup[aIdx]?.name || 'Home Midfielder';
      events.push({ minute: min, type: 'assist', team: 'home', player: assister, detail: scorer });
    }
  }

  for (let i = 0; i < aScore; i++) {
    const min = Math.floor(rand() * 88) + 2;
    const pIdx = [7, 8, 9, 10][Math.floor(rand() * 4)];
    const scorer = awayLineup[pIdx]?.name || 'Away Striker';
    events.push({ minute: min, type: 'goal', team: 'away', player: scorer });
    
    if (rand() > 0.3) {
      const aIdx = (pIdx + 2) % 11;
      const assister = awayLineup[aIdx]?.name || 'Away Midfielder';
      events.push({ minute: min, type: 'assist', team: 'away', player: assister, detail: scorer });
    }
  }

  // Yellow Cards
  for (let i = 0; i < stats.yellowCards[0]; i++) {
    const min = Math.floor(rand() * 85) + 5;
    const pIdx = Math.floor(rand() * 5) + 1; // df/mf
    events.push({ minute: min, type: 'card_yellow', team: 'home', player: homeLineup[pIdx]?.name || 'Home Player' });
  }
  for (let i = 0; i < stats.yellowCards[1]; i++) {
    const min = Math.floor(rand() * 85) + 5;
    const pIdx = Math.floor(rand() * 5) + 1;
    events.push({ minute: min, type: 'card_yellow', team: 'away', player: awayLineup[pIdx]?.name || 'Away Player' });
  }

  // Red Cards
  if (stats.redCards[0] > 0) {
    const min = Math.floor(rand() * 40) + 50; // second half mostly
    events.push({ minute: min, type: 'card_red', team: 'home', player: homeLineup[3]?.name || 'Home Player' });
  }
  if (stats.redCards[1] > 0) {
    const min = Math.floor(rand() * 40) + 50;
    events.push({ minute: min, type: 'card_red', team: 'away', player: awayLineup[3]?.name || 'Away Player' });
  }

  // Sort events by minute and priority
  events.sort((a, b) => {
    if (a.minute === b.minute) {
      if (a.type === 'goal' && b.type === 'assist') return 1; // Goal before Assist
      if (a.type === 'assist' && b.type === 'goal') return -1;
    }
    return a.minute - b.minute;
  });

  // 5. Momentum
  const momentum: number[] = [];
  let currentMomentum = 10;
  for (let i = 0; i < 10; i++) {
    // Check if there was a goal or action in this block of 9 mins
    const blockMinStart = i * 9;
    const blockMinEnd = (i + 1) * 9;
    const homeAction = events.some(e => e.team === 'home' && e.type === 'goal' && e.minute >= blockMinStart && e.minute < blockMinEnd);
    const awayAction = events.some(e => e.team === 'away' && e.type === 'goal' && e.minute >= blockMinStart && e.minute < blockMinEnd);
    
    if (homeAction) {
      currentMomentum = Math.min(95, 75 + Math.floor(rand() * 20));
    } else if (awayAction) {
      currentMomentum = Math.max(5, 10 + Math.floor(rand() * 15));
    } else {
      // General drift skewed by possession
      const drift = Math.floor((rand() * 40) - 20); // -20 to 20
      const base = homePossession; // 50 skew
      currentMomentum = Math.max(15, Math.min(85, base + drift));
    }
    momentum.push(currentMomentum);
  }

  // 6. H2H History
  const stages = ['Group Stage', 'Round of 16', 'Quarterfinals', 'Friendly'];
  const years = ['2014', '2018', '2022', '2024', '2025'];
  const h2h: H2HMatch[] = [];
  const h2hCount = Math.floor(rand() * 3) + 2; // 2 to 4 matches
  for (let i = 0; i < h2hCount; i++) {
    const stage = stages[Math.floor(rand() * stages.length)];
    const year = years[Math.floor(rand() * years.length)];
    const isHomeWinner = rand() > 0.45;
    const hH2hScore = isHomeWinner ? Math.floor(rand() * 3) + 1 : Math.floor(rand() * 2);
    const aH2hScore = isHomeWinner ? Math.floor(rand() * hH2hScore) : Math.floor(rand() * 3) + 1;

    h2h.push({
      date: `${year}-06-${10 + i}`,
      stage,
      homeScore: hH2hScore,
      awayScore: aH2hScore,
      homeTeamName: homeName,
      awayTeamName: awayName,
      homeTeamFlag: homeFlag,
      awayTeamFlag: awayFlag
    });
  }

  return {
    xG: [homeXG, awayXG],
    stats,
    homeLineup,
    awayLineup,
    events,
    momentum,
    h2h
  };
}
