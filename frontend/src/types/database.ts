export interface Owner {
  id: string;
  display_name: string;
  display_name_jp?: string;
  silks_color?: string;
  silks_pattern?: string;
}

export interface Horse {
  id: string;
  name?: string;
  name_jp?: string;
  owner_id?: string;
  sire_id?: string;
  dam_id?: string;
  gender?: 'Male' | 'Female' | 'Gelding';
  birth_year: number;
  coat_color?: string;
  bloodline_type?: string;
  growth_type?: string;
  // Stat columns — smallint rank 1–15, or null if unknown
  speed?:        number | null;
  grit?:         number | null;
  power?:        number | null;
  guts?:         number | null;
  intelligence?: number | null;
  spurt?:        number | null;
  flexibility?:  number | null;
  health?:       number | null;
}

export interface HorseWithOwner extends Horse {
  owners: Owner | null;
}

export interface Race {
  id: string;
  name: string;
  name_jp?: string;
  grade?: 'G1' | 'G2' | 'G3' | 'OP' | 'Pre-Open' | 'Maiden';
  surface?: 'Turf' | 'Dirt';
  distance: number;
  racecourse: string;
  racecourse_jp?: string;
  race_month?: number;
  race_week?: 1 | 2 | 3 | 4 | 5;
}

export interface RaceEntry {
  id: string;
  race_id: string;
  horse_id: string;
  race_year: number;
  finish_position: number;
  finish_time?: number;       // float8 stored as seconds, e.g. 83.4
  gate_number?: number;
  number_of_runners?: number;
  jockey?: string;
  odds?: number;
  favorite_ranking?: number;  // 人気
  created_at?: string;        // timestamptz as ISO string
}

export interface RaceEntryWithRace extends RaceEntry {
  races: Race;
}