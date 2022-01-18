import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'ng-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {

  constructor() {
  }

  @Input() width: number = 50;

  ngOnInit(): void {
  }

}
