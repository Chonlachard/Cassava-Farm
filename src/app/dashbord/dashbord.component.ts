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
  incomeExpense: any = {};
  monthlyIncomeExpense: any[] = [];
  userId: string = '';

  chartData: any;  // ✅ เก็บข้อมูลกราฟ
  chartOptions: any; // ✅ ตั้งค่า Chart Options

  // ✅ ชื่อเดือนภาษาไทย
  monthNames: string[] = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  constructor(private dashbordService : DashbordService) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') ?? ''; // ดึงค่า userId จาก localStorage
    this.loadAvailableYears(); // โหลดปีที่เลือกได้

    if (this.userId) {
      this.loadCashFlowReport(); // โหลดข้อมูลหากมี userId
    } else {
      console.error('❌ ไม่พบ User ID');
    }
  }

   // ✅ สร้างรายการปีที่เลือกได้ (5 ปีล่าสุด)
   loadAvailableYears(): void {
    this.userId = localStorage.getItem('userId') || '';
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  // ✅ โหลดข้อมูลจาก API ตามปีที่เลือก
  loadCashFlowReport(): void {
    this.dashbordService.getCashFlowReport(this.userId, this.selectedYear).subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.incomeExpense = data.IncomExpent;
        this.monthlyIncomeExpense = data.monthlyIncomeExpense;
        this.updateChart(); // ✅ อัปเดตข้อมูลกราฟ
      },
      error: (err) => console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูลกระแสเงินสด:', err),
    });
  }
  updateChart(): void {
    this.chartData = {
      labels: this.monthlyIncomeExpense.map(item => this.getMonthName(item.month)), // ✅ ใช้ชื่อเดือนแทนตัวเลข
      datasets: [
        {
          label: 'รายรับ (บาท)',
          data: this.monthlyIncomeExpense.map(item => item.totalIncome),
          backgroundColor: '#42A5F5'
        },
        {
          label: 'รายจ่าย (บาท)',
          data: this.monthlyIncomeExpense.map(item => item.totalExpense),
          backgroundColor: '#FF6384'
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }

   // ✅ ฟังก์ชันแปลงตัวเลขเดือนเป็นชื่อเดือน
  getMonthName(monthNumber: number): string {
    return this.monthNames[monthNumber - 1] || 'ไม่ระบุเดือน'; // ✅ ลบ 1 เพราะ Array เริ่มที่ index 0
  }
}
