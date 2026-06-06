-- ===================================================
-- WC2026 - CRON JOBS SETUP
-- Project: xvtofbktqqfsukxzylkt
-- ===================================================

-- sync-fixtures: every day at 06:00 UTC
SELECT cron.schedule(
  'sync-fixtures-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dG9mYmt0cXFmc3VreHp5bGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzE5NDQsImV4cCI6MjA5NjI0Nzk0NH0.GZMFe1zVsvq9p_5LsdQJ4TunYmG1v_N52uB0ZAVYSBs'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- sync-live-matches: every 5 minutes
SELECT cron.schedule(
  'sync-live-matches-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-live-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dG9mYmt0cXFmc3VreHp5bGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzE5NDQsImV4cCI6MjA5NjI0Nzk0NH0.GZMFe1zVsvq9p_5LsdQJ4TunYmG1v_N52uB0ZAVYSBs'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- sync-standings: every day at 07:00 UTC (after fixtures)
SELECT cron.schedule(
  'sync-standings-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-standings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dG9mYmt0cXFmc3VreHp5bGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzE5NDQsImV4cCI6MjA5NjI0Nzk0NH0.GZMFe1zVsvq9p_5LsdQJ4TunYmG1v_N52uB0ZAVYSBs'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- sync-rankings: every Monday at 08:00 UTC
SELECT cron.schedule(
  'sync-rankings-weekly',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://xvtofbktqqfsukxzylkt.supabase.co/functions/v1/sync-rankings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dG9mYmt0cXFmc3VreHp5bGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzE5NDQsImV4cCI6MjA5NjI0Nzk0NH0.GZMFe1zVsvq9p_5LsdQJ4TunYmG1v_N52uB0ZAVYSBs'
    ),
    body := '{}'::jsonb
  );
  $$
);
