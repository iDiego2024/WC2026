-- Migration Script: World Cup 2026 Total Data Automation

-- 1. Nuevas columnas de Estadísticas en Vivo para Matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS minute INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS events JSONB; -- Goleadores, Tarjetas, Eventos especiales
ALTER TABLE matches ADD COLUMN IF NOT EXISTS lineups JSONB; -- Formación inicial y reservas
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stats JSONB; -- Posesión, Tiros, Faltas, Precisión

-- 2. Nuevas columnas de Historial y Rankings en Teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS elo_rank INTEGER;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS recent_form VARCHAR(10)[]; -- Arreglo de últimos resultados: e.g. ['W', 'D', 'W']
ALTER TABLE teams ADD COLUMN IF NOT EXISTS streak VARCHAR(10); -- Racha: e.g., '3W'
ALTER TABLE teams ADD COLUMN IF NOT EXISTS history_stats JSONB; -- Estadísticas históricas de enfrentamientos
ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goal_difference INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_for INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_against INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS played INTEGER DEFAULT 0;


-- 3. Crear la tabla de logs de sincronización (sync_logs)
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success', 'error'
    records_updated INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 1,
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en sync_logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública a los logs
DROP POLICY IF EXISTS "Sync logs are universally readable" ON sync_logs;
CREATE POLICY "Sync logs are universally readable" ON sync_logs FOR SELECT USING (true);

-- Permitir inserción a los logs (para ejecución desde scripts/functions)
DROP POLICY IF EXISTS "Sync logs are universally insertable" ON sync_logs;
CREATE POLICY "Sync logs are universally insertable" ON sync_logs FOR INSERT WITH CHECK (true);

-- 4. Habilitar Replicación Realtime de Supabase
-- Nos aseguramos que la publicación de realtime exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Agregamos las tablas a la publicación de realtime de forma segura
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS matches;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sync_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_logs;

-- 5. Configurar Schedulers (Opcional - Requiere habilitar pg_cron en Dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('sync-live-matches-cron', '*/1 * * * *', $$ SELECT net.http_post(url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-live-matches') $$);
-- SELECT cron.schedule('sync-standings-cron', '*/10 * * * *', $$ SELECT net.http_post(url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-standings') $$);
-- SELECT cron.schedule('sync-rankings-cron', '0 */6 * * *', $$ SELECT net.http_post(url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-rankings') $$);
