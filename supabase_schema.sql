-- Supabase Schema: World Cup 2026 Ultimate Tracker

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tablas Base
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL, -- e.g., 'ARG', 'FRA'
    name VARCHAR(100) NOT NULL,
    flag_code VARCHAR(10) NOT NULL,
    group_name VARCHAR(1),
    fifa_rank INTEGER,
    continent VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stadiums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: the 'groups' construct will be managed via the teams table or distinct table if necessary.
-- Using a groups table for settings/standings definition.
CREATE TABLE groups (
    id VARCHAR(1) PRIMARY KEY, -- 'A', 'B', etc.
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Matches
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished');
CREATE TYPE match_stage AS ENUM ('Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final', 'Third Place');

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stadium_id UUID REFERENCES stadiums(id),
    group_name VARCHAR(1) REFERENCES groups(id),
    stage match_stage NOT NULL,
    status match_status DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Users Profile (Extending Supabase Auth user)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(150),
    email VARCHAR(255) UNIQUE,
    photo_url TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Predictions & Leagues
CREATE TABLE match_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- One prediction per user per match
);

CREATE TABLE private_leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE league_members (
    league_id UUID REFERENCES private_leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(league_id, user_id)
);

-- 5. Row Level Security (RLS) Policies

-- Teams, Stadiums, Groups, Matches are completely readable by everyone
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are universally readable" ON teams FOR SELECT USING (true);

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stadiums are universally readable" ON stadiums FOR SELECT USING (true);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are universally readable" ON groups FOR SELECT USING (true);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are universally readable" ON matches FOR SELECT USING (true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are universally readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Match Predictions (Only readable & writable by owners)
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own predictions" ON match_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own predictions" ON match_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON match_predictions FOR UPDATE USING (auth.uid() = user_id);

-- Private Leagues
ALTER TABLE private_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leagues they are in" ON private_leagues 
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT user_id FROM league_members WHERE league_id = private_leagues.id)
    );
CREATE POLICY "Users can insert leagues" ON private_leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of their leagues" ON league_members 
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM league_members lm WHERE lm.league_id = league_members.league_id)
    );
CREATE POLICY "Users can join a league" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Indexes para optimización
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_group ON matches(group_name);
CREATE INDEX idx_predictions_user_match ON match_predictions(user_id, match_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
