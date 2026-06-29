export interface SaveFile {
  id: string;
  name: string;
  created_at: string;
}

export interface SaveOwner {
  save_id: string;
  owner_id: string;
}

export interface Owner {
  id: string;
  display_name: string;
  display_name_jp?: string;
  silks_color?: string;
  silks_pattern?: string;
}

export interface Horse {
  id: string;
  save_id: string;           // ← new
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
  save_id: string;           // ← new
  race_id: string;
  horse_id: string;
  race_year: number;
  finish_position?: number;
  finish_time?: number;
  gate_number?: number;
  number_of_runners?: number;
  jockey?: string;
  odds?: number;
  favorite_ranking?: number;
  created_at?: string;
}

export interface RaceEntryWithRace extends RaceEntry {
  races: Race;
}

export interface SaveContextValue {
  saves: SaveFile[];
  activeSaveId: string | null;
  activeSaveName: string | null;
  setSave: (save: SaveFile) => void;
  clearSave: () => void;
  loadingSaves: boolean;
}

export interface PendingHorseName {
  id: string;
  owner_id: string;
  save_id: string;
  name: string;
  name_jp?: string;
  sort_order?: number | null;
  horse_id?: string | null;
  created_at: string;
}