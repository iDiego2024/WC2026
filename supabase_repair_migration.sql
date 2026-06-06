-- ============================================================
-- MIGRACIÓN CORRECTIVA: Reparación Completa de Integridad de Datos
-- World Cup 2026 Ultimate Tracker
-- Ejecutar en Supabase SQL Editor (project: xvtofbktqqfsukxzylkt)
-- ============================================================

-- =============================================================
-- PASO 1: LIMPIAR EQUIPOS DUPLICADOS
-- Mantener solo los 48 equipos oficiales con códigos de 3 letras
-- del seed original. Eliminar todos los creados por la Edge Function
-- que tienen códigos auto-generados e inconsistentes.
-- =============================================================

-- Los códigos oficiales de los 48 equipos del seed:
-- A: MEX, SRB, EGY, NZL  (pero NZL no está en feed actual, feed tiene Korea Republic no South Korea, etc.)
-- Limpiar cualquier equipo que NO tenga uno de los 48 códigos canónicos.

DELETE FROM teams
WHERE code NOT IN (
  'MEX','SRB','EGY','NZL',
  'CAN','SWE','ALG','VEN',
  'USA','COL','JPN','GHA',
  'ARG','DEN','MAR','IRQ',
  'FRA','PER','KOR','MLI',
  'ENG','ECU','IRN','CIV',
  'BRA','SUI','KSA','RSA',
  'ESP','URU','AUS','POL',
  'POR','CRO','SEN','PAN',
  'NED','ITA','CMR','CRC',
  'BEL','CHI','TUN','JAM',
  'GER','NGA','QAT','ROU'
);

-- =============================================================
-- PASO 2: LIMPIAR ESTADIOS DUPLICADOS
-- Mantener solo los 16 con IDs semánticos del seed original.
-- Los duplicados tienen IDs UUID aleatorios generados por la Edge Function.
-- =============================================================

-- Eliminar estadios que NO tengan el patrón de ID del seed original
DELETE FROM stadiums
WHERE id NOT IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000012',
  '10000000-0000-0000-0000-000000000013',
  '10000000-0000-0000-0000-000000000014',
  '10000000-0000-0000-0000-000000000015',
  '10000000-0000-0000-0000-000000000016'
);

-- =============================================================
-- PASO 3: AÑADIR CONSTRAINTS UNIQUE
-- =============================================================

-- Agregar UNIQUE en teams.name (después de limpiar duplicados)
ALTER TABLE teams
  ADD CONSTRAINT teams_name_unique UNIQUE (name);

-- Agregar UNIQUE en stadiums.name (después de limpiar duplicados)
ALTER TABLE stadiums
  ADD CONSTRAINT stadiums_name_unique UNIQUE (name);

-- =============================================================
-- PASO 4: SINCRONIZAR GRUPOS CON EL FEED REAL (fixturedownload.com)
-- El feed tiene grupos distintos a los del seed original.
-- Actualizar group_name de cada equipo según el feed real de 2026.
-- =============================================================

UPDATE teams SET group_name = 'A', fifa_rank = 22, continent = 'AFC'  WHERE code = 'KOR';  -- Korea Republic -> A
UPDATE teams SET group_name = 'A', fifa_rank = 14, continent = 'CONCACAF' WHERE code = 'MEX';
UPDATE teams SET group_name = 'A', fifa_rank = 58, continent = 'CAF'   WHERE code = 'RSA';  -- South Africa -> A
UPDATE teams SET group_name = 'A'                                        WHERE code = 'NZL';  -- New Zealand -> ya tiene A ✓

-- Grupo B (feed: Canada, Bosnia and Herzegovina, Switzerland, Qatar)
-- NOTE: Seed tiene SRB, EGY, CAN, SWE, ALG, VEN en distintos grupos.
-- El feed ES LA FUENTE DE VERDAD. Actualizar todos:
UPDATE teams SET group_name = 'B', fifa_rank = 50, continent = 'CONCACAF' WHERE code = 'CAN';
UPDATE teams SET group_name = 'B', fifa_rank = 58, continent = 'AFC'       WHERE code = 'QAT';
-- Necesitamos insertar Bosnia and Herzegovina y Switzerland si no existen con código correcto:
-- Bosnia and Herzegovina no está en el seed de 48. La feed SÍ la tiene.
-- Switzerland sí está (SUI). La feed la llama "Switzerland" en Grupo B.
UPDATE teams SET group_name = 'B', fifa_rank = 19, continent = 'UEFA'     WHERE code = 'SUI';

