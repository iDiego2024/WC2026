--
-- PostgreSQL Database Schema for World Cup 2026 Ultimate Tracker
--

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. USERS & SOCIAL (Users, Friends, Followers)
--------------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    global_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_global_score ON users(global_score DESC);

CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_relationships_follower ON user_relationships(follower_id);
CREATE INDEX idx_relationships_following ON user_relationships(following_id);

--------------------------------------------------------------------------------
-- 2. TOURNAMENT DATA (Teams, Stadiums, Matches)
--------------------------------------------------------------------------------

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    flag_code VARCHAR(10) NOT NULL,
    fifa_rank INTEGER NOT NULL,
    group_name VARCHAR(1), -- 'A', 'B', etc.
    base_elo_rating INTEGER NOT NULL,
    attack_rating INTEGER NOT NULL,
    defense_rating INTEGER NOT NULL
);

CREATE TABLE stadiums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    altitude_meters INTEGER DEFAULT 0
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage VARCHAR(50) NOT NULL, -- e.g., 'Group Stage', 'Round of 32', 'Final'
    group_name VARCHAR(1),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'LIVE', 'FINISHED'
    stadium_id UUID REFERENCES stadiums(id),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_score INTEGER,
    away_score INTEGER,
    home_penalty_score INTEGER,
    away_penalty_score INTEGER,
    live_minute VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);

--------------------------------------------------------------------------------
-- 3. PREDICTIONS & LEAGUES
--------------------------------------------------------------------------------

CREATE TABLE private_leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    join_code VARCHAR(20) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE league_members (
    league_id UUID REFERENCES private_leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (league_id, user_id)
);

CREATE INDEX idx_league_members_score ON league_members(league_id, total_score DESC);

CREATE TABLE match_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    predicted_home_score INTEGER NOT NULL,
    predicted_away_score INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0, -- Calculated post-match
    is_locked BOOLEAN DEFAULT FALSE, -- Locked at kickoff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, match_id)
);

CREATE INDEX idx_predictions_match ON match_predictions(match_id);
CREATE INDEX idx_predictions_user ON match_predictions(user_id);

--------------------------------------------------------------------------------
-- 4. SOCIAL HUB (Feed, Comments, Reactions)
--------------------------------------------------------------------------------

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    post_type VARCHAR(50) DEFAULT 'text', -- 'text', 'prediction_share', 'simulation_share', 'achievement'
    reference_id UUID, -- Can point to an achievement, prediction, or simulation run
    metadata JSONB, -- For storing specific shared data (e.g., sim results, prediction scores)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_date ON posts(user_id, created_at DESC);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post ON comments(post_id);

CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'post', 'comment'
    target_id UUID NOT NULL,
    reaction_type VARCHAR(20) DEFAULT 'like', -- 'like', 'fire', 'insightful'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id, reaction_type)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

--------------------------------------------------------------------------------
-- 5. SIMULATIONS (Saved AI Runs)
--------------------------------------------------------------------------------

CREATE TABLE simulation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_type VARCHAR(50) NOT NULL, -- 'group_stage', 'knockout', 'full_tournament'
    iterations INTEGER NOT NULL,
    parameters JSONB NOT NULL, -- The weights used (Elo, xG, Fatigue, etc.)
    results JSONB NOT NULL, -- The aggregated probability output
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- 6. ACHIEVEMENTS & GAMIFICATION
--------------------------------------------------------------------------------

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_type VARCHAR(50),
    condition_type VARCHAR(50) -- Trigger type ('perfect_score', 'first_sim')
);

CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

--------------------------------------------------------------------------------
-- 7. VIEWS & MATERIALIZED VIEWS for Performance
--------------------------------------------------------------------------------

-- View: Global Leaderboard
CREATE OR REPLACE VIEW view_global_leaderboard AS
SELECT 
    id AS user_id,
    display_name,
    handle,
    avatar_url,
    global_score,
    RANK() OVER (ORDER BY global_score DESC) as rank
FROM users
WHERE global_score > 0;

