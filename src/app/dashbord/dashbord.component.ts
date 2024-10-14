import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DashbordService } from './dashbord.service';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit {
  totalPlots: number = 0;
  totalArea: number = 0;
  totalProduction: number = 0;
  totalIncome: number = 0;
  totalExpenses: number = 0;
  netProfit: number = 0;
  userId: string = '';
  selectedYear: number = new Date().getFullYear(); // ปีที่เลือกสำหรับการเงิน
  availableYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private dashbordService: DashbordService,
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    
    // ดึงสถิติการเกษตร
    this.dashbordService.getStats(this.userId).subscribe((data) => {
      this.totalPlots = data.totalPlots || 0;
      this.totalArea = data.totalArea || 0;
      this.totalProduction = data.totalProduction || 0;
    });

    // ดึงปีที่มีการเก็บเกี่ยว
    this.dashbordService.availableYears(this.userId).subscribe(data => {
      this.availableYears = data.map((year: any) => year.year);
      this.fetchFinancialData(this.selectedYear); // ดึงข้อมูลการเงินเมื่อปีพร้อม
    });
  }

  // ฟังก์ชันดึงข้อมูลการเงิน
  fetchFinancialData(year: number) {
    this.dashbordService.financialData(year, this.userId).subscribe(data => {
      this.totalIncome = data.summary.totalIncome || 0; // ตรวจสอบว่ามีค่าเป็นศูนย์
      this.totalExpenses = data.summary.totalExpenses || 0; // ตรวจสอบว่ามีค่าเป็นศูนย์
      this.netProfit = data.summary.totalProfit || 0; // ตรวจสอบว่ามีค่าเป็นศูนย์
    });
  }

  // ฟังก์ชันสำหรับการเปลี่ยนปีที่เลือก
  onYearChange(year: string) {
    this.selectedYear = +year; // แปลงเป็น number
    this.fetchFinancialData(this.selectedYear);
  }
}
