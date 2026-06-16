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
  
  // Winning Post Core 8 Stats
  speed?: number;
  stamina?: number;
  power?: number;
  guts?: number;
  intelligence?: number;
  spurt?: number;
  flexibility?: number;
  health?: number;
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