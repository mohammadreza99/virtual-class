import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'ng-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
})
export class EmptyComponent implements OnInit {
  @Input() message: string;
  @Input() imageSrc: string = './assets/images/users.svg';

  constructor() {
  }

  ngOnInit(): void {
  }
}
