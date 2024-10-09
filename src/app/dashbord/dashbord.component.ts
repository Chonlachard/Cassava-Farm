import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DashbordService } from './dashbord.service';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'], // แก้ไขเป็น styleUrls
})
export class DashbordComponent implements OnInit {
  totalPlots: number = 0;
  totalArea: number = 0;
  totalProduction: number = 0;
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private dashbordService: DashbordService,
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.dashbordService.getStats(this.userId).subscribe((data) => {
      this.totalPlots = data.totalPlots || 0;
      this.totalArea = data.totalArea || 0;
      this.totalProduction = data.totalProduction || 0;
    });
  }
}
