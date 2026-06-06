/**
 * Reparación Completa de Integridad de Datos - WC2026
 * Ejecuta todas las operaciones de limpieza y repoblación en orden correcto.
 * 
 * ORDEN DE EJECUCIÓN:
 * 1. Limpiar matches (todos NULL de FKs)
 * 2. Limpiar teams duplicados (mantener 48 canónicos)
 * 3. Limpiar stadiums duplicados (mantener 16 del seed)
 * 4. Actualizar metadata de equipos (grupos, fifa_rank, continent)
 * 5. Reinsertar 104 partidos con FKs correctas
 * 6. Validar resultado final
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Variables de entorno de Supabase no configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// DEFINICIÓN CANÓNICA: 48 EQUIPOS OFICIALES
// Fuente: seed original (supabase_seed_full.sql)
// ============================================================
const CANONICAL_TEAMS = [
  // Grupo A
  { code: 'MEX', name: 'Mexico',        flag_code: 'mx', group_name: 'A', fifa_rank: 15,  continent: 'CONCACAF' },
  { code: 'RSA', name: 'South Africa',  flag_code: 'za', group_name: 'A', fifa_rank: 59,  continent: 'CAF' },
  { code: 'KOR', name: 'South Korea',   flag_code: 'kr', group_name: 'A', fifa_rank: 22,  continent: 'AFC' },
  { code: 'CZE', name: 'Czechia',        flag_code: 'cz', group_name: 'A', fifa_rank: 36,  continent: 'UEFA' },
  // Grupo B
  { code: 'CAN', name: 'Canada',        flag_code: 'ca', group_name: 'B', fifa_rank: 40,  continent: 'CONCACAF' },
  { code: 'BIH', name: 'Bosnia and Herzegovina', flag_code: 'ba', group_name: 'B', fifa_rank: 74, continent: 'UEFA' },
  { code: 'QAT', name: 'Qatar',         flag_code: 'qa', group_name: 'B', fifa_rank: 37,  continent: 'AFC' },
  { code: 'SUI', name: 'Switzerland',   flag_code: 'ch', group_name: 'B', fifa_rank: 19,  continent: 'UEFA' },
  // Grupo C
  { code: 'BRA', name: 'Brazil',        flag_code: 'br', group_name: 'C', fifa_rank: 5,   continent: 'CONMEBOL' },
  { code: 'MAR', name: 'Morocco',       flag_code: 'ma', group_name: 'C', fifa_rank: 12,  continent: 'CAF' },
  { code: 'HTI', name: 'Haiti',         flag_code: 'ht', group_name: 'C', fifa_rank: 90,  continent: 'CONCACAF' },
  { code: 'SCO', name: 'Scotland',      flag_code: 'gb-sct', group_name: 'C', fifa_rank: 39, continent: 'UEFA' },
  // Grupo D
  { code: 'USA', name: 'United States', flag_code: 'us', group_name: 'D', fifa_rank: 11,  continent: 'CONCACAF' },
  { code: 'PRY', name: 'Paraguay',      flag_code: 'py', group_name: 'D', fifa_rank: 56,  continent: 'CONMEBOL' },
  { code: 'AUS', name: 'Australia',     flag_code: 'au', group_name: 'D', fifa_rank: 24,  continent: 'AFC' },
  { code: 'TUR', name: 'Turkey',        flag_code: 'tr', group_name: 'D', fifa_rank: 35,  continent: 'UEFA' },
  // Grupo E
  { code: 'GER', name: 'Germany',       flag_code: 'de', group_name: 'E', fifa_rank: 16,  continent: 'UEFA' },
  { code: 'CUW', name: 'Curaçao',       flag_code: 'cw', group_name: 'E', fifa_rank: 91,  continent: 'CONCACAF' },
  { code: 'CIV', name: 'Ivory Coast',   flag_code: 'ci', group_name: 'E', fifa_rank: 38,  continent: 'CAF' },
  { code: 'ECU', name: 'Ecuador',       flag_code: 'ec', group_name: 'E', fifa_rank: 31,  continent: 'CONMEBOL' },
  // Grupo F
  { code: 'NED', name: 'Netherlands',   flag_code: 'nl', group_name: 'F', fifa_rank: 7,   continent: 'UEFA' },
  { code: 'JPN', name: 'Japan',         flag_code: 'jp', group_name: 'F', fifa_rank: 18,  continent: 'AFC' },
  { code: 'SWE', name: 'Sweden',        flag_code: 'se', group_name: 'F', fifa_rank: 28,  continent: 'UEFA' },
  { code: 'TUN', name: 'Tunisia',       flag_code: 'tn', group_name: 'F', fifa_rank: 41,  continent: 'CAF' },
  // Grupo G
  { code: 'BEL', name: 'Belgium',       flag_code: 'be', group_name: 'G', fifa_rank: 3,   continent: 'UEFA' },
  { code: 'EGY', name: 'Egypt',         flag_code: 'eg', group_name: 'G', fifa_rank: 36,  continent: 'CAF' },
  { code: 'IRN', name: 'Iran',          flag_code: 'ir', group_name: 'G', fifa_rank: 20,  continent: 'AFC' },
  { code: 'NZL', name: 'New Zealand',   flag_code: 'nz', group_name: 'G', fifa_rank: 104, continent: 'OFC' },
  // Grupo H
  { code: 'ESP', name: 'Spain',         flag_code: 'es', group_name: 'H', fifa_rank: 8,   continent: 'UEFA' },
  { code: 'CPV', name: 'Cabo Verde',    flag_code: 'cv', group_name: 'H', fifa_rank: 65,  continent: 'CAF' },
  { code: 'KSA', name: 'Saudi Arabia',  flag_code: 'sa', group_name: 'H', fifa_rank: 53,  continent: 'AFC' },
  { code: 'URU', name: 'Uruguay',       flag_code: 'uy', group_name: 'H', fifa_rank: 11,  continent: 'CONMEBOL' },
  // Grupo I
  { code: 'FRA', name: 'France',        flag_code: 'fr', group_name: 'I', fifa_rank: 2,   continent: 'UEFA' },
  { code: 'SEN', name: 'Senegal',       flag_code: 'sn', group_name: 'I', fifa_rank: 17,  continent: 'CAF' },
  { code: 'IRQ', name: 'Iraq',          flag_code: 'iq', group_name: 'I', fifa_rank: 58,  continent: 'AFC' },
  { code: 'NOR', name: 'Norway',        flag_code: 'no', group_name: 'I', fifa_rank: 47,  continent: 'UEFA' },
  // Grupo J
  { code: 'ARG', name: 'Argentina',     flag_code: 'ar', group_name: 'J', fifa_rank: 1,   continent: 'CONMEBOL' },
  { code: 'ALG', name: 'Algeria',       flag_code: 'dz', group_name: 'J', fifa_rank: 43,  continent: 'CAF' },
  { code: 'AUT', name: 'Austria',       flag_code: 'at', group_name: 'J', fifa_rank: 25,  continent: 'UEFA' },
  { code: 'JOR', name: 'Jordan',        flag_code: 'jo', group_name: 'J', fifa_rank: 71,  continent: 'AFC' },
  // Grupo K
  { code: 'POR', name: 'Portugal',      flag_code: 'pt', group_name: 'K', fifa_rank: 6,   continent: 'UEFA' },
  { code: 'COD', name: 'Congo DR',      flag_code: 'cd', group_name: 'K', fifa_rank: 61,  continent: 'CAF' },
  { code: 'UZB', name: 'Uzbekistan',    flag_code: 'uz', group_name: 'K', fifa_rank: 66,  continent: 'AFC' },
  { code: 'COL', name: 'Colombia',      flag_code: 'co', group_name: 'K', fifa_rank: 14,  continent: 'CONMEBOL' },
  // Grupo L
  { code: 'ENG', name: 'England',       flag_code: 'gb-eng', group_name: 'L', fifa_rank: 4, continent: 'UEFA' },
  { code: 'CRO', name: 'Croatia',       flag_code: 'hr', group_name: 'L', fifa_rank: 10,  continent: 'UEFA' },
  { code: 'GHA', name: 'Ghana',         flag_code: 'gh', group_name: 'L', fifa_rank: 64,  continent: 'CAF' },
  { code: 'PAN', name: 'Panama',        flag_code: 'pa', group_name: 'L', fifa_rank: 44,  continent: 'CONCACAF' },
];

// De-duplicate by code
const TEAMS_MAP = new Map<string, typeof CANONICAL_TEAMS[0]>();
for (const t of CANONICAL_TEAMS) {
  TEAMS_MAP.set(t.code, t);
}
const UNIQUE_TEAMS = Array.from(TEAMS_MAP.values());

// ============================================================
// MAPEO: Nombre del feed → Código canónico en BD
// ============================================================
const FEED_NAME_TO_CODE: Record<string, string> = {
  // Grupo A
  'Mexico':                 'MEX',
  'South Africa':           'RSA',
  'Korea Republic':         'KOR',
  'Czechia':                'CZE',
  // Grupo B
  'Canada':                 'CAN',
  'Bosnia and Herzegovina': 'BIH',
  'Qatar':                  'QAT',
  'Switzerland':            'SUI',
  // Grupo C
  'Brazil':                 'BRA',
  'Morocco':                'MAR',
  'Haiti':                  'HTI',
  'Scotland':               'SCO',
  // Grupo D
  'USA':                    'USA',
  'Paraguay':               'PRY',
  'Australia':              'AUS',
  'Türkiye':                'TUR',
  'Turkey':                 'TUR',
  // Grupo E
  'Germany':                'GER',
  'Curaçao':                'CUW',
  "Côte d'Ivoire":          'CIV',
  'Ecuador':                'ECU',
  // Grupo F
  'Netherlands':            'NED',
  'Japan':                  'JPN',
  'Sweden':                 'SWE',
  'Tunisia':                'TUN',
  // Grupo G
  'Belgium':                'BEL',
  'Egypt':                  'EGY',
  'IR Iran':                'IRN',
  'Iran':                   'IRN',
  'New Zealand':            'NZL',
  // Grupo H
  'Spain':                  'ESP',
  'Cabo Verde':             'CPV',
  'Saudi Arabia':           'KSA',
  'Uruguay':                'URU',
  // Grupo I
  'France':                 'FRA',
  'Senegal':                'SEN',
  'Iraq':                   'IRQ',
  'Norway':                 'NOR',
  // Grupo J
  'Argentina':              'ARG',
  'Algeria':                'ALG',
  'Austria':                'AUT',
  'Jordan':                 'JOR',
  // Grupo K
  'Portugal':               'POR',
  'Congo DR':               'COD',
  'Uzbekistan':             'UZB',
  'Colombia':               'COL',
  // Grupo L
  'England':                'ENG',
  'Croatia':                'CRO',
  'Ghana':                  'GHA',
  'Panama':                 'PAN',
};

// ============================================================
// MAPEO: Location del feed → ID del estadio
// ============================================================
const LOCATION_TO_STADIUM_ID: Record<string, string> = {
  'Mexico City Stadium':          '10000000-0000-0000-0000-000000000001',
  'New York/New Jersey Stadium':  '10000000-0000-0000-0000-000000000002',
  'Dallas Stadium':               '10000000-0000-0000-0000-000000000003',
  'Kansas City Stadium':          '10000000-0000-0000-0000-000000000004',
  'Houston Stadium':              '10000000-0000-0000-0000-000000000005',
  'Atlanta Stadium':              '10000000-0000-0000-0000-000000000006',
  'Los Angeles Stadium':          '10000000-0000-0000-0000-000000000007',
  'Philadelphia Stadium':         '10000000-0000-0000-0000-000000000008',
  'Seattle Stadium':              '10000000-0000-0000-0000-000000000009',
  'San Francisco Bay Area Stadium': '10000000-0000-0000-0000-000000000010',
  'Boston Stadium':               '10000000-0000-0000-0000-000000000011',
  'Miami Stadium':                '10000000-0000-0000-0000-000000000012',
  'BC Place Vancouver':           '10000000-0000-0000-0000-000000000013',
  'Monterrey Stadium':            '10000000-0000-0000-0000-000000000014',
  'Guadalajara Stadium':          '10000000-0000-0000-0000-000000000015',
  'Toronto Stadium':              '10000000-0000-0000-0000-000000000016',
};

const ROUND_MAP: Record<number, string> = {
  1: 'Group Stage', 2: 'Group Stage', 3: 'Group Stage',
  4: 'Round of 32', 5: 'Round of 16', 6: 'Quarterfinals',
  7: 'Semifinals', 8: 'Final',
};

const CANONICAL_CODES = new Set(UNIQUE_TEAMS.map(t => t.code));

async function runRepair() {
  console.log('================================================================');
  console.log('  REPARACIÓN DE INTEGRIDAD DE DATOS — WC2026');
  console.log('================================================================\n');

  // ----------------------------------------------------------
  // PASO 1: Eliminar TODOS los partidos actuales (todos NULL)
  // ----------------------------------------------------------
  console.log('PASO 1: Eliminando todos los partidos (100% con FKs nulas)...');
  const { error: delMatchesErr } = await supabase
    .from('matches')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // condición siempre verdadera

  if (delMatchesErr) {
    console.error('ERROR eliminando partidos:', delMatchesErr.message);
    process.exit(1);
  }
  console.log('✓ Todos los partidos eliminados.\n');

  // ----------------------------------------------------------
  // PASO 2: Eliminar equipos que NO sean de los 48 canónicos
  // ----------------------------------------------------------
  console.log('PASO 2: Eliminando equipos duplicados/extra (conservar 48 canónicos)...');
  const canonicalCodesArray = Array.from(CANONICAL_CODES);

  const { error: delTeamsErr } = await supabase
    .from('teams')
    .delete()
    .not('code', 'in', `(${canonicalCodesArray.map(c => `"${c}"`).join(',')})` as any);

  // Si el método anterior no funciona, intentar con in:
  const { data: allTeams } = await supabase.from('teams').select('id, code');
  const teamsToDelete = (allTeams || []).filter(t => !CANONICAL_CODES.has(t.code));

  if (teamsToDelete.length > 0) {
    const idsToDelete = teamsToDelete.map(t => t.id);
    const { error: delErr } = await supabase
      .from('teams')
      .delete()
      .in('id', idsToDelete);
    if (delErr) {
      console.error('ERROR eliminando equipos extra:', delErr.message);
    } else {
      console.log(`✓ ${teamsToDelete.length} equipos duplicados/extra eliminados.`);
    }
  } else {
    console.log('✓ No hay equipos extra que eliminar.');
  }

  // ----------------------------------------------------------
  // PASO 3: Upsert los 48 equipos canónicos (usando code como conflicto)
  // ----------------------------------------------------------
  console.log('\nPASO 3: Upsert de los 48 equipos canónicos con metadatos correctos...');
  let teamsOk = 0;
  let teamsFail = 0;
  
  for (const team of UNIQUE_TEAMS) {
    const { error } = await supabase
      .from('teams')
      .upsert({
        code: team.code,
        name: team.name,
        flag_code: team.flag_code,
        group_name: team.group_name,
        fifa_rank: team.fifa_rank,
        continent: team.continent,
        recent_form: [],
        streak: '0D',
        played: 0,
        points: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
      }, { onConflict: 'code' });
    
    if (error) {
      console.error(`  FAIL upsert team ${team.code}:`, error.message);
      teamsFail++;
    } else {
      teamsOk++;
    }
  }
  console.log(`✓ Equipos: ${teamsOk} OK, ${teamsFail} errores.\n`);

  // ----------------------------------------------------------
  // PASO 4: Eliminar estadios duplicados (mantener los 16 del seed)
  // ----------------------------------------------------------
  console.log('PASO 4: Limpiando estadios duplicados...');
  const seedStadiumIds = Array.from({ length: 16 }, (_, i) =>
    `10000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`
  );

  const { data: allStadiums } = await supabase.from('stadiums').select('id, name');
  const stadiumsToDelete = (allStadiums || []).filter(s => !seedStadiumIds.includes(s.id));

  if (stadiumsToDelete.length > 0) {
    const { error } = await supabase
      .from('stadiums')
      .delete()
      .in('id', stadiumsToDelete.map(s => s.id));
    if (error) {
      console.error('ERROR eliminando estadios duplicados:', error.message);
    } else {
      console.log(`✓ ${stadiumsToDelete.length} estadios duplicados eliminados.`);
    }
  } else {
    console.log('✓ No hay estadios duplicados que eliminar.');
  }

  // ----------------------------------------------------------
  // PASO 5: Construir mapa code → UUID real en BD
  // ----------------------------------------------------------
  console.log('\nPASO 5: Construyendo mapa de IDs reales...');
  const { data: teamsInDb, error: fetchTeamsErr } = await supabase
    .from('teams')
    .select('id, code, name');
  
  if (fetchTeamsErr || !teamsInDb) {
    console.error('ERROR fetching teams:', fetchTeamsErr?.message);
    process.exit(1);
  }

  const CODE_TO_ID: Record<string, string> = {};
  for (const t of teamsInDb) {
    CODE_TO_ID[t.code] = t.id;
  }
  console.log(`✓ Mapa construido con ${Object.keys(CODE_TO_ID).length} equipos.`);

  // ----------------------------------------------------------
  // PASO 6: Descargar el feed real y reinsertar partidos
  // ----------------------------------------------------------
  console.log('\nPASO 6: Descargando fixtures del feed fixturedownload.com...');
  const res = await fetch('https://fixturedownload.com/feed/json/fifa-world-cup-2026', {
    headers: { 'User-Agent': 'WC2026-Tracker/1.0' }
  });
  
  if (!res.ok) {
    console.error(`ERROR: fixturedownload.com respondió HTTP ${res.status}`);
    process.exit(1);
  }

  const rawFixtures: any[] = await res.json();
  console.log(`✓ ${rawFixtures.length} fixtures descargados del feed.`);

  // Construir registros de partidos
  let matchesInserted = 0;
  let matchesFailed = 0;
  let nullHomeTeam = 0;
  let nullAwayTeam = 0;
  let nullStadium = 0;

  const matchRecords: any[] = rawFixtures.map((f: any) => {
    const homeName: string = f.HomeTeam || '';
    const awayName: string = f.AwayTeam || '';
    const location: string = f.Location || '';
    const roundNum: number = f.RoundNumber || 1;
    const grp: string = f.Group || '';
    const gLetter = grp.startsWith('Group ') ? grp.replace('Group ', '') : null;

    const homeCode = FEED_NAME_TO_CODE[homeName];
    const awayCode = FEED_NAME_TO_CODE[awayName];

    const homeId = homeCode ? CODE_TO_ID[homeCode] || null : null;
    const awayId = awayCode ? CODE_TO_ID[awayCode] || null : null;
    const stadiumId = LOCATION_TO_STADIUM_ID[location] || null;

    if (!homeId && homeName && homeName !== 'To be announced' && !/^\d/.test(homeName)) nullHomeTeam++;
    if (!awayId && awayName && awayName !== 'To be announced' && !/^\d/.test(awayName)) nullAwayTeam++;
    if (!stadiumId) nullStadium++;

    const hs = f.HomeTeamScore;
    const aws = f.AwayTeamScore;

    return {
      home_team_id: homeId,
      away_team_id: awayId,
      stadium_id: stadiumId,
      date: f.DateUtc?.replace(' ', 'T').replace('Z', '+00:00') || null,
      group_name: gLetter,
      stage: ROUND_MAP[roundNum] || 'Group Stage',
      status: (hs !== null && hs !== undefined && aws !== null && aws !== undefined) ? 'finished' : 'scheduled',
      home_score: hs ?? null,
      away_score: aws ?? null,
      api_id: f.MatchNumber,
    };
  });

  console.log(`  Previsualización: ${nullHomeTeam} home_team NULLs, ${nullAwayTeam} away_team NULLs, ${nullStadium} stadium NULLs`);
  console.log(`  Insertando ${matchRecords.length} partidos en lotes...`);

  // Insertar en lotes de 20
  const batchSize = 20;
  for (let i = 0; i < matchRecords.length; i += batchSize) {
    const batch = matchRecords.slice(i, i + batchSize);
    const { error } = await supabase.from('matches').insert(batch);
    if (error) {
      console.error(`  ERROR en lote ${i}-${i + batchSize}:`, error.message);
      matchesFailed += batch.length;
    } else {
      matchesInserted += batch.length;
    }
  }

  console.log(`✓ Partidos: ${matchesInserted} insertados, ${matchesFailed} errores.\n`);

  // ----------------------------------------------------------
  // PASO 7: VALIDACIÓN FINAL
  // ----------------------------------------------------------
  console.log('================================================================');
  console.log('  VALIDACIÓN FINAL');
  console.log('================================================================');

  const { data: finalTeams } = await supabase.from('teams').select('id, code, name, group_name, fifa_rank, continent');
  const { data: finalStadiums } = await supabase.from('stadiums').select('id, name, city');
  const { data: finalMatches } = await supabase.from('matches').select('id, home_team_id, away_team_id, stadium_id, stage, status');

  const teams = finalTeams || [];
  const stadiums = finalStadiums || [];
  const matches = finalMatches || [];

  const groupStageMatches = matches.filter(m => m.stage === 'Group Stage');
  const matchesNullHome = groupStageMatches.filter(m => !m.home_team_id).length;
  const matchesNullAway = groupStageMatches.filter(m => !m.away_team_id).length;
  const matchesNullStadium = matches.filter(m => !m.stadium_id).length;
  const teamsWithNullRank = teams.filter(t => !t.fifa_rank).length;
  const teamsWithNullGroup = teams.filter(t => !t.group_name).length;

  console.log(`\n📊 EQUIPOS:      ${teams.length} (objetivo: 48)`);
  console.log(`📊 ESTADIOS:     ${stadiums.length} (objetivo: 16)`);
  console.log(`📊 PARTIDOS:     ${matches.length} (objetivo: 104)`);
  console.log(`   Fase Grupos:  ${groupStageMatches.length}`);
  console.log(`   Eliminación:  ${matches.length - groupStageMatches.length}`);
  console.log(`\n🔍 NULLs críticos (fase de grupos):`);
  console.log(`   home_team_id NULL:  ${matchesNullHome}/${groupStageMatches.length}`);
  console.log(`   away_team_id NULL:  ${matchesNullAway}/${groupStageMatches.length}`);
  console.log(`   stadium_id NULL:    ${matchesNullStadium}/${matches.length}`);
  console.log(`\n🔍 Equipos con datos faltantes:`);
  console.log(`   Sin fifa_rank:  ${teamsWithNullRank}/${teams.length}`);
  console.log(`   Sin grupo:      ${teamsWithNullGroup}/${teams.length}`);

  const groupStageOk = groupStageMatches.filter(m => m.home_team_id && m.away_team_id).length;
  const pctOk = groupStageMatches.length > 0 ? ((groupStageOk / groupStageMatches.length) * 100).toFixed(1) : '0';
  
  console.log(`\n✅ JOINS EXITOSOS (fase grupos): ${groupStageOk}/${groupStageMatches.length} (${pctOk}%)`);

  if (matchesNullHome === 0 && matchesNullAway === 0) {
    console.log('\n🎉 ÉXITO: La UI debería mostrar todos los partidos de fase de grupos.');
  } else {
    console.log('\n⚠️  ATENCIÓN: Aún hay NULLs en FKs. Revisar FEED_NAME_TO_CODE mapping.');
    // Show which names are unmapped
    const unmapped = new Set<string>();
    rawFixtures.forEach(f => {
      const rn = f.RoundNumber || 0;
      if (rn <= 3) {
        if (f.HomeTeam && !FEED_NAME_TO_CODE[f.HomeTeam]) unmapped.add(`HOME: ${f.HomeTeam}`);
        if (f.AwayTeam && !FEED_NAME_TO_CODE[f.AwayTeam]) unmapped.add(`AWAY: ${f.AwayTeam}`);
      }
    });
    if (unmapped.size > 0) {
      console.log('   Nombres sin mapear:', Array.from(unmapped).join(', '));
    }
  }
}

runRepair().catch(err => {
  console.error('ERROR FATAL:', err);
  process.exit(1);
});
