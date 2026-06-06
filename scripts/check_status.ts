import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Feed real de fixturedownload.com — 48 equipos por grupo
const FEED_TEAMS_BY_GROUP: Record<string, string[]> = {
  A: ['Czechia', 'Korea Republic', 'Mexico', 'South Africa'],
  B: ['Bosnia and Herzegovina', 'Canada', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Haiti', 'Morocco', 'Scotland'],
  D: ['Australia', 'Paraguay', 'Türkiye', 'USA'],
  E: ['Curaçao', "Côte d'Ivoire", 'Ecuador', 'Germany'],
  F: ['Japan', 'Netherlands', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'],
  H: ['Cabo Verde', 'Saudi Arabia', 'Spain', 'Uruguay'],
  I: ['France', 'Iraq', 'Norway', 'Senegal'],
  J: ['Algeria', 'Argentina', 'Austria', 'Jordan'],
  K: ['Colombia', 'Congo DR', 'Portugal', 'Uzbekistan'],
  L: ['Croatia', 'England', 'Ghana', 'Panama'],
};

// Mapeo inverso: feed name → canonical code usado en repair script
const FEED_NAME_TO_CODE: Record<string, string> = {
  'Czechia': 'SRB', 'Korea Republic': 'KOR', 'Mexico': 'MEX', 'South Africa': 'RSA',
  'Bosnia and Herzegovina': 'SWE', 'Canada': 'CAN', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Haiti': 'JPN', 'Morocco': 'MAR', 'Scotland': 'JPN',
  'Australia': 'AUS', 'Paraguay': 'IRQ', 'Türkiye': 'DEN', 'USA': 'USA',
  "Curaçao": 'VEN', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU', 'Germany': 'GER',
  'Japan': 'JPN', 'Netherlands': 'NED', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'IR Iran': 'IRN', 'New Zealand': 'NZL',
  'Cabo Verde': 'MLI', 'Saudi Arabia': 'KSA', 'Spain': 'ESP', 'Uruguay': 'URU',
  'France': 'FRA', 'Iraq': 'IRQ', 'Norway': 'PER', 'Senegal': 'SEN',
  'Algeria': 'ALG', 'Argentina': 'ARG', 'Austria': 'CMR', 'Jordan': 'CRC',
  'Colombia': 'COL', 'Congo DR': 'COL', 'Portugal': 'POR', 'Uzbekistan': 'JAM',
  'Croatia': 'CRO', 'England': 'ENG', 'Ghana': 'GHA', 'Panama': 'PAN',
};

async function audit() {
  // 1. Obtener todos los equipos de la BD
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, code, name, group_name, fifa_rank, continent, api_id')
    .order('group_name')
    .order('name');

  if (error) { console.error('DB Error:', error.message); process.exit(1); }
  const dbTeams = teams || [];

  console.log('================================================================');
  console.log('  AUDITORÍA DE EQUIPO FALTANTE — WC2026');
  console.log('================================================================\n');

  // 2. Mostrar estado actual de BD por grupo
  console.log('--- EQUIPOS EN BD ---');
  let prevGroup = '';
  for (const t of dbTeams) {
    if (t.group_name !== prevGroup) {
      console.log(`\nGrupo ${t.group_name}:`);
      prevGroup = t.group_name;
    }
    const apiIdStr = t.api_id ? String(t.api_id) : 'NULL';
    console.log(`  ${t.code.padEnd(4)} ${t.name.padEnd(25)} FIFA:${String(t.fifa_rank||'?').padStart(4)} ${(t.continent||'?').padEnd(10)} api_id:${apiIdStr}`);
  }
  console.log(`\nTotal BD: ${dbTeams.length} equipos`);

  // 3. Analizar qué slots de feed están mapeados al mismo código
  console.log('\n--- ANÁLISIS DE COLISIONES DE MAPEO ---');
  const collisionMap: Record<string, string[]> = {};
  for (const [feedName, code] of Object.entries(FEED_NAME_TO_CODE)) {
    if (!collisionMap[code]) collisionMap[code] = [];
    collisionMap[code].push(feedName);
  }
  const collisions = Object.entries(collisionMap).filter(([_, names]) => names.length > 1);
  for (const [code, names] of collisions) {
    console.log(`  Código ${code} recibe: ${names.join(', ')}`);
  }

  // 4. Identificar exactamente qué equipo no tiene representación única
  console.log('\n--- EQUIPOS DEL FEED SIN CÓDIGO ÚNICO EN BD ---');
  const codesUsedInFeed = new Set<string>();
  for (const [feedName, code] of Object.entries(FEED_NAME_TO_CODE)) {
    if (collisionMap[code]?.length > 1) {
      const allFeedNamesForCode = collisionMap[code];
      if (allFeedNamesForCode.indexOf(feedName) > 0) {
        console.log(`  ⚠️  "${feedName}" → comparte código ${code} con "${allFeedNamesForCode[0]}"`);
      }
    }
    codesUsedInFeed.add(code);
  }

  // 5. Códigos que existen en BD pero no tienen un feed name real propio
  const dbCodes = new Set(dbTeams.map(t => t.code));
  const orphanDbCodes = [...dbCodes].filter(c => !codesUsedInFeed.has(c));
  if (orphanDbCodes.length > 0) {
    console.log(`\n  Códigos en BD sin uso real en feed: ${orphanDbCodes.join(', ')}`);
  }

  // 6. Encontrar exactamente el 48° equipo que falta
  console.log('\n--- IDENTIFICACIÓN DEL EQUIPO FALTANTE ---');
  
  // Todos los códigos del feed (únicos por equipo real)
  const feedCodesNeeded = new Set<string>();
  for (const group of Object.values(FEED_TEAMS_BY_GROUP)) {
    for (const teamName of group) {
      const code = FEED_NAME_TO_CODE[teamName];
      if (code) feedCodesNeeded.add(code);
      else console.log(`  ❌ Sin mapeo para: "${teamName}"`);
    }
  }
  console.log(`Códigos únicos en feed (después de mapeo): ${feedCodesNeeded.size}`);

  // Diferencia: códigos en feed que no están en BD
  const missingFromDb = [...feedCodesNeeded].filter(c => !dbCodes.has(c));
  if (missingFromDb.length > 0) {
    console.log(`\n❌ FALTAN EN BD: ${missingFromDb.join(', ')}`);
  }

  // Diferencia: códigos en BD que no corresponden a un equipo real del feed
  const extraInDb = [...dbCodes].filter(c => !feedCodesNeeded.has(c));
  if (extraInDb.length > 0) {
    console.log(`\n⚠️  EN BD PERO NO EN FEED REAL: ${extraInDb.join(', ')}`);
    for (const code of extraInDb) {
      const team = dbTeams.find(t => t.code === code);
      if (team) console.log(`   ${code}: "${team.name}" (Grupo ${team.group_name}, FIFA #${team.fifa_rank})`);
    }
  }

  // 7. Verificar partidos del equipo NGA (Nigeria) — fue añadido en el último repair
  const nga = dbTeams.find(t => t.code === 'NGA');
  if (nga) {
    const { data: ngaMatches } = await supabase
      .from('matches')
      .select('id, stage, group_name, home_team_id, away_team_id')
      .or(`home_team_id.eq.${nga.id},away_team_id.eq.${nga.id}`);
    console.log(`\n  NGA (Nigeria) en BD: ${(ngaMatches||[]).length} partidos asignados`);
  }

  // 8. Conteo por grupo en BD
  console.log('\n--- CONTEO POR GRUPO EN BD ---');
  const groupCount: Record<string, number> = {};
  for (const t of dbTeams) {
    const g = t.group_name || 'SIN_GRUPO';
    groupCount[g] = (groupCount[g] || 0) + 1;
  }
  for (const g of 'ABCDEFGHIJKL'.split('')) {
    const count = groupCount[g] || 0;
    const feedCount = FEED_TEAMS_BY_GROUP[g]?.length || 0;
    const status = count === feedCount ? '✅' : '❌';
    console.log(`  Grupo ${g}: ${count}/4 en BD, ${feedCount}/4 en feed ${status}`);
  }

  // 9. Verificar partidos con IDs duplicados
  const { data: allMatches } = await supabase
    .from('matches')
    .select('id, group_name, stage, home_team_id, away_team_id')
    .eq('stage', 'Group Stage');

  const teamMatchCount: Record<string, number> = {};
  for (const m of allMatches || []) {
    if (m.home_team_id) teamMatchCount[m.home_team_id] = (teamMatchCount[m.home_team_id] || 0) + 1;
    if (m.away_team_id) teamMatchCount[m.away_team_id] = (teamMatchCount[m.away_team_id] || 0) + 1;
  }

  console.log('\n--- PARTICIPACIÓN EN PARTIDOS (fase grupos) ---');
  for (const t of dbTeams) {
    const count = teamMatchCount[t.id] || 0;
    const status = count === 3 ? '✅' : count === 0 ? '❌' : `⚠️ (${count})`;
    if (count !== 3) {
      console.log(`  ${t.code.padEnd(4)} ${t.name.padEnd(25)}: ${count} partidos ${status}`);
    }
  }

  const teamsWithNoMatches = dbTeams.filter(t => (teamMatchCount[t.id] || 0) === 0);
  console.log(`\n  Equipos en BD sin ningún partido en grupos: ${teamsWithNoMatches.length}`);
  for (const t of teamsWithNoMatches) {
    console.log(`  → ${t.code}: ${t.name} (Grupo ${t.group_name})`);
  }
}

audit().catch(console.error);
