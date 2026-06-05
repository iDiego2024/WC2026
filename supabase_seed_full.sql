-- Seed Completo: World Cup 2026 Ultimate Tracker
-- Genera 48 Selecciones, 12 Grupos, 16 Estadios y Calendario Muestra.

-- 1. GRUPOS (12 Grupos: A - L)
INSERT INTO groups (id, name) VALUES 
('A', 'Grupo A'), ('B', 'Grupo B'), ('C', 'Grupo C'), ('D', 'Grupo D'),
('E', 'Grupo E'), ('F', 'Grupo F'), ('G', 'Grupo G'), ('H', 'Grupo H'),
('I', 'Grupo I'), ('J', 'Grupo J'), ('K', 'Grupo K'), ('L', 'Grupo L')
ON CONFLICT (id) DO NOTHING;

-- 2. ESTADIOS (16 Sedes Oficiales 2026)
INSERT INTO stadiums (id, name, city, capacity) VALUES 
('10000000-0000-0000-0000-000000000001', 'Estadio Azteca', 'Mexico City', 87523),
('10000000-0000-0000-0000-000000000002', 'MetLife Stadium', 'New York/NJ', 82500),
('10000000-0000-0000-0000-000000000003', 'AT&T Stadium', 'Dallas', 80000),
('10000000-0000-0000-0000-000000000004', 'Arrowhead Stadium', 'Kansas City', 76416),
('10000000-0000-0000-0000-000000000005', 'NRG Stadium', 'Houston', 72220),
('10000000-0000-0000-0000-000000000006', 'Mercedes-Benz Stadium', 'Atlanta', 71000),
('10000000-0000-0000-0000-000000000007', 'SoFi Stadium', 'Los Angeles', 70240),
('10000000-0000-0000-0000-000000000008', 'Lincoln Financial Field', 'Philadelphia', 69796),
('10000000-0000-0000-0000-000000000009', 'Lumen Field', 'Seattle', 69000),
('10000000-0000-0000-0000-000000000010', 'Levi''s Stadium', 'San Francisco Bay', 68500),
('10000000-0000-0000-0000-000000000011', 'Gillette Stadium', 'Boston', 65878),
('10000000-0000-0000-0000-000000000012', 'Hard Rock Stadium', 'Miami', 64767),
('10000000-0000-0000-0000-000000000013', 'BC Place', 'Vancouver', 54500),
('10000000-0000-0000-0000-000000000014', 'Estadio BBVA', 'Monterrey', 53500),
('10000000-0000-0000-0000-000000000015', 'Estadio Akron', 'Guadalajara', 49850),
('10000000-0000-0000-0000-000000000016', 'BMO Field', 'Toronto', 30000)
ON CONFLICT DO NOTHING;

