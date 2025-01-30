import { Component, OnInit } from '@angular/core';
import { DashbordService } from './dashbord.service';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit {
  summary: any = {}; // ✅ เก็บข้อมูลจาก API
  selectedYear: number = new Date().getFullYear(); // ✅ ค่าเริ่มต้นเป็นปีปัจจุบัน
  availableYears: number[] = []; // ✅ เก็บรายการปีที่มีข้อมูล
  incomeExpense: any; // ✅ เก็บข้อมูลรายรับ-รายจ่าย
  chartData: any;
  chartOptions: any;

  constructor(private dashbordService : DashbordService) {}

  ngOnInit(): void {
    this.loadAvailableYears(); // ✅ โหลดปีที่เลือกได้
    this.loadCashFlowReport(); // ✅ โหลดข้อมูลตอนเริ่มต้น
  }
   // ✅ สร้างรายการปีที่เลือกได้ (5 ปีล่าสุด)
   loadAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  // ✅ โหลดข้อมูลจาก API ตามปีที่เลือก
  loadCashFlowReport(): void {
    const userId = localStorage.getItem('userId') || '2'; // ✅ ดึง user_id จาก localStorage
    this.dashbordService.getCashFlowReport(userId, this.selectedYear).subscribe(
      (data) => {
        this.summary = data.summary;
      },
      (error) => console.error('❌ Error loading cash flow data:', error)
    );
  }
  
}
