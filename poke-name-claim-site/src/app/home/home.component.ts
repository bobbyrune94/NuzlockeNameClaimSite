import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  streamers = [
    {
      "name": "Kungfu_Kenny98",
      "claimsTableName": "KungFuKrewClaimsTable"
    },
    {
      "name": "TerribleTavi",
      "claimsTableName": "Ta6sTerribleServerClaimsTable"
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
