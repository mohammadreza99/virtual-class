import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';

@Component({
  selector: 'ng-grid-view',
  templateUrl: './grid-view.component.html',
  styleUrls: ['./grid-view.component.scss']
})
export class GridViewComponent implements OnChanges {

  constructor() {
  }

  @Input() allUsers: RoomUser[];
  @Input() users: RoomUser[];

  ngOnChanges(): void {
    this.getColumnTemplate();
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }

  getColumnTemplate() {
    const usersCount = this.allUsers.length;
    if (usersCount == 1) {
      return 'g-full';
    } else if (usersCount >= 2 && usersCount <= 4) {
      return 'g-four';
    } else if (usersCount >= 5 && usersCount <= 9) {
      return 'g-nine';
    } else if (usersCount >= 10 && usersCount <= 16) {
      return 'g-sixteen';
    } else if (usersCount >= 17) {
      return 'g-twenty-five';
    }
  }

}