-- 3. EQUIPOS (48 Selecciones, divididas en 12 Grupos)
INSERT INTO teams (code, name, flag_code, group_name, fifa_rank, continent) VALUES
-- Grupo A
('MEX', 'Mexico', 'mx', 'A', 14, 'CONCACAF'),
('SRB', 'Serbia', 'rs', 'A', 33, 'UEFA'),
('EGY', 'Egypt', 'eg', 'A', 36, 'CAF'),
('NZL', 'New Zealand', 'nz', 'A', 104, 'OFC'),
-- Grupo B
('CAN', 'Canada', 'ca', 'B', 50, 'CONCACAF'),
('SWE', 'Sweden', 'se', 'B', 26, 'UEFA'),
('ALG', 'Algeria', 'dz', 'B', 43, 'CAF'),
('VEN', 'Venezuela', 've', 'B', 49, 'CONMEBOL'),
-- Grupo C
('USA', 'United States', 'us', 'C', 11, 'CONCACAF'),
('COL', 'Colombia', 'co', 'C', 15, 'CONMEBOL'),
('JPN', 'Japan', 'jp', 'C', 17, 'AFC'),
('GHA', 'Ghana', 'gh', 'C', 61, 'CAF'),
-- Grupo D
('ARG', 'Argentina', 'ar', 'D', 1, 'CONMEBOL'),
('DEN', 'Denmark', 'dk', 'D', 21, 'UEFA'),
('MAR', 'Morocco', 'ma', 'D', 13, 'CAF'),
('IRQ', 'Iraq', 'iq', 'D', 59, 'AFC'),
-- Grupo E
('FRA', 'France', 'fr', 'E', 2, 'UEFA'),
('PER', 'Peru', 'pe', 'E', 35, 'CONMEBOL'),
('KOR', 'South Korea', 'kr', 'E', 22, 'AFC'),
('MLI', 'Mali', 'ml', 'E', 47, 'CAF'),
-- Grupo F
('ENG', 'England', 'gb-eng', 'F', 3, 'UEFA'),
('ECU', 'Ecuador', 'ec', 'F', 32, 'CONMEBOL'),
('IRN', 'Iran', 'ir', 'F', 20, 'AFC'),
('CIV', 'Ivory Coast', 'ci', 'F', 39, 'CAF'),
-- Grupo G
('BRA', 'Brazil', 'br', 'G', 5, 'CONMEBOL'),
('SUI', 'Switzerland', 'ch', 'G', 19, 'UEFA'),
('KSA', 'Saudi Arabia', 'sa', 'G', 53, 'AFC'),
('RSA', 'South Africa', 'za', 'G', 58, 'CAF'),
-- Grupo H
('ESP', 'Spain', 'es', 'H', 8, 'UEFA'),
('URU', 'Uruguay', 'uy', 'H', 11, 'CONMEBOL'),
('AUS', 'Australia', 'au', 'H', 23, 'AFC'),
('POL', 'Poland', 'pl', 'H', 31, 'UEFA'),
-- Grupo I
('POR', 'Portugal', 'pt', 'I', 7, 'UEFA'),
('CRO', 'Croatia', 'hr', 'I', 10, 'UEFA'),
('SEN', 'Senegal', 'sn', 'I', 17, 'CAF'),
('PAN', 'Panama', 'pa', 'I', 41, 'CONCACAF'),
-- Grupo J
('NED', 'Netherlands', 'nl', 'J', 6, 'UEFA'),
('ITA', 'Italy', 'it', 'J', 9, 'UEFA'),
('CMR', 'Cameroon', 'cm', 'J', 51, 'CAF'),
('CRC', 'Costa Rica', 'cr', 'J', 54, 'CONCACAF'),
-- Grupo K
('BEL', 'Belgium', 'be', 'K', 4, 'UEFA'),
('CHI', 'Chile', 'cl', 'K', 40, 'CONMEBOL'),
('TUN', 'Tunisia', 'tn', 'K', 28, 'CAF'),
('JAM', 'Jamaica', 'jm', 'K', 55, 'CONCACAF'),
-- Grupo L
('GER', 'Germany', 'de', 'L', 16, 'UEFA'),
('NGA', 'Nigeria', 'ng', 'L', 28, 'CAF'),
('QAT', 'Qatar', 'qa', 'L', 58, 'AFC'),
('ROU', 'Romania', 'ro', 'L', 43, 'UEFA')
ON CONFLICT (code) DO NOTHING;

-- 4. PARTIDOS FASE DE GRUPOS (Muestra representativa - Jornada 1)
INSERT INTO matches (home_team_id, away_team_id, date, stadium_id, group_name, stage, status, home_score, away_score) VALUES
-- Grupo A
((SELECT id FROM teams WHERE code='MEX' LIMIT 1), (SELECT id FROM teams WHERE code='SRB' LIMIT 1), '2026-06-11T19:00:00Z', '10000000-0000-0000-0000-000000000001', 'A', 'Group Stage', 'finished', 2, 1),
((SELECT id FROM teams WHERE code='EGY' LIMIT 1), (SELECT id FROM teams WHERE code='NZL' LIMIT 1), '2026-06-12T15:00:00Z', '10000000-0000-0000-0000-000000000014', 'A', 'Group Stage', 'finished', 1, 1),

-- Grupo B
((SELECT id FROM teams WHERE code='CAN' LIMIT 1), (SELECT id FROM teams WHERE code='SWE' LIMIT 1), '2026-06-12T18:00:00Z', '10000000-0000-0000-0000-000000000013', 'B', 'Group Stage', 'live', 1, 0),
((SELECT id FROM teams WHERE code='ALG' LIMIT 1), (SELECT id FROM teams WHERE code='VEN' LIMIT 1), '2026-06-13T12:00:00Z', '10000000-0000-0000-0000-000000000016', 'B', 'Group Stage', 'live', 0, 0),

-- Grupo C
((SELECT id FROM teams WHERE code='USA' LIMIT 1), (SELECT id FROM teams WHERE code='COL' LIMIT 1), '2026-06-13T16:00:00Z', '10000000-0000-0000-0000-000000000007', 'C', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='JPN' LIMIT 1), (SELECT id FROM teams WHERE code='GHA' LIMIT 1), '2026-06-14T11:00:00Z', '10000000-0000-0000-0000-000000000010', 'C', 'Group Stage', 'scheduled', null, null),

