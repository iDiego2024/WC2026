import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.RAPIDAPI_KEY || '';
const baseDomain = "https://v3.football.api-sports.io";
const headers = { "x-apisports-key": apiKey };

async function getTeams() {
  const res = await fetch(`${baseDomain}/teams?league=1&season=2022`, { headers });
  const body = await res.json();
  const teams = body?.response || [];
  
  console.log('--- 2022 TEAMS ---');
  for (const t of teams) {
    console.log(`  "${t.team.code}": ${t.team.id}, // ${t.team.name}`);
  }
}

getTeams().catch(console.error);