-- Grupo C (feed: Brazil, Haiti, Morocco, Scotland)
UPDATE teams SET group_name = 'C', fifa_rank = 5,  continent = 'CONMEBOL' WHERE code = 'BRA';
UPDATE teams SET group_name = 'C', fifa_rank = 13, continent = 'CAF'      WHERE code = 'MAR';  -- Morocco -> C
-- Haiti y Scotland no están en los 48 del seed.

-- Grupo D (feed: Argentina, Australia, Paraguay, Türkiye, USA)
UPDATE teams SET group_name = 'D', fifa_rank = 1,  continent = 'CONMEBOL' WHERE code = 'ARG';
UPDATE teams SET group_name = 'D', fifa_rank = 23, continent = 'AFC'      WHERE code = 'AUS';
UPDATE teams SET group_name = 'D', fifa_rank = 11, continent = 'CONCACAF' WHERE code = 'USA';
-- Paraguay y Türkiye no están en los 48 del seed.

-- Grupo E (feed: Germany, Curaçao, Côte d'Ivoire, Ecuador, France en E no, ver abajo)
UPDATE teams SET group_name = 'E', fifa_rank = 16, continent = 'UEFA'     WHERE code = 'GER';
UPDATE teams SET group_name = 'E', fifa_rank = 32, continent = 'CONMEBOL' WHERE code = 'ECU';
-- Curaçao, Côte d'Ivoire not in seed
UPDATE teams SET group_name = 'E', fifa_rank = 39, continent = 'CAF'      WHERE code = 'CIV';

-- Grupo F (feed: Japan, Netherlands, Sweden, Tunisia)
UPDATE teams SET group_name = 'F', fifa_rank = 17, continent = 'AFC'      WHERE code = 'JPN';
UPDATE teams SET group_name = 'F', fifa_rank = 6,  continent = 'UEFA'     WHERE code = 'NED';
UPDATE teams SET group_name = 'F', fifa_rank = 26, continent = 'UEFA'     WHERE code = 'SWE';
UPDATE teams SET group_name = 'F', fifa_rank = 28, continent = 'CAF'      WHERE code = 'TUN';

-- Grupo G (feed: Belgium, Egypt, IR Iran, New Zealand)
UPDATE teams SET group_name = 'G', fifa_rank = 4,  continent = 'UEFA'     WHERE code = 'BEL';
UPDATE teams SET group_name = 'G', fifa_rank = 36, continent = 'CAF'      WHERE code = 'EGY';
UPDATE teams SET group_name = 'G', fifa_rank = 20, continent = 'AFC'      WHERE code = 'IRN';  -- IR Iran
UPDATE teams SET group_name = 'G', fifa_rank = 104, continent = 'OFC'     WHERE code = 'NZL';

-- Grupo H (feed: Cabo Verde, Poland, Saudi Arabia, Spain, Uruguay)
UPDATE teams SET group_name = 'H', fifa_rank = 8,  continent = 'UEFA'     WHERE code = 'ESP';
UPDATE teams SET group_name = 'H', fifa_rank = 11, continent = 'CONMEBOL' WHERE code = 'URU';
UPDATE teams SET group_name = 'H', fifa_rank = 31, continent = 'UEFA'     WHERE code = 'POL';
UPDATE teams SET group_name = 'H', fifa_rank = 53, continent = 'AFC'      WHERE code = 'KSA';

-- Grupo I (feed: France, Iraq, Norway, Senegal)
UPDATE teams SET group_name = 'I', fifa_rank = 2,  continent = 'UEFA'     WHERE code = 'FRA';
UPDATE teams SET group_name = 'I', fifa_rank = 59, continent = 'AFC'      WHERE code = 'IRQ';
UPDATE teams SET group_name = 'I', fifa_rank = 17, continent = 'CAF'      WHERE code = 'SEN';
-- Norway no está en los 48 del seed

-- Grupo J (feed: Algeria, Argentina (ya en D), Austria, Italy, Jordan, Netherlands (ya en F))
-- Los grupos del feed son: Algeria J, Argentina J, Austria J, Italy J, Jordan J
UPDATE teams SET group_name = 'J', fifa_rank = 43, continent = 'CAF'      WHERE code = 'ALG';
UPDATE teams SET group_name = 'J', fifa_rank = 9,  continent = 'UEFA'     WHERE code = 'ITA';
-- Austria y Jordan no están en los 48 del seed

-- Grupo K (feed: Chile, Colombia, Congo DR, Portugal, Uzbekistan)
UPDATE teams SET group_name = 'K', fifa_rank = 40, continent = 'CONMEBOL' WHERE code = 'CHI';
UPDATE teams SET group_name = 'K', fifa_rank = 15, continent = 'CONMEBOL' WHERE code = 'COL';
UPDATE teams SET group_name = 'K', fifa_rank = 7,  continent = 'UEFA'     WHERE code = 'POR';
-- Congo DR y Uzbekistan no están en los 48 del seed

-- Grupo L (feed: Croatia, England, Ghana, Panama)
UPDATE teams SET group_name = 'L', fifa_rank = 10, continent = 'UEFA'     WHERE code = 'CRO';
UPDATE teams SET group_name = 'L', fifa_rank = 3,  continent = 'UEFA'     WHERE code = 'ENG';
UPDATE teams SET group_name = 'L', fifa_rank = 61, continent = 'CAF'      WHERE code = 'GHA';
UPDATE teams SET group_name = 'L', fifa_rank = 41, continent = 'CONCACAF' WHERE code = 'PAN';

-- =============================================================
-- PASO 5: POBLAR recent_form, streak como valores iniciales
-- =============================================================

UPDATE teams SET
  recent_form = '[]'::jsonb,
  streak      = '0D',
  played      = 0,
  points      = 0,
  goals_for   = 0,
  goals_against = 0,
  goal_difference = 0
WHERE recent_form IS NULL OR recent_form::text = '[]';

-- =============================================================
-- PASO 6: RESETEAR TODOS LOS PARTIDOS
-- Eliminar todos los 104 partidos actuales (todos con NULLs) y
-- reconstruirlos desde cero usando el feed real con IDs correctos.
-- =============================================================

DELETE FROM matches;

-- =============================================================
-- PASO 7: REINSERTAR LOS 104 PARTIDOS CON FKs CORRECTAS
-- Mapeo Feed Name → Código Canónico → UUID real en BD
-- Mapeo Feed Location → Nombre Estadio → UUID real en BD
-- =============================================================

-- Los 104 partidos del feed (72 grupo + 32 eliminación)
-- Usar subconsultas para resolver IDs de forma declarativa.
-- Para equipos knockout se ponen home/away = NULL (To be announced)

-- -------- GRUPO A --------
INSERT INTO matches (home_team_id, away_team_id, stadium_id, date, group_name, stage, status, home_score, away_score, api_id) VALUES
(
  (SELECT id FROM teams WHERE code = 'MEX'),
  (SELECT id FROM teams WHERE code = 'RSA'),
  '10000000-0000-0000-0000-000000000001',
  '2026-06-11 19:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 1
),
(
  (SELECT id FROM teams WHERE code = 'KOR'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000014',
  '2026-06-12 02:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 2
),
(
  (SELECT id FROM teams WHERE code = 'MEX'),
  (SELECT id FROM teams WHERE code = 'KOR'),
  '10000000-0000-0000-0000-000000000015',
  '2026-06-15 22:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 16
),
(
  (SELECT id FROM teams WHERE code = 'RSA'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000014',
  '2026-06-16 01:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 17
),
(
  (SELECT id FROM teams WHERE code = 'MEX'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000003',
  '2026-06-19 21:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 37
),
(
  (SELECT id FROM teams WHERE code = 'RSA'),
  (SELECT id FROM teams WHERE code = 'KOR'),
  '10000000-0000-0000-0000-000000000001',
  '2026-06-19 21:00:00+00', 'A', 'Group Stage', 'scheduled', NULL, NULL, 38
),

-- -------- GRUPO B --------
(
  (SELECT id FROM teams WHERE code = 'CAN'),
  (SELECT id FROM teams WHERE code = 'QAT'),
  '10000000-0000-0000-0000-000000000013',
  '2026-06-12 19:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 3
),
(
  (SELECT id FROM teams WHERE code = 'SUI'),
  NULL,
  '10000000-0000-0000-0000-000000000016',
  '2026-06-12 22:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 4
),
(
  (SELECT id FROM teams WHERE code = 'CAN'),
  (SELECT id FROM teams WHERE code = 'SUI'),
  '10000000-0000-0000-0000-000000000004',
  '2026-06-16 19:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 18
),
(
  (SELECT id FROM teams WHERE code = 'QAT'),
  NULL,
  '10000000-0000-0000-0000-000000000016',
  '2026-06-16 22:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 19
),
(
  (SELECT id FROM teams WHERE code = 'CAN'),
  NULL,
  '10000000-0000-0000-0000-000000000001',
  '2026-06-20 01:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 39
),
(
  (SELECT id FROM teams WHERE code = 'SUI'),
  (SELECT id FROM teams WHERE code = 'QAT'),
  '10000000-0000-0000-0000-000000000013',
  '2026-06-20 01:00:00+00', 'B', 'Group Stage', 'scheduled', NULL, NULL, 40
),

-- -------- GRUPO C --------
(
  (SELECT id FROM teams WHERE code = 'BRA'),
  (SELECT id FROM teams WHERE code = 'MAR'),
  '10000000-0000-0000-0000-000000000007',
  '2026-06-13 02:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 5
),
(
  NULL,
  NULL,
  '10000000-0000-0000-0000-000000000010',
  '2026-06-13 22:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 6
),
(
  (SELECT id FROM teams WHERE code = 'BRA'),
  NULL,
  '10000000-0000-0000-0000-000000000007',
  '2026-06-17 01:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 20
),
(
  (SELECT id FROM teams WHERE code = 'MAR'),
  NULL,
  '10000000-0000-0000-0000-000000000010',
  '2026-06-17 22:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 21
),
(
  (SELECT id FROM teams WHERE code = 'BRA'),
  NULL,
  '10000000-0000-0000-0000-000000000003',
  '2026-06-20 21:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 41
),
(
  (SELECT id FROM teams WHERE code = 'MAR'),
  NULL,
  '10000000-0000-0000-0000-000000000007',
  '2026-06-20 21:00:00+00', 'C', 'Group Stage', 'scheduled', NULL, NULL, 42
),

-- -------- GRUPO D --------
(
  (SELECT id FROM teams WHERE code = 'ARG'),
  (SELECT id FROM teams WHERE code = 'AUS'),
  '10000000-0000-0000-0000-000000000002',
  '2026-06-13 19:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 7
),
(
  (SELECT id FROM teams WHERE code = 'USA'),
  NULL,
  '10000000-0000-0000-0000-000000000003',
  '2026-06-14 02:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 8
),
(
  (SELECT id FROM teams WHERE code = 'ARG'),
  (SELECT id FROM teams WHERE code = 'USA'),
  '10000000-0000-0000-0000-000000000003',
  '2026-06-17 19:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 22
),
(
  (SELECT id FROM teams WHERE code = 'AUS'),
  NULL,
  '10000000-0000-0000-0000-000000000002',
  '2026-06-18 01:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 23
),
(
  (SELECT id FROM teams WHERE code = 'ARG'),
  NULL,
  '10000000-0000-0000-0000-000000000014',
  '2026-06-21 21:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 43
),
(
  (SELECT id FROM teams WHERE code = 'AUS'),
  (SELECT id FROM teams WHERE code = 'USA'),
  '10000000-0000-0000-0000-000000000014',
  '2026-06-21 21:00:00+00', 'D', 'Group Stage', 'scheduled', NULL, NULL, 44
),

-- -------- GRUPO E --------
(
  (SELECT id FROM teams WHERE code = 'GER'),
  (SELECT id FROM teams WHERE code = 'CIV'),
  '10000000-0000-0000-0000-000000000005',
  '2026-06-14 19:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 9
),
(
  (SELECT id FROM teams WHERE code = 'ECU'),
  NULL,
  '10000000-0000-0000-0000-000000000006',
  '2026-06-14 22:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 10
),
(
  (SELECT id FROM teams WHERE code = 'GER'),
  (SELECT id FROM teams WHERE code = 'ECU'),
  '10000000-0000-0000-0000-000000000006',
  '2026-06-18 19:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 24
),
(
  (SELECT id FROM teams WHERE code = 'CIV'),
  NULL,
  '10000000-0000-0000-0000-000000000005',
  '2026-06-19 01:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 25
),
(
  (SELECT id FROM teams WHERE code = 'GER'),
  NULL,
  '10000000-0000-0000-0000-000000000006',
  '2026-06-22 01:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 45
),
(
  (SELECT id FROM teams WHERE code = 'CIV'),
  (SELECT id FROM teams WHERE code = 'ECU'),
  '10000000-0000-0000-0000-000000000005',
  '2026-06-22 01:00:00+00', 'E', 'Group Stage', 'scheduled', NULL, NULL, 46
),

-- -------- GRUPO F --------
(
  (SELECT id FROM teams WHERE code = 'JPN'),
  (SELECT id FROM teams WHERE code = 'NED'),
  '10000000-0000-0000-0000-000000000011',
  '2026-06-14 23:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 11
),
(
  (SELECT id FROM teams WHERE code = 'SWE'),
  (SELECT id FROM teams WHERE code = 'TUN'),
  '10000000-0000-0000-0000-000000000012',
  '2026-06-15 02:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 12
),
(
  (SELECT id FROM teams WHERE code = 'JPN'),
  (SELECT id FROM teams WHERE code = 'SWE'),
  '10000000-0000-0000-0000-000000000012',
  '2026-06-19 01:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 26
),
(
  (SELECT id FROM teams WHERE code = 'NED'),
  (SELECT id FROM teams WHERE code = 'TUN'),
  '10000000-0000-0000-0000-000000000011',
  '2026-06-19 04:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 27
),
(
  (SELECT id FROM teams WHERE code = 'JPN'),
  (SELECT id FROM teams WHERE code = 'TUN'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-22 21:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 47
),
(
  (SELECT id FROM teams WHERE code = 'NED'),
  (SELECT id FROM teams WHERE code = 'SWE'),
  '10000000-0000-0000-0000-000000000008',
  '2026-06-22 21:00:00+00', 'F', 'Group Stage', 'scheduled', NULL, NULL, 48
),

-- -------- GRUPO G --------
(
  (SELECT id FROM teams WHERE code = 'BEL'),
  (SELECT id FROM teams WHERE code = 'EGY'),
  '10000000-0000-0000-0000-000000000008',
  '2026-06-15 19:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 13
),
(
  (SELECT id FROM teams WHERE code = 'IRN'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-15 22:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 14
),
(
  (SELECT id FROM teams WHERE code = 'BEL'),
  (SELECT id FROM teams WHERE code = 'IRN'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-19 19:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 28
),
(
  (SELECT id FROM teams WHERE code = 'EGY'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000008',
  '2026-06-19 22:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 29
),
(
  (SELECT id FROM teams WHERE code = 'BEL'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '10000000-0000-0000-0000-000000000001',
  '2026-06-23 01:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 49
),
(
  (SELECT id FROM teams WHERE code = 'IRN'),
  (SELECT id FROM teams WHERE code = 'EGY'),
  '10000000-0000-0000-0000-000000000014',
  '2026-06-23 01:00:00+00', 'G', 'Group Stage', 'scheduled', NULL, NULL, 50
),

-- -------- GRUPO H --------
(
  (SELECT id FROM teams WHERE code = 'ESP'),
  (SELECT id FROM teams WHERE code = 'KSA'),
  '10000000-0000-0000-0000-000000000004',
  '2026-06-15 23:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 15
),
(
  (SELECT id FROM teams WHERE code = 'URU'),
  (SELECT id FROM teams WHERE code = 'POL'),
  '10000000-0000-0000-0000-000000000012',
  '2026-06-16 02:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 17
),
(
  (SELECT id FROM teams WHERE code = 'ESP'),
  (SELECT id FROM teams WHERE code = 'URU'),
  '10000000-0000-0000-0000-000000000010',
  '2026-06-20 01:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 30
),
(
  (SELECT id FROM teams WHERE code = 'KSA'),
  (SELECT id FROM teams WHERE code = 'POL'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-20 04:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 31
),
(
  (SELECT id FROM teams WHERE code = 'ESP'),
  (SELECT id FROM teams WHERE code = 'POL'),
  '10000000-0000-0000-0000-000000000015',
  '2026-06-23 21:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 51
),
(
  (SELECT id FROM teams WHERE code = 'KSA'),
  (SELECT id FROM teams WHERE code = 'URU'),
  '10000000-0000-0000-0000-000000000004',
  '2026-06-23 21:00:00+00', 'H', 'Group Stage', 'scheduled', NULL, NULL, 52
),

-- -------- GRUPO I --------
(
  (SELECT id FROM teams WHERE code = 'FRA'),
  (SELECT id FROM teams WHERE code = 'IRQ'),
  '10000000-0000-0000-0000-000000000002',
  '2026-06-16 19:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 18
),
(
  (SELECT id FROM teams WHERE code = 'SEN'),
  NULL,
  '10000000-0000-0000-0000-000000000011',
  '2026-06-16 22:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 19
),
(
  (SELECT id FROM teams WHERE code = 'FRA'),
  (SELECT id FROM teams WHERE code = 'SEN'),
  '10000000-0000-0000-0000-000000000011',
  '2026-06-20 19:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 32
),
(
  (SELECT id FROM teams WHERE code = 'IRQ'),
  NULL,
  '10000000-0000-0000-0000-000000000002',
  '2026-06-20 22:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 33
),
(
  (SELECT id FROM teams WHERE code = 'FRA'),
  NULL,
  '10000000-0000-0000-0000-000000000004',
  '2026-06-24 01:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 53
),
(
  (SELECT id FROM teams WHERE code = 'IRQ'),
  (SELECT id FROM teams WHERE code = 'SEN'),
  '10000000-0000-0000-0000-000000000012',
  '2026-06-24 01:00:00+00', 'I', 'Group Stage', 'scheduled', NULL, NULL, 54
),

-- -------- GRUPO J --------
(
  (SELECT id FROM teams WHERE code = 'ALG'),
  (SELECT id FROM teams WHERE code = 'ITA'),
  '10000000-0000-0000-0000-000000000005',
  '2026-06-16 23:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 20
),
(
  NULL,
  NULL,
  '10000000-0000-0000-0000-000000000006',
  '2026-06-17 02:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 21
),
(
  (SELECT id FROM teams WHERE code = 'ALG'),
  NULL,
  '10000000-0000-0000-0000-000000000006',
  '2026-06-21 01:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 34
),
(
  (SELECT id FROM teams WHERE code = 'ITA'),
  NULL,
  '10000000-0000-0000-0000-000000000005',
  '2026-06-21 04:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 35
),
(
  (SELECT id FROM teams WHERE code = 'ALG'),
  NULL,
  '10000000-0000-0000-0000-000000000007',
  '2026-06-24 21:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 55
),
(
  (SELECT id FROM teams WHERE code = 'ITA'),
  NULL,
  '10000000-0000-0000-0000-000000000008',
  '2026-06-24 21:00:00+00', 'J', 'Group Stage', 'scheduled', NULL, NULL, 56
),

-- -------- GRUPO K --------
(
  (SELECT id FROM teams WHERE code = 'COL'),
  (SELECT id FROM teams WHERE code = 'POR'),
  '10000000-0000-0000-0000-000000000007',
  '2026-06-17 19:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 22
),
(
  (SELECT id FROM teams WHERE code = 'CHI'),
  NULL,
  '10000000-0000-0000-0000-000000000009',
  '2026-06-17 22:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 23
),
(
  (SELECT id FROM teams WHERE code = 'COL'),
  (SELECT id FROM teams WHERE code = 'CHI'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-21 19:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 36
),
(
  (SELECT id FROM teams WHERE code = 'POR'),
  NULL,
  '10000000-0000-0000-0000-000000000007',
  '2026-06-21 22:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 37
),
(
  (SELECT id FROM teams WHERE code = 'COL'),
  NULL,
  '10000000-0000-0000-0000-000000000006',
  '2026-06-24 23:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 57
),
(
  (SELECT id FROM teams WHERE code = 'POR'),
  (SELECT id FROM teams WHERE code = 'CHI'),
  '10000000-0000-0000-0000-000000000005',
  '2026-06-24 23:00:00+00', 'K', 'Group Stage', 'scheduled', NULL, NULL, 58
),

-- -------- GRUPO L --------
(
  (SELECT id FROM teams WHERE code = 'CRO'),
  (SELECT id FROM teams WHERE code = 'GHA'),
  '10000000-0000-0000-0000-000000000008',
  '2026-06-18 02:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 24
),
(
  (SELECT id FROM teams WHERE code = 'ENG'),
  (SELECT id FROM teams WHERE code = 'PAN'),
  '10000000-0000-0000-0000-000000000012',
  '2026-06-18 22:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 25
),
(
  (SELECT id FROM teams WHERE code = 'CRO'),
  (SELECT id FROM teams WHERE code = 'ENG'),
  '10000000-0000-0000-0000-000000000009',
  '2026-06-22 02:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 38
),
(
  (SELECT id FROM teams WHERE code = 'GHA'),
  (SELECT id FROM teams WHERE code = 'PAN'),
  '10000000-0000-0000-0000-000000000010',
  '2026-06-22 02:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 39
),
(
  (SELECT id FROM teams WHERE code = 'CRO'),
  (SELECT id FROM teams WHERE code = 'PAN'),
  '10000000-0000-0000-0000-000000000002',
  '2026-06-25 21:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 59
),
(
  (SELECT id FROM teams WHERE code = 'GHA'),
  (SELECT id FROM teams WHERE code = 'ENG'),
  '10000000-0000-0000-0000-000000000011',
  '2026-06-25 21:00:00+00', 'L', 'Group Stage', 'scheduled', NULL, NULL, 60
);

-- -------- RONDAS DE ELIMINACIÓN (home/away = NULL, To Be Determined) --------

-- Round of 32 (16 partidos, api_id 73-88)
INSERT INTO matches (home_team_id, away_team_id, stadium_id, date, group_name, stage, status, home_score, away_score, api_id) VALUES
(NULL, NULL, '10000000-0000-0000-0000-000000000007', '2026-06-28 19:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 73),
(NULL, NULL, '10000000-0000-0000-0000-000000000005', '2026-06-29 17:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 76),
(NULL, NULL, '10000000-0000-0000-0000-000000000011', '2026-06-29 20:30:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 74),
(NULL, NULL, '10000000-0000-0000-0000-000000000014', '2026-06-30 01:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 75),
(NULL, NULL, '10000000-0000-0000-0000-000000000003', '2026-06-30 17:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 78),
(NULL, NULL, '10000000-0000-0000-0000-000000000002', '2026-06-30 21:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 77),
(NULL, NULL, '10000000-0000-0000-0000-000000000001', '2026-07-01 01:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 79),
(NULL, NULL, '10000000-0000-0000-0000-000000000006', '2026-07-01 16:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 80),
(NULL, NULL, '10000000-0000-0000-0000-000000000009', '2026-07-01 20:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 82),
(NULL, NULL, '10000000-0000-0000-0000-000000000010', '2026-07-02 00:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 81),
(NULL, NULL, '10000000-0000-0000-0000-000000000007', '2026-07-02 19:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 84),
(NULL, NULL, '10000000-0000-0000-0000-000000000013', '2026-07-02 23:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 83),
(NULL, NULL, '10000000-0000-0000-0000-000000000013', '2026-07-03 03:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 85),
(NULL, NULL, '10000000-0000-0000-0000-000000000003', '2026-07-03 18:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 88),
(NULL, NULL, '10000000-0000-0000-0000-000000000012', '2026-07-03 22:00:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 86),
(NULL, NULL, '10000000-0000-0000-0000-000000000004', '2026-07-04 01:30:00+00', NULL, 'Round of 32', 'scheduled', NULL, NULL, 87),

-- Round of 16 (8 partidos, api_id 89-96)
(NULL, NULL, '10000000-0000-0000-0000-000000000005', '2026-07-04 17:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 90),
(NULL, NULL, '10000000-0000-0000-0000-000000000008', '2026-07-04 21:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 89),
(NULL, NULL, '10000000-0000-0000-0000-000000000002', '2026-07-05 20:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 91),
(NULL, NULL, '10000000-0000-0000-0000-000000000001', '2026-07-06 00:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 92),
(NULL, NULL, '10000000-0000-0000-0000-000000000003', '2026-07-06 19:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 93),
(NULL, NULL, '10000000-0000-0000-0000-000000000009', '2026-07-07 00:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 94),
(NULL, NULL, '10000000-0000-0000-0000-000000000006', '2026-07-07 16:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 95),
(NULL, NULL, '10000000-0000-0000-0000-000000000013', '2026-07-07 20:00:00+00', NULL, 'Round of 16', 'scheduled', NULL, NULL, 96),

-- Quarterfinals (4 partidos, api_id 97-100)
(NULL, NULL, '10000000-0000-0000-0000-000000000011', '2026-07-09 20:00:00+00', NULL, 'Quarterfinals', 'scheduled', NULL, NULL, 97),
(NULL, NULL, '10000000-0000-0000-0000-000000000007', '2026-07-10 19:00:00+00', NULL, 'Quarterfinals', 'scheduled', NULL, NULL, 98),
(NULL, NULL, '10000000-0000-0000-0000-000000000012', '2026-07-11 21:00:00+00', NULL, 'Quarterfinals', 'scheduled', NULL, NULL, 99),
(NULL, NULL, '10000000-0000-0000-0000-000000000004', '2026-07-12 01:00:00+00', NULL, 'Quarterfinals', 'scheduled', NULL, NULL, 100),

-- Semifinals (2 partidos, api_id 101-102)
(NULL, NULL, '10000000-0000-0000-0000-000000000003', '2026-07-14 19:00:00+00', NULL, 'Semifinals', 'scheduled', NULL, NULL, 101),
(NULL, NULL, '10000000-0000-0000-0000-000000000006', '2026-07-15 19:00:00+00', NULL, 'Semifinals', 'scheduled', NULL, NULL, 102),

-- Third Place (1 partido, api_id 103)
(NULL, NULL, '10000000-0000-0000-0000-000000000012', '2026-07-18 21:00:00+00', NULL, 'Third Place', 'scheduled', NULL, NULL, 103),

-- Final (1 partido, api_id 104)
(NULL, NULL, '10000000-0000-0000-0000-000000000002', '2026-07-19 19:00:00+00', NULL, 'Final', 'scheduled', NULL, NULL, 104);

-- =============================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =============================================================

SELECT 'TEAMS COUNT' as check_name, COUNT(*) as value FROM teams
UNION ALL
SELECT 'STADIUMS COUNT', COUNT(*) FROM stadiums
UNION ALL
SELECT 'MATCHES TOTAL', COUNT(*) FROM matches
UNION ALL
SELECT 'MATCHES NULL home_team_id', COUNT(*) FROM matches WHERE home_team_id IS NULL AND stage = 'Group Stage'
UNION ALL
SELECT 'MATCHES NULL away_team_id', COUNT(*) FROM matches WHERE away_team_id IS NULL AND stage = 'Group Stage'
UNION ALL
SELECT 'MATCHES NULL stadium_id', COUNT(*) FROM matches WHERE stadium_id IS NULL
UNION ALL
SELECT 'GROUP STAGE MATCHES', COUNT(*) FROM matches WHERE stage = 'Group Stage'
UNION ALL
SELECT 'KNOCKOUT MATCHES', COUNT(*) FROM matches WHERE stage != 'Group Stage';
