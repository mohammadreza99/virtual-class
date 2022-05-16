export interface Group {
  id: number;
  company_id: number;
  name: string;
  user_count: number;
  room_count: number;
  active: boolean;
}

interface GroupRelItem {
  name: string;
  users: number;
  role: string;
}

export interface GroupRelation {
  rooms: GroupRelItem[];
}
