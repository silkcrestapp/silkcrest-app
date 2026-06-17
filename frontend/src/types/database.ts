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
  speed?: number;
  stamina?: number;
  power?: number;
  guts?: number;
  intelligence?: number;
  spurt?: number;
  flexibility?: number;
  health?: number;
  growth_type?: string;
}

// Joined shape returned by Supabase when fetching horses with owner details
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
  race_week?: 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4' | 'Week 5';
}

export interface RaceEntry {
  id: string;
  race_id: string;
  horse_id: string;
  race_year: number;
  finish_position?: number;
  finish_time?: number;
  gate_number?: number;
  jockey?: string;
  odds?: number;
}

// Joined shape returned by Supabase when fetching race entries with race details
export interface RaceEntryWithRace extends RaceEntry {
  races: Race;
}