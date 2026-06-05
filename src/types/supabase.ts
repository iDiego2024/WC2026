export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          code: string
          name: string
          flag_code: string
          group_name: string | null
          fifa_rank: number | null
          continent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          flag_code: string
          group_name?: string | null
          fifa_rank?: number | null
          continent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          flag_code?: string
          group_name?: string | null
          fifa_rank?: number | null
          continent?: string | null
          created_at?: string
        }
      }
      stadiums: {
        Row: {
          id: string
          name: string
          city: string
          capacity: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city: string
          capacity?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          capacity?: number | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          home_team_id: string | null
          away_team_id: string | null
          date: string
          stadium_id: string | null
          group_name: string | null
          stage: string
          status: 'scheduled' | 'live' | 'finished'
          home_score: number | null
          away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_team_id?: string | null
          away_team_id?: string | null
          date: string
          stadium_id?: string | null
          group_name?: string | null
          stage: string
          status?: 'scheduled' | 'live' | 'finished'
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string | null
          away_team_id?: string | null
          date?: string
          stadium_id?: string | null
          group_name?: string | null
          stage?: string
          status?: 'scheduled' | 'live' | 'finished'
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string | null
          photo_url: string | null
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          photo_url?: string | null
          score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          email?: string | null
          photo_url?: string | null
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      match_predictions: {
        Row: {
          id: string
          user_id: string | null
          match_id: string | null
          home_score: number
          away_score: number
          points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          match_id?: string | null
          home_score: number
          away_score: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          match_id?: string | null
          home_score?: number
          away_score?: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      private_leagues: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          invite_code?: string
          created_at?: string
        }
      }
      league_members: {
        Row: {
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          league_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_status: 'scheduled' | 'live' | 'finished'
      match_stage:
        | 'Group Stage'
        | 'Round of 32'
        | 'Round of 16'
        | 'Quarterfinals'
        | 'Semifinals'
        | 'Final'
        | 'Third Place'
    }
  }
}
