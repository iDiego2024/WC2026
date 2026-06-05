-- Seed Data for World Cup 2026 Ultimate Tracker

-- Groups
INSERT INTO groups (id, name) VALUES 
('A', 'Group A'),
('B', 'Group B')
ON CONFLICT (id) DO NOTHING;

-- Stadiums
INSERT INTO stadiums (id, name, city, capacity) VALUES 
('00000000-0000-0000-0000-000000000001', 'Estadio Azteca', 'Mexico City', 87523),
('00000000-0000-0000-0000-000000000002', 'MetLife Stadium', 'New York/New Jersey', 82500),
('00000000-0000-0000-0000-000000000003', 'BC Place', 'Vancouver', 54500)
ON CONFLICT (id) DO NOTHING;

-- Teams
INSERT INTO teams (id, code, name, flag_code, group_name, fifa_rank, continent) VALUES 
('11111111-1111-1111-1111-111111111111', 'MEX', 'Mexico', 'mx', 'A', 14, 'CONCACAF'),
('22222222-2222-2222-2222-222222222222', 'NGA', 'Nigeria', 'ng', 'A', 28, 'CAF'),
('33333333-3333-3333-3333-333333333333', 'ARG', 'Argentina', 'ar', 'B', 1, 'CONMEBOL'),
('44444444-4444-4444-4444-444444444444', 'CAN', 'Canada', 'ca', 'B', 48, 'CONCACAF'),
('55555555-5555-5555-5555-555555555555', 'MAR', 'Morocco', 'ma', 'A', 12, 'CAF'),
('66666666-6666-6666-6666-666666666666', 'GHA', 'Ghana', 'gh', 'B', 59, 'CAF')
ON CONFLICT (id) DO NOTHING;

-- Matches
INSERT INTO matches (id, home_team_id, away_team_id, date, stadium_id, group_name, stage, status, home_score, away_score) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-06-11T19:00:00Z', '00000000-0000-0000-0000-000000000001', 'A', 'Group Stage', 'finished', 2, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '2026-06-12T15:00:00Z', '00000000-0000-0000-0000-000000000003', 'B', 'Group Stage', 'scheduled', null, null)
ON CONFLICT (id) DO NOTHING;
