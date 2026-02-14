export interface Pool {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface PoolMember {
  id: string
  pool_id: string
  user_id: string
  role: 'admin' | 'member'
  points: number
  joined_at: string
}

export interface Invite {
  id: string
  pool_id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: 'pool_invite' | 'race_reminder' | 'points_update'
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
  metadata: Record<string, any> | null
}

// Renamed Race to Meeting
export interface Meeting {
  id: string
  meeting_key: number
  meeting_name: string
  meeting_official_name: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  country_flag: string | null
  circuit_key: number
  circuit_short_name: string
  circuit_type: string
  circuit_image: string | null
  gmt_offset: string
  date_start: string
  date_end: string
  year: number
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  session_key: number
  session_type: 'Practice' | 'Qualifying' | 'Race'
  session_name: string
  date_start: string
  date_end: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  country_key: number
  country_code: string
  country_name: string
  location: string
  gmt_offset: string
  year: number
  created_at: string
  updated_at: string
}

export interface NextEvent {
  session: Session
  meeting: Meeting // Changed from Race
}

export interface PredictionAvailability {
  canPredict: boolean
  reason?: string
}

export interface Driver {
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url: string | null
  session_key: number
  meeting_key: number
}

export interface Prediction {
  id: string
  user_id: string
  race_id: string
  position_1: number
  position_2: number
  position_3: number
  position_4: number
  position_5: number
  position_6: number
  position_7: number
  position_8: number
  position_9: number
  position_10: number
  created_at: string
  updated_at: string
}
