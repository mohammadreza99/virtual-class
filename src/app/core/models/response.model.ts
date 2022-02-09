type SortType = 'Asc' | 'Desc';
type StatusType =
  'OK'
  | 'ERROR_GENERIC'
  | 'NOT_FOUND'
  | 'WRONG_CREDENTIAL'
  | 'UNAUTHENTICATED'
  | 'ACCESS_DENIED'
  | 'DUPLICATED'
  | 'NOT_EMPTY'
  | 'EMPTY'
  | 'RESET_PASSWORD'
  | 'JANUS_ERROR'
  | 'SESSION_ERROR';

export interface SearchParam {
  search?: string;
  page?: number;
  limit?: number;
  order_by?: string;
  order_type?: SortType;
}

export interface BaseRes<T> {
  data: T;
  status: StatusType;
  status_det: string;
}

interface OutputMeta {
  total?: number;
}

export interface ListRes<T> {
  items: T[];
  meta?: OutputMeta;
}

export interface PagerRes<T> {
  items: T[];
  total: number;
}



