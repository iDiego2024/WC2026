#!/usr/bin/env python3
"""
WC2026 Real Fixture Seeder
Carga los 104 fixtures reales del Mundial 2026 desde fixturedownload.com
"""

import json
import sys
import ssl
import subprocess
import urllib.request

import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xvtofbktqqfsukxzylkt.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
MANAGEMENT_API_TOKEN = os.environ.get("MANAGEMENT_API_TOKEN", "")
PROJECT_ID = os.environ.get("PROJECT_ID", "xvtofbktqqfsukxzylkt")

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

def mgmt_query(sql: str):
    url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {MANAGEMENT_API_TOKEN}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        return json.loads(r.read())

def fetch_fixtures():
    result = subprocess.run(
        ["curl", "-s", "https://fixturedownload.com/feed/json/fifa-world-cup-2026",
         "-H", "User-Agent: Mozilla/5.0 WC2026-Seeder/1.0"],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        raise Exception(f"curl failed: {result.stderr}")
    return json.loads(result.stdout)

# Map stadiums
STADIUM_MAP = {
    "New York/New Jersey Stadium": ("MetLife Stadium", "East Rutherford, NJ", 82500),
    "Los Angeles Stadium": ("SoFi Stadium", "Los Angeles, CA", 70240),
    "Dallas Stadium": ("AT&T Stadium", "Arlington, TX", 80000),
    "San Francisco Bay Area Stadium": ("Levi's Stadium", "Santa Clara, CA", 68500),
    "Miami Stadium": ("Hard Rock Stadium", "Miami, FL", 64767),
    "Atlanta Stadium": ("Mercedes-Benz Stadium", "Atlanta, GA", 71000),
    "Seattle Stadium": ("Lumen Field", "Seattle, WA", 68740),
    "Houston Stadium": ("NRG Stadium", "Houston, TX", 72220),
    "Philadelphia Stadium": ("Lincoln Financial Field", "Philadelphia, PA", 69796),
    "Kansas City Stadium": ("Arrowhead Stadium", "Kansas City, MO", 76416),
    "Boston Stadium": ("Gillette Stadium", "Foxborough, MA", 65878),
    "BC Place Vancouver": ("BC Place", "Vancouver, BC", 54500),
    "Toronto Stadium": ("BMO Field", "Toronto, ON", 30000),
    "Mexico City Stadium": ("Estadio Azteca", "Mexico City, MX", 87523),
    "Monterrey Stadium": ("Estadio BBVA", "Monterrey, MX", 53500),
    "Guadalajara Stadium": ("Estadio Akron", "Guadalajara, MX", 47019),
}

ROUND_MAP = {
    1: "Group Stage",
    2: "Group Stage",
    3: "Group Stage",
    4: "Round of 32",
    5: "Round of 16",
    6: "Quarter-finals",
    7: "Semi-finals",
    8: "Final",
}

print("🌍 WC2026 Real Fixture Seeder")
print("=" * 50)

# Step 1: Fetch fixtures
print("\n1. Fetching fixtures from fixturedownload.com...")
fixtures = fetch_fixtures()
group_fixtures = [f for f in fixtures if f.get("Group")]
print(f"   ✅ {len(group_fixtures)} group stage fixtures, {len(fixtures)-len(group_fixtures)} knockout fixtures")

# Step 2: Extract unique teams and stadiums from group stage
print("\n2. Building team & stadium lists...")
teams = set()
stadiums = {}
for f in fixtures:
    if f.get("HomeTeam") and f["HomeTeam"] not in ("To be announced",) and not f["HomeTeam"].startswith(("1","2","3")):
        teams.add(f["HomeTeam"])
    if f.get("AwayTeam") and f["AwayTeam"] not in ("To be announced",) and not f["AwayTeam"].startswith(("1","2","3")):
        teams.add(f["AwayTeam"])
    if f.get("Location"):
        loc = f["Location"]
        if loc not in stadiums and loc in STADIUM_MAP:
            name, city, cap = STADIUM_MAP[loc]
            stadiums[loc] = {"name": name, "city": city, "capacity": cap}

print(f"   ✅ {len(teams)} teams, {len(stadiums)} stadiums")

# Step 3: Clear existing synthetic data
print("\n3. Clearing synthetic data (api_id like 202%...)...")
res = mgmt_query("DELETE FROM matches WHERE CAST(api_id AS TEXT) LIKE '2026%' OR api_id IS NULL;")
print(f"   ✅ Cleared: {res}")

# Step 4: Upsert groups
print("\n4. Upserting groups A-L...")
groups_sql = """
INSERT INTO groups (id, name) VALUES
  ('A','Grupo A'),('B','Grupo B'),('C','Grupo C'),('D','Grupo D'),
  ('E','Grupo E'),('F','Grupo F'),('G','Grupo G'),('H','Grupo H'),
  ('I','Grupo I'),('J','Grupo J'),('K','Grupo K'),('L','Grupo L')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
"""
mgmt_query(groups_sql)
print("   ✅ 12 grupos OK")

# Step 5: Upsert stadiums
print("\n5. Upserting stadiums...")
stadium_db_ids = {}
for loc_key, s in stadiums.items():
    sql = f"""
INSERT INTO stadiums (name, city, capacity)
VALUES ('{s["name"].replace("'","''")}', '{s["city"].replace("'","''")}', {s["capacity"]})
ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city, capacity = EXCLUDED.capacity
RETURNING id, name;
"""
    try:
        res = mgmt_query(sql)
        if res and len(res) > 0:
            stadium_db_ids[loc_key] = res[0]["id"]
    except Exception as e:
        print(f"   ⚠️  Stadium error for {s['name']}: {e}")

print(f"   ✅ {len(stadium_db_ids)} stadiums upserted")

# Step 6: Upsert teams with flag emojis
FLAG_MAP = {
    "United States": "🇺🇸", "Canada": "🇨🇦", "Mexico": "🇲🇽",
    "Brazil": "🇧🇷", "Argentina": "🇦🇷", "Uruguay": "🇺🇾", "Colombia": "🇨🇴",
    "Ecuador": "🇪🇨", "Paraguay": "🇵🇾", "Venezuela": "🇻🇪",
    "Germany": "🇩🇪", "France": "🇫🇷", "Spain": "🇪🇸", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Portugal": "🇵🇹", "Netherlands": "🇳🇱", "Belgium": "🇧🇪", "Italy": "🇮🇹",
    "Croatia": "🇭🇷", "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Denmark": "🇩🇰",
    "Sweden": "🇸🇪", "Norway": "🇳🇴", "Poland": "🇵🇱", "Ukraine": "🇺🇦",
    "Turkey": "🇹🇷", "Romania": "🇷🇴", "Hungary": "🇭🇺", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Serbia": "🇷🇸", "Slovakia": "🇸🇰", "Czech Republic": "🇨🇿", "Slovenia": "🇸🇮",
    "Albania": "🇦🇱", "Georgia": "🇬🇪", "Iceland": "🇮🇸",
    "Japan": "🇯🇵", "South Korea": "🇰🇷", "Australia": "🇦🇺", "Iran": "🇮🇷",
    "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦", "UAE": "🇦🇪", "Iraq": "🇮🇶",
    "Uzbekistan": "🇺🇿", "Jordan": "🇯🇴",
    "Senegal": "🇸🇳", "Morocco": "🇲🇦", "Egypt": "🇪🇬", "Nigeria": "🇳🇬",
    "Cameroon": "🇨🇲", "Ghana": "🇬🇭", "Tunisia": "🇹🇳", "Algeria": "🇩🇿",
    "Congo DR": "🇨🇩", "South Africa": "🇿🇦",
    "New Zealand": "🇳🇿", "Panama": "🇵🇦", "Costa Rica": "🇨🇷",
    "Honduras": "🇭🇳", "Jamaica": "🇯🇲", "Curacao": "🇨🇼",
    "Bolivia": "🇧🇴", "Cuba": "🇨🇺",
}

# Group map for teams
TEAM_GROUP = {}
for f in fixtures:
    grp = f.get("Group", "")
    if grp and grp.startswith("Group "):
        g_letter = grp.replace("Group ", "")
        for t in [f.get("HomeTeam"), f.get("AwayTeam")]:
            if t and not t.startswith(("1","2","3","To")):
                TEAM_GROUP[t] = g_letter

print(f"\n6. Upserting {len(teams)} teams...")
team_db_ids = {}
for team_name in sorted(teams):
    code = team_name[:3].upper()
    flag = FLAG_MAP.get(team_name, "🌍")
    group_id = TEAM_GROUP.get(team_name, "A")
    sql = f"""
INSERT INTO teams (name, code, flag_code, group_id)
VALUES ('{team_name.replace("'","''")}', '{code}', '{flag}', '{group_id}')
ON CONFLICT (name) DO UPDATE SET code=EXCLUDED.code, flag_code=EXCLUDED.flag_code, group_id=EXCLUDED.group_id
RETURNING id, name;
"""
    try:
        res = mgmt_query(sql)
        if res and len(res) > 0:
            team_db_ids[team_name] = res[0]["id"]
    except Exception as e:
        print(f"   ⚠️  Team error for {team_name}: {e}")

print(f"   ✅ {len(team_db_ids)} teams upserted")

# Step 7: Upsert matches
print(f"\n7. Upserting {len(fixtures)} matches...")
inserted = 0
for f in fixtures:
    home = f.get("HomeTeam", "")
    away = f.get("AwayTeam", "")
    home_id = team_db_ids.get(home)
    away_id = team_db_ids.get(away)
    
    location = f.get("Location", "")
    stadium_id = stadium_db_ids.get(location)
    
    date_str = f.get("DateUtc", "").replace("Z", "+00")
    round_num = f.get("RoundNumber", 1)
    match_num = f.get("MatchNumber", 0)
    stage = ROUND_MAP.get(round_num, "Group Stage")
    
    home_score = f.get("HomeTeamScore")
    away_score = f.get("AwayTeamScore")
    
    # Determine status from scores
    if home_score is not None and away_score is not None:
        status = "finished"
    else:
        status = "scheduled"
    
    group_id = None
    grp = f.get("Group", "")
    if grp and grp.startswith("Group "):
        group_id = f"'{grp.replace('Group ', '')}'"
    else:
        group_id = "NULL"
    
    home_id_sql = f"'{home_id}'" if home_id else "NULL"
    away_id_sql = f"'{away_id}'" if away_id else "NULL"
    stadium_id_sql = f"'{stadium_id}'" if stadium_id else "NULL"
    home_score_sql = str(home_score) if home_score is not None else "NULL"
    away_score_sql = str(away_score) if away_score is not None else "NULL"
    location_clean = location.replace("'","''")
    stage_clean = stage.replace("'","''")
    
    sql = f"""
INSERT INTO matches (home_team_id, away_team_id, stadium_id, date, stage, status, home_score, away_score, api_id, group_id)
VALUES ({home_id_sql}, {away_id_sql}, {stadium_id_sql}, '{date_str}', '{stage_clean}', '{status}', {home_score_sql}, {away_score_sql}, {match_num}, {group_id})
ON CONFLICT (api_id) DO UPDATE SET
  home_team_id=EXCLUDED.home_team_id,
  away_team_id=EXCLUDED.away_team_id,
  stadium_id=EXCLUDED.stadium_id,
  date=EXCLUDED.date,
  stage=EXCLUDED.stage,
  status=EXCLUDED.status,
  home_score=EXCLUDED.home_score,
  away_score=EXCLUDED.away_score;
"""
    try:
        mgmt_query(sql)
        inserted += 1
    except Exception as e:
        print(f"   ⚠️  Match {match_num} error: {e}")

print(f"   ✅ {inserted} matches upserted")

# Step 8: Final status
print("\n8. Final verification...")
res = mgmt_query("""
SELECT 
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM teams) as teams,
  (SELECT COUNT(*) FROM groups) as groups,
  (SELECT COUNT(*) FROM stadiums) as stadiums,
  (SELECT COUNT(*) FROM matches WHERE status='finished') as finished,
  (SELECT COUNT(*) FROM matches WHERE status='scheduled') as scheduled;
""")
print(f"   📊 DB State: {res[0]}")
print("\n✅ WC2026 REAL DATA LOADED SUCCESSFULLY!")
