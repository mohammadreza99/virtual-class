export type UserRole = 'Owner' | 'User';
export type Gender = 'Male' | 'Female' | 'None';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  nick_name: string;
  email: string;
  phone_number: string;
  company_id?: number;
  sex?: Gender;
  username?: string;
  role?: UserRole;
  hashed_password?: string;
  active?: boolean;
  state?: string;
  avatar?: string;
}

interface UserGroupRelItem {
  id: number;
  company_id: number;
  name: string;
  user_count: number;
  active: boolean;
}

interface UserRoomRelItem {
  id: number;
  name: string;
  role: string;
}

export interface UserRelation {
  rooms: UserRoomRelItem[];
  groups: UserGroupRelItem[];
}