-- Materialized View: Prediction Stats per User (Refresh Daily/Hourly)
CREATE MATERIALIZED VIEW mv_user_prediction_stats AS
SELECT 
    user_id,
    COUNT(id) as total_predictions,
    SUM(points_earned) as total_points,
    COUNT(CASE WHEN points_earned = 3 THEN 1 END) as perfect_scores -- Assuming 3 is max points
FROM match_predictions
GROUP BY user_id;

CREATE UNIQUE INDEX idx_mv_pred_stats_user ON mv_user_prediction_stats(user_id);

-- Function: Auto-Update User Updated_At
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

--------------------------------------------------------------------------------
-- 8. FANTASY WORLD CUP MODULE
--------------------------------------------------------------------------------

CREATE TABLE fantasy_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    total_budget DECIMAL(5,1) DEFAULT 100.0,
    remaining_budget DECIMAL(5,1) DEFAULT 100.0,
    total_points INTEGER DEFAULT 0,
    gameweek_points INTEGER DEFAULT 0,
    free_transfers INTEGER DEFAULT 1,
    active_chip VARCHAR(20), -- 'wildcard', 'bench_boost', 'triple_captain'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE fantasy_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    real_player_name VARCHAR(100) NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id),
    position VARCHAR(3) NOT NULL, -- 'GK', 'DEF', 'MID', 'FWD'
    current_price DECIMAL(4,1) NOT NULL,
    total_points INTEGER DEFAULT 0,
    selected_by_percent DECIMAL(5,2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'injured', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fantasy_players_position ON fantasy_players(position);

CREATE TABLE fantasy_rosters (
    fantasy_team_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    fantasy_player_id UUID NOT NULL REFERENCES fantasy_players(id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    is_benched BOOLEAN DEFAULT FALSE,
    bench_order INTEGER DEFAULT 0, -- 1, 2, 3 for bench priority
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fantasy_team_id, fantasy_player_id)
);

CREATE TABLE fantasy_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fantasy_team_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,
    player_in_id UUID NOT NULL REFERENCES fantasy_players(id),
    player_out_id UUID NOT NULL REFERENCES fantasy_players(id),
    cost_points INTEGER DEFAULT 0, -- Cost in points (e.g. -4 if beyond free transfers)
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: In a production environment, constraints like max 3 players per team
-- and exactly 15 players per roster are typically enforced at the application tier
-- before persisting transactions.

--------------------------------------------------------------------------------
-- 9. UNIVERSE KNOWLEDGE GRAPH
--------------------------------------------------------------------------------

CREATE TABLE universe_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'player', 'team', 'tournament', 'stadium', 'record', 'coach', 'event'
    metadata JSONB, -- Flexible attributes (e.g., year, goals, capacity, description, image_url)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_universe_nodes_type ON universe_nodes(type);
CREATE INDEX idx_universe_nodes_label_trgm ON universe_nodes USING gin (label gin_trgm_ops); -- Assuming pg_trgm extension

CREATE TABLE universe_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES universe_nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES universe_nodes(id) ON DELETE CASCADE,
    relationship VARCHAR(100) NOT NULL, -- 'played_for', 'won', 'hosted', 'managed', 'scored_in', 'broke_record'
    weight FLOAT DEFAULT 1.0,
    metadata JSONB, -- Specific connection details (e.g., year, score array, minute)
    UNIQUE(source_id, target_id, relationship)
);

CREATE INDEX idx_universe_edges_source ON universe_edges(source_id);
CREATE INDEX idx_universe_edges_target ON universe_edges(target_id);

--------------------------------------------------------------------------------
-- 10. DIGITAL TWIN (Sandbox Environments)
--------------------------------------------------------------------------------

CREATE TABLE digital_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE twin_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_id UUID NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id),
    home_score INTEGER,
    away_score INTEGER,
    is_overridden BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(twin_id, match_id)
);

CREATE INDEX idx_twin_matches_twin ON twin_matches(twin_id);

-- Trigger for updated nodes if needed can be added.
CREATE TRIGGER set_timestamp_fantasy_teams
BEFORE UPDATE ON fantasy_teams
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
