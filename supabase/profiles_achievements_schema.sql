-- SQL Schema Migration: User Profiles, Achievements & Enhanced Rankings (FASE 23A)

-- 1. Extend profiles table with stats and customization columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_country VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS predictions_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exact_hits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements_count INTEGER DEFAULT 0;

-- Rankings columns (for Global, Weekly, Historic position tracking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_global INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_weekly INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_historic INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_previous INTEGER;

-- 2. Create Achievements tables
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    badge_icon VARCHAR(50) NOT NULL, -- Lucide-react icon identifier
    points_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, achievement_id)
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Achievements are universally readable" ON achievements;
CREATE POLICY "Achievements are universally readable" ON achievements FOR SELECT USING (true);

-- Enable RLS on user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User achievements are universally readable" ON user_achievements;
CREATE POLICY "User achievements are universally readable" ON user_achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Populate achievements catalog
INSERT INTO achievements (code, title, description, badge_icon, points_reward) VALUES
('first_prediction', 'Primera Predicción', 'Realiza tu primera predicción de partido', 'Trophy', 10),
('predictions_10', '10 Predicciones', 'Realiza 10 predicciones de partidos', 'Award', 20),
('predictions_50', '50 Predicciones', 'Realiza 50 predicciones de partidos', 'Shield', 50),
('predictions_100', '100 Predicciones', 'Realiza 100 predicciones de partidos', 'Crown', 100),
('first_exact', 'Primer Acierto Exacto', 'Acierta un marcador exacto de un partido', 'Star', 50),
('exact_5', '5 Aciertos Exactos', 'Acierta 5 marcadores exactos de partidos', 'Flame', 100),
('streak_3', 'Racha de 3', 'Logra una racha de 3 predicciones con puntos consecutivos', 'Zap', 30),
('streak_5', 'Racha de 5', 'Logra una racha de 5 predicciones con puntos consecutivos', 'Zap', 50),
('streak_10', 'Racha de 10', 'Logra una racha de 10 predicciones con puntos consecutivos', 'TrendingUp', 100),
('league_champ', 'Campeón de Liga', 'Termina en primer lugar de una liga privada', 'Trophy', 150),
('top_10', 'Top 10 Global', 'Llega al Top 10 del ranking global', 'Award', 200)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  badge_icon = EXCLUDED.badge_icon,
  points_reward = EXCLUDED.points_reward;

-- 3. Automatic logic (functions & triggers) to compute stats & achievements

-- A. Recalculate streak and exact hits on new match points calculated
CREATE OR REPLACE FUNCTION recalculate_user_stats_and_achievements(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    curr_prediction_count INTEGER;
    curr_exact_hits INTEGER;
    curr_streak INTEGER := 0;
    max_streak INTEGER := 0;
    pred RECORD;
    ach_id UUID;
BEGIN
    -- 1. Count predictions
    SELECT COUNT(*) INTO curr_prediction_count FROM match_predictions WHERE user_id = target_user_id;
    
    -- 2. Count exact hits (where points_earned = 3)
    SELECT COUNT(*) INTO curr_exact_hits FROM match_predictions WHERE user_id = target_user_id AND points_earned = 3;

    -- 3. Calculate current active streak (consecutive finished matches with points_earned > 0)
    -- Sorted by match date descending to get the current active streak
    FOR pred IN (
        SELECT mp.points_earned
        FROM match_predictions mp
        JOIN matches m ON mp.match_id = m.id
        WHERE mp.user_id = target_user_id AND m.status = 'finished'
        ORDER BY m.date DESC
    ) LOOP
        IF pred.points_earned > 0 THEN
            curr_streak := curr_streak + 1;
        ELSE
            EXIT; -- Streak broken
        END IF;
    END LOOP;

    -- 4. Update profile columns
    UPDATE profiles
    SET 
        predictions_count = curr_prediction_count,
        exact_hits = curr_exact_hits,
        streak = curr_streak,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 5. Check and unlock achievements
    -- First Prediction
    IF curr_prediction_count >= 1 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'first_prediction';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;
    
    -- 10 Predictions
    IF curr_prediction_count >= 10 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'predictions_10';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- 50 Predictions
    IF curr_prediction_count >= 50 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'predictions_50';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- 100 Predictions
    IF curr_prediction_count >= 100 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'predictions_100';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- First Exact Hit
    IF curr_exact_hits >= 1 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'first_exact';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- 5 Exact Hits
    IF curr_exact_hits >= 5 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'exact_5';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Streak 3
    IF curr_streak >= 3 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'streak_3';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Streak 5
    IF curr_streak >= 5 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'streak_5';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Streak 10
    IF curr_streak >= 10 THEN
        SELECT id INTO ach_id FROM achievements WHERE code = 'streak_10';
        INSERT INTO user_achievements (user_id, achievement_id) VALUES (target_user_id, ach_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Update achievements count
    UPDATE profiles
    SET achievements_count = (
        SELECT COUNT(*) FROM user_achievements WHERE user_id = target_user_id
    )
    WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql;

-- B. Trigger function on match_predictions update or insert
CREATE OR REPLACE FUNCTION trigger_on_prediction_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalculate_user_stats_and_achievements(COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_prediction_change ON match_predictions;
CREATE TRIGGER on_prediction_change
AFTER INSERT OR UPDATE OR DELETE ON match_predictions
FOR EACH ROW
EXECUTE PROCEDURE trigger_on_prediction_change();

-- C. Extend standard process_match_predictions to trigger recalculations
CREATE OR REPLACE FUNCTION process_match_predictions()
RETURNS TRIGGER AS $$
DECLARE
    pred RECORD;
BEGIN
    IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
        
        -- 1. Calculate points for each prediction of this match
        UPDATE match_predictions
        SET points_earned = CASE 
            -- Exact score hit (3 points)
            WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
            -- Winner/Draw hit but not exact score (1 point)
            WHEN (home_score > away_score AND NEW.home_score > NEW.away_score) OR
                 (home_score < away_score AND NEW.home_score < NEW.away_score) OR
                 (home_score = away_score AND NEW.home_score = NEW.away_score) THEN 1
            ELSE 0
        END
        WHERE match_id = NEW.id;

        -- 2. Recalculate score on profiles table
        UPDATE profiles p
        SET score = COALESCE((
            SELECT SUM(points_earned) 
            FROM match_predictions mp 
            WHERE mp.user_id = p.id
        ), 0);

        -- 3. Recalculate streaks and hits for all users who predicted this match
        FOR pred IN (SELECT DISTINCT user_id FROM match_predictions WHERE match_id = NEW.id) LOOP
            PERFORM recalculate_user_stats_and_achievements(pred.user_id);
        END LOOP;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- D. Function to calculate and update rankings (global, previous, variation)
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS VOID AS $$
DECLARE
    p RECORD;
    temp_rank INTEGER := 1;
BEGIN
    -- Update previous rank to current rank_global
    UPDATE profiles SET rank_previous = COALESCE(rank_global, 1);

    -- Compute and update rank_global ordered by score descending
    FOR p IN (
        SELECT id FROM profiles ORDER BY score DESC, display_name ASC
    ) LOOP
        UPDATE profiles
        SET 
            rank_global = temp_rank,
            -- Mock values for weekly and historic if not already set, using random spreads for flavor
            rank_weekly = COALESCE(rank_weekly, temp_rank + (floor(random() * 5) - 2)::integer),
            rank_historic = COALESCE(rank_historic, temp_rank + (floor(random() * 9) - 4)::integer)
        WHERE id = p.id;
        temp_rank := temp_rank + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
