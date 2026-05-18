// src/types/index.ts
export type MatchPhase = 
  | 'groups'
  | 'round32'      // Dieciseisavos
  | 'round16'      // Octavos
  | 'quarterfinals'
  | 'semifinals'
  | 'thirdplace'
  | 'final';

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: MatchPhase;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
}