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