/**
 * Fix: Completar 48 equipos exactos con asignaciones de grupo correctas
 *
 * Cambios:
 * 1. SRB → CZE (Czechia) en Grupo A — mantiene FKs de partidos intactas
 * 2. KOR → group_name = 'A' (ya tiene 3 partidos del Grupo A)
 * 3. NZL → group_name = 'G' (grupo real del feed)
 * 4. SWE → group_name = 'F' (grupo real del feed)
 * 5. INSERT BIH (Bosnia y Herzegovina) en Grupo B → equipo #48
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function fix48Teams() {
  console.log('================================================================');
  console.log('  COMPLETAR 48 EQUIPOS EXACTOS — WC2026');
  console.log('================================================================\n');

  const results: { step: string; ok: boolean; detail: string }[] = [];

  // ----------------------------------------------------------
  // PASO 1: Renombrar SRB → CZE (Czechia)
  // SRB era un proxy; sus 3 partidos del Grupo A ahora pertenecen a Czechia
  // No se tocan las FKs de matches (el UUID del registro no cambia)
  // ----------------------------------------------------------
  console.log('Paso 1: SRB → CZE (Czechia), Grupo A...');
  const { error: e1 } = await supabase
    .from('teams')
    .update({
      code:       'CZE',
      name:       'Czechia',
      flag_code:  'cz',
      fifa_rank:  37,
      continent:  'UEFA',
      group_name: 'A',
    })
    .eq('code', 'SRB');
  results.push({ step: 'SRB → CZE', ok: !e1, detail: e1?.message || 'OK' });
  console.log(e1 ? `  ❌ ${e1.message}` : '  ✅ SRB renombrado a CZE');

  // ----------------------------------------------------------
  // PASO 2: Mover KOR al Grupo A (grupo real de Korea Republic)
  // KOR ya tiene 3 partidos del Grupo A — solo corregir group_name
  // ----------------------------------------------------------
  console.log('\nPaso 2: KOR → group_name = A...');
  const { error: e2 } = await supabase
    .from('teams')
    .update({ group_name: 'A' })
    .eq('code', 'KOR');
  results.push({ step: 'KOR → Grupo A', ok: !e2, detail: e2?.message || 'OK' });
  console.log(e2 ? `  ❌ ${e2.message}` : '  ✅ KOR movido al Grupo A');

  // ----------------------------------------------------------
  // PASO 3: Mover NZL al Grupo G (grupo real del feed)
  // Feed Grupo G: Belgium, Egypt, IR Iran, New Zealand
  // ----------------------------------------------------------
  console.log('\nPaso 3: NZL → group_name = G...');
  const { error: e3 } = await supabase
    .from('teams')
    .update({ group_name: 'G' })
    .eq('code', 'NZL');
  results.push({ step: 'NZL → Grupo G', ok: !e3, detail: e3?.message || 'OK' });
  console.log(e3 ? `  ❌ ${e3.message}` : '  ✅ NZL movido al Grupo G');

  // ----------------------------------------------------------
  // PASO 4: Mover SWE al Grupo F (grupo real del feed)
  // Feed Grupo F: Japan, Netherlands, Sweden, Tunisia
  // ----------------------------------------------------------
  console.log('\nPaso 4: SWE → group_name = F...');
  const { error: e4 } = await supabase
    .from('teams')
    .update({ group_name: 'F' })
    .eq('code', 'SWE');
  results.push({ step: 'SWE → Grupo F', ok: !e4, detail: e4?.message || 'OK' });
  console.log(e4 ? `  ❌ ${e4.message}` : '  ✅ SWE movido al Grupo F');

  // ----------------------------------------------------------
  // PASO 5: Insertar BIH (Bosnia y Herzegovina) — EQUIPO #48
  // Feed Grupo B: Bosnia and Herzegovina, Canada, Qatar, Switzerland
  // ----------------------------------------------------------
  console.log('\nPaso 5: INSERT BIH (Bosnia y Herzegovina), Grupo B...');
  const { error: e5 } = await supabase
    .from('teams')
    .insert({
      code:            'BIH',
      name:            'Bosnia and Herzegovina',
      flag_code:       'ba',
      group_name:      'B',
      fifa_rank:       62,
      continent:       'UEFA',
      recent_form:     [],
      streak:          '0D',
      played:          0,
      points:          0,
      goals_for:       0,
      goals_against:   0,
      goal_difference: 0,
      api_id:          null,
    });
  results.push({ step: 'INSERT BIH', ok: !e5, detail: e5?.message || 'OK' });
  console.log(e5 ? `  ❌ ${e5.message}` : '  ✅ BIH insertado (equipo #48)');

  // ----------------------------------------------------------
  // VALIDACIÓN FINAL
  // ----------------------------------------------------------
  console.log('\n================================================================');
  console.log('  VALIDACIÓN FINAL');
  console.log('================================================================\n');

  const { data: allTeams } = await supabase
    .from('teams')
    .select('code, name, group_name, fifa_rank, continent')
    .order('group_name')
    .order('name');

  const teams = allTeams || [];
  const groupCount: Record<string, { count: number; teams: string[] }> = {};

  for (const t of teams) {
    const g = t.group_name || '?';
    if (!groupCount[g]) groupCount[g] = { count: 0, teams: [] };
    groupCount[g].count++;
    groupCount[g].teams.push(`${t.code}(${t.name})`);
  }

  let allGroupsHave4 = true;
  for (const g of 'ABCDEFGHIJKL'.split('')) {
    const info = groupCount[g] || { count: 0, teams: [] };
    const ok = info.count === 4;
    if (!ok) allGroupsHave4 = false;
    const icon = ok ? '✅' : '❌';
    console.log(`  Grupo ${g}: ${info.count}/4 ${icon}  → ${info.teams.join(', ')}`);
  }

  console.log(`\n📊 Total equipos: ${teams.length} (objetivo: 48) ${teams.length === 48 ? '✅' : '❌'}`);
  console.log(`📊 Todos los grupos con 4: ${allGroupsHave4 ? '✅' : '❌'}`);

  // Resumen de pasos
  console.log('\n--- RESUMEN DE PASOS ---');
  for (const r of results) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.step}: ${r.detail}`);
  }

  // Verificar participación en partidos — CZE y BIH
  const cze = teams.find(t => t.code === 'CZE');
  const bih = teams.find(t => t.code === 'BIH');

  if (cze) {
    const { data: czeMat } = await supabase
      .from('matches')
      .select('id, group_name, stage')
      .or(`home_team_id.eq.${(allTeams!.find(t => t.code === 'CZE') as any)?.id},away_team_id.eq.${(allTeams!.find(t => t.code === 'CZE') as any)?.id}`);
    console.log(`\n  CZE (Czechia) partidos: ${(czeMat||[]).length} (3 del Grupo A heredados de SRB)`);
  }

  if (bih) {
    console.log(`  BIH (Bosnia) partidos: 0 (equipo recién insertado, pendiente sync)`);
  }

  if (teams.length === 48 && allGroupsHave4) {
    console.log('\n🎉 COMPLETADO: 48 equipos exactos, 12 grupos con 4 equipos cada uno.');
  }
}

fix48Teams().catch(console.error);
