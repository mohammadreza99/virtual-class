import {Component, ContentChild, Input, OnInit, Output, TemplateRef, EventEmitter, ElementRef} from '@angular/core';
import {TableConfig} from '@core/models';
import {NgSize} from '@ng/models/offset';

@Component({
  selector: 'ng-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
})
export class CustomTableComponent implements OnInit {

  constructor(private el: ElementRef) {
  }

  @Input() rowData: any[];
  @Input() config: TableConfig;
  @Input() showCaption: boolean;
  @Input() captionText: string;
  @Input() captionIcon: string;
  @Input() size: NgSize = 'sm';
  @ContentChild(TemplateRef, {read: TemplateRef}) tableBody: TemplateRef<any>;

  searchTerm: string;

  ngOnInit(): void {
  }

  async sortColumn(event: any) {
    const data = await this.config.onFetch({order_by: event.field, order_type: event.order === 1 ? 'Asc' : 'Desc'});
    this.rowData.length = 0;
    this.rowData.push(...data.items);
  }

  async onSearch() {
    if (this.searchTerm) {
      const data = await this.config.onFetch({search: this.searchTerm});
      this.rowData = data.items;
    } else {
      await this.reloadData();
    }
  }

  async onActionClick(action: string) {
    switch (action) {
      case 'onReload':
        await this.reloadData();
        break;
      default:
        this.config[action]();
        break;
    }
  }

  async toggleSearch() {
    const searchElement = this.el.nativeElement.querySelector('.table-search') as HTMLElement;
    const opened = searchElement.classList.toggle('open');
    if (opened) {
      searchElement.querySelector('input').focus();
    } else {
      searchElement.querySelector('input').blur();
      this.searchTerm = null;
      await this.reloadData();
    }
  }

  async reloadData() {
    const data = await this.config.onFetch({page: 1, limit: 10});
    this.rowData = data.items;
  }

  async onPageChange(event: any) {
    const data = await this.config.onFetch({page: event.page + 1, limit: 10});
    this.rowData = data.items;
  }
}
