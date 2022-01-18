import {SearchParam} from '@core/models/response.model';

interface ColDef {
  header: string;
  sortField?: string;
}

export interface TableConfig {
  colDef?: ColDef[];
  total?: number;
  onSearch?: (value: string) => Promise<any>;
  onReload?: () => Promise<any>;
  onDownload?: () => Promise<any>;
  onAdd?: () => Promise<any>;
  onFilter?: () => Promise<any>;
  onSort?: () => Promise<any>;
  onFetch?: (data: SearchParam) => Promise<any>;
}
