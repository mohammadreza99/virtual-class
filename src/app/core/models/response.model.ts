type SortType = 'Asc' | 'Desc';

interface OutputMeta {
  total?: number;
}

export interface SearchParam {
  search?: string;
  page?: number;
  limit?: number;
  order_by?: string;
  order_type?: SortType;
}

export interface BaseRes<T> {
  data: T;
  status: string;
  status_det: string;
}

export interface ListRes<T> {
  items: T[];
  meta?: OutputMeta;
}

export interface PagerRes<T> {
  items: T[];
  total: number;
}



