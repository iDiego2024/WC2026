-- 1. Alteraciones de esquema para soportar IDs de API externas (API-Football)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS api_id INTEGER UNIQUE;
ALTER TABLE stadiums ADD COLUMN IF NOT EXISTS api_id INTEGER UNIQUE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_id INTEGER UNIQUE;

-- 2. Función para procesar y calcular los puntos ganados en las predicciones
CREATE OR REPLACE FUNCTION process_match_predictions()
RETURNS TRIGGER AS $$
BEGIN
    -- Se dispara cuando un partido cambia su estado a 'finished'
    IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
        
        -- A. Calcular puntos para cada predicción del partido finalizado
        UPDATE match_predictions
        SET points_earned = CASE 
            -- Acierto Exacto de Marcador (3 Puntos)
            WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
            -- Acierto de Ganador o Empate pero no marcador exacto (1 Punto)
            WHEN (home_score > away_score AND NEW.home_score > NEW.away_score) OR
                 (home_score < away_score AND NEW.home_score < NEW.away_score) OR
                 (home_score = away_score AND NEW.home_score = NEW.away_score) THEN 1
            -- Fallo (0 Puntos)
            ELSE 0
        END
        WHERE match_id = NEW.id;

        -- B. Recalcular el score acumulado de todos los perfiles de usuario
        UPDATE profiles p
        SET score = COALESCE((
            SELECT SUM(points_earned) 
            FROM match_predictions mp 
            WHERE mp.user_id = p.id
        ), 0);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger
DROP TRIGGER IF EXISTS match_finished_trigger ON matches;
CREATE TRIGGER match_finished_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE PROCEDURE process_match_predictions();

-- 4. Polícas de Escritura Temporales para Sincronización y Mapeo en Beta
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teams are writeable" ON teams;
CREATE POLICY "Teams are writeable" ON teams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stadiums are writeable" ON stadiums;
CREATE POLICY "Stadiums are writeable" ON stadiums FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Groups are writeable" ON groups;
CREATE POLICY "Groups are writeable" ON groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Matches are writeable" ON matches;
CREATE POLICY "Matches are writeable" ON matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