-- Grupo D
((SELECT id FROM teams WHERE code='ARG' LIMIT 1), (SELECT id FROM teams WHERE code='DEN' LIMIT 1), '2026-06-14T15:00:00Z', '10000000-0000-0000-0000-000000000012', 'D', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='MAR' LIMIT 1), (SELECT id FROM teams WHERE code='IRQ' LIMIT 1), '2026-06-15T13:00:00Z', '10000000-0000-0000-0000-000000000006', 'D', 'Group Stage', 'scheduled', null, null),

-- Grupo E
((SELECT id FROM teams WHERE code='FRA' LIMIT 1), (SELECT id FROM teams WHERE code='PER' LIMIT 1), '2026-06-15T18:00:00Z', '10000000-0000-0000-0000-000000000002', 'E', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='KOR' LIMIT 1), (SELECT id FROM teams WHERE code='MLI' LIMIT 1), '2026-06-16T12:00:00Z', '10000000-0000-0000-0000-000000000008', 'E', 'Group Stage', 'scheduled', null, null),

-- Grupo F
((SELECT id FROM teams WHERE code='ENG' LIMIT 1), (SELECT id FROM teams WHERE code='ECU' LIMIT 1), '2026-06-16T17:00:00Z', '10000000-0000-0000-0000-000000000003', 'F', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='IRN' LIMIT 1), (SELECT id FROM teams WHERE code='CIV' LIMIT 1), '2026-06-17T11:00:00Z', '10000000-0000-0000-0000-000000000005', 'F', 'Group Stage', 'scheduled', null, null),

-- Grupo G
((SELECT id FROM teams WHERE code='BRA' LIMIT 1), (SELECT id FROM teams WHERE code='SUI' LIMIT 1), '2026-06-17T16:00:00Z', '10000000-0000-0000-0000-000000000007', 'G', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='KSA' LIMIT 1), (SELECT id FROM teams WHERE code='RSA' LIMIT 1), '2026-06-18T13:00:00Z', '10000000-0000-0000-0000-000000000010', 'G', 'Group Stage', 'scheduled', null, null),

-- Grupo H
((SELECT id FROM teams WHERE code='ESP' LIMIT 1), (SELECT id FROM teams WHERE code='URU' LIMIT 1), '2026-06-18T18:00:00Z', '10000000-0000-0000-0000-000000000012', 'H', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='AUS' LIMIT 1), (SELECT id FROM teams WHERE code='POL' LIMIT 1), '2026-06-19T12:00:00Z', '10000000-0000-0000-0000-000000000006', 'H', 'Group Stage', 'scheduled', null, null),

-- Grupo I
((SELECT id FROM teams WHERE code='POR' LIMIT 1), (SELECT id FROM teams WHERE code='CRO' LIMIT 1), '2026-06-19T17:00:00Z', '10000000-0000-0000-0000-000000000002', 'I', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='SEN' LIMIT 1), (SELECT id FROM teams WHERE code='PAN' LIMIT 1), '2026-06-20T11:00:00Z', '10000000-0000-0000-0000-000000000008', 'I', 'Group Stage', 'scheduled', null, null),

-- Grupo J
((SELECT id FROM teams WHERE code='NED' LIMIT 1), (SELECT id FROM teams WHERE code='ITA' LIMIT 1), '2026-06-20T16:00:00Z', '10000000-0000-0000-0000-000000000011', 'J', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='CMR' LIMIT 1), (SELECT id FROM teams WHERE code='CRC' LIMIT 1), '2026-06-21T13:00:00Z', '10000000-0000-0000-0000-000000000006', 'J', 'Group Stage', 'scheduled', null, null),

-- Grupo K
((SELECT id FROM teams WHERE code='BEL' LIMIT 1), (SELECT id FROM teams WHERE code='CHI' LIMIT 1), '2026-06-21T18:00:00Z', '10000000-0000-0000-0000-000000000003', 'K', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='TUN' LIMIT 1), (SELECT id FROM teams WHERE code='JAM' LIMIT 1), '2026-06-22T12:00:00Z', '10000000-0000-0000-0000-000000000005', 'K', 'Group Stage', 'scheduled', null, null),

-- Grupo L
((SELECT id FROM teams WHERE code='GER' LIMIT 1), (SELECT id FROM teams WHERE code='NGA' LIMIT 1), '2026-06-22T17:00:00Z', '10000000-0000-0000-0000-000000000007', 'L', 'Group Stage', 'scheduled', null, null),
((SELECT id FROM teams WHERE code='QAT' LIMIT 1), (SELECT id FROM teams WHERE code='ROU' LIMIT 1), '2026-06-23T11:00:00Z', '10000000-0000-0000-0000-000000000010', 'L', 'Group Stage', 'scheduled', null, null);
