-- DDL Migrations: FASE 20 Premium Layer Tables and Columns
-- Executed on Supabase

-- 1. Add ELO and analytics fields to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1500;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS recent_form JSONB DEFAULT '[]'::jsonb;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS streak VARCHAR(10) DEFAULT '0D';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS played INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_for INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_against INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goal_difference INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS attack_rating INTEGER DEFAULT 50;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS defense_rating INTEGER DEFAULT 50;

-- 2. Add API ID to matches
ALTER TABLE teams ADD COLUMN IF NOT EXISTS api_id INTEGER UNIQUE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_id INTEGER UNIQUE;

-- 3. Match Events Table
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'goal', 'card_yellow', 'card_red', 'assist', 'substitution'
    player_name VARCHAR(150) NOT NULL,
    team_id UUID REFERENCES teams(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match events are universally readable" ON match_events FOR SELECT USING (true);

-- 4. Lineups Table
CREATE TABLE IF NOT EXISTS lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_name VARCHAR(150) NOT NULL,
    position VARCHAR(10), -- 'GK', 'DF', 'MF', 'FW'
    starter BOOLEAN DEFAULT TRUE,
    shirt_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lineups are universally readable" ON lineups FOR SELECT USING (true);

-- 5. Match Statistics Table
CREATE TABLE IF NOT EXISTS match_statistics (
    match_id UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
    possession_home INTEGER,
    possession_away INTEGER,
    shots_home INTEGER,
    shots_away INTEGER,
    shots_on_target_home INTEGER,
    shots_on_target_away INTEGER,
    corners_home INTEGER,
    corners_away INTEGER,
    fouls_home INTEGER,
    fouls_away INTEGER,
    yellow_cards_home INTEGER,
    yellow_cards_away INTEGER,
    red_cards_home INTEGER,
    red_cards_away INTEGER,
    passes_home INTEGER,
    passes_away INTEGER,
    pass_accuracy_home INTEGER,
    pass_accuracy_away INTEGER,
    distance_run_home DECIMAL(5,2),
    distance_run_away DECIMAL(5,2),
    xg_home DECIMAL(4,2),
    xg_away DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match statistics are universally readable" ON match_statistics FOR SELECT USING (true);

-- 6. H2H Cache Table
CREATE TABLE IF NOT EXISTS h2h_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team_code VARCHAR(3) NOT NULL,
    away_team_code VARCHAR(3) NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(home_team_code, away_team_code)
);

ALTER TABLE h2h_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "H2H cache is universally readable" ON h2h_cache FOR SELECT USING (true);

-- 7. Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id INTEGER UNIQUE,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(50), -- 'GK', 'DF', 'MF', 'FW'
    age INTEGER,
    club VARCHAR(150),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- selección
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players are universally readable" ON players FOR SELECT USING (true);

-- 8. Player Aggregated Stats Table
CREATE TABLE IF NOT EXISTS player_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    xg DECIMAL(5,2) DEFAULT 0.0,
    xa DECIMAL(5,2) DEFAULT 0.0,
    rating DECIMAL(4,2) DEFAULT 0.0,
    clean_sheets INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player stats are universally readable" ON player_stats FOR SELECT USING (true);

-- 9. Player Tournament Match Stats Table
CREATE TABLE IF NOT EXISTS player_tournament_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    xg DECIMAL(4,2) DEFAULT 0.0,
    xa DECIMAL(4,2) DEFAULT 0.0,
    saves INTEGER DEFAULT 0,
    conceded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, match_id)
);

ALTER TABLE player_tournament_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player tournament stats are universally readable" ON player_tournament_stats FOR SELECT USING (true);

-- 10. News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT UNIQUE,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    source_name VARCHAR(150),
    team_code VARCHAR(3),
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News articles are universally readable" ON news_articles FOR SELECT USING (true);

-- 11. Tournament Insights Table
CREATE TABLE IF NOT EXISTS tournament_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) UNIQUE NOT NULL, -- 'surprise_team', 'most_offensive_team', 'most_solid_team', 'best_goalkeeper', 'revelation_player', 'must_watch_match'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_id UUID, -- References team_id, player_id, or match_id
    entity_type VARCHAR(50), -- 'team', 'player', 'match'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tournament_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament insights are universally readable" ON tournament_insights FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_stats_match ON player_tournament_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_news_team ON news_articles(team_code);
