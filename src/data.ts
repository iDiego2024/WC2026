import { Team, Match } from './types';

export const TEAMS: Team[] = [
  { id: 'ARG', name: 'Argentina', flagCode: 'ar', group: 'A', fifaRank: 1, continent: 'South America' },
  { id: 'FRA', name: 'France', flagCode: 'fr', group: 'A', fifaRank: 2, continent: 'Europe' },
  { id: 'MEX', name: 'Mexico', flagCode: 'mx', group: 'A', fifaRank: 15, continent: 'North America' },
  { id: 'USA', name: 'United States', flagCode: 'us', group: 'A', fifaRank: 11, continent: 'North America' },
  { id: 'BRA', name: 'Brazil', flagCode: 'br', group: 'B', fifaRank: 5, continent: 'South America' },
  { id: 'ENG', name: 'England', flagCode: 'gb-eng', group: 'B', fifaRank: 3, continent: 'Europe' },
  { id: 'ESP', name: 'Spain', flagCode: 'es', group: 'B', fifaRank: 8, continent: 'Europe' },
  { id: 'POR', name: 'Portugal', flagCode: 'pt', group: 'B', fifaRank: 6, continent: 'Europe' },
];

export const MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeamId: 'MEX',
    awayTeamId: 'USA',
    date: '2026-06-11T12:00:00Z',
    stadium: 'Azteca Stadium',
    group: 'A',
    stage: 'Group Stage',
    status: 'scheduled',
  },
  {
    id: 'm2',
    homeTeamId: 'ARG',
    awayTeamId: 'FRA',
    date: '2026-06-12T15:00:00Z',
    stadium: 'MetLife Stadium',
    group: 'A',
    stage: 'Group Stage',
    status: 'scheduled',
  },
  {
    id: 'm3',
    homeTeamId: 'BRA',
    awayTeamId: 'ENG',
    date: '2026-06-13T19:00:00Z',
    stadium: 'SoFi Stadium',
    group: 'B',
    stage: 'Group Stage',
    status: 'scheduled',
  },
  {
    id: 'm4',
    homeTeamId: 'ESP',
    awayTeamId: 'POR',
    date: '2026-06-14T17:00:00Z',
    stadium: 'AT&T Stadium',
    group: 'B',
    stage: 'Group Stage',
    status: 'scheduled',
  }
];

export const getTeam = (id: string) => TEAMS.find(t => t.id === id);
