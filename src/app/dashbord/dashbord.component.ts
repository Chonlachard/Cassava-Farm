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
  categoryExpents: any[] = [];
  formattedExpenses: any[] = [];
  totalExpense = 0;
  expenseDetails: any[] = [];
  expenseList: any[] = [];

  pieChartOptions : any;
  pieChartData : any;

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
        this.categoryExpents = data.categoryExpents;
        this.expenseDetails = data.expenseDetails;
        this.updateExpenses();
        this.updateChart(); // ✅ อัปเดตข้อมูลกราฟ
      },
      error: (err) => console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูลกระแสเงินสด:', err),
    });
  }

  updateExpenses(): void {
    if (!this.expenseDetails || this.expenseDetails.length === 0) {
      this.expenseList = [];
      this.totalExpense = 0;
      return;
    }
  
    // ✅ คำนวณยอดรวมของรายจ่ายทั้งหมด
    this.totalExpense = this.expenseDetails.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
  
    // ✅ ฟอร์แมตรายจ่ายเพื่อใช้ในตาราง
    this.expenseList = this.expenseDetails.map((item) => ({
      expense_detail: item.expense_detail,
      total_amount: parseFloat(item.total_amount),
      percentage_of_expense: parseFloat(item.percentage_of_expense).toFixed(2),
    }));
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

    this.pieChartData = {
      labels: this.categoryExpents.map(item => item.expenseCategory), // ชื่อประเภทค่าใช้จ่าย
      datasets: [
        {
          data: this.categoryExpents.map(item => item.totalAmount), // ยอดรวมของแต่ละประเภท
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800', '#795548'], // สีที่ใช้ในกราฟ
        }
      ]
    };

    this.pieChartOptions = {
      responsive: true, // ✅ ปรับขนาด Pie Chart ให้ตอบสนองตามหน้าจอ
      maintainAspectRatio: false, // ✅ ป้องกันไม่ให้กราฟถูกบีบ
      layout: {
        padding: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
        } // ✅ เพิ่ม padding รอบกราฟเพื่อให้ดูสวยขึ้น
      },
      plugins: {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                font: {
                    size: 14  // ✅ ขยายขนาดตัวอักษร
                },
                padding: 20, // ✅ เพิ่มระยะห่างของ legend
                boxWidth: 20  // ✅ ขยายขนาดกล่องสีใน legend
            }
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              let value = context.raw;
              let total = context.chart.data.datasets[0].data.reduce((a: any, b: any) => a + b, 0);
              let percentage = ((value / total) * 100).toFixed(2) + "%";
              return `${context.label}: ${value.toLocaleString()} บาท (${percentage})`;
            }
          }
        }
      }
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
