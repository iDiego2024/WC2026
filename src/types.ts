export type Team = {
  id: string;
  name: string;
  flagCode: string;
  group: string;
  fifaRank: number;
  continent: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  stadium: string;
  group?: string;
  stage: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
};

export type User = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  score: number;
};

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  updatedAt: string;
};

export type League = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: string[];
};
