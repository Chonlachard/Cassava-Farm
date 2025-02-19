import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { DashbordService } from './dashbord.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesDetailComponent } from '../expenses-detail/expenses-detail.component';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit {
  summary: any = {}; 
  selectedYear: number = new Date().getFullYear(); 
  availableYears: number[] = []; 
  incomeExpense: any = {};
  monthlyIncomeExpense: any[] = [];
  userId: string = '';
  categoryExpents: any[] = [];
  formattedExpenses: any[] = [];
  totalExpense = 0;
  expenseDetails: any[] = [];
  expenseList: any[] = [];
  selectedExpense: any = null; // ✅ เพิ่มตัวแปรสำหรับเก็บข้อมูลที่เลือก
  showPopup: boolean = false; // ✅ ควบคุมการเปิด/ปิด Popup
  selectedCategory: string = ''; // ✅ หมวดหมู่ที่เลือก

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // ✅ กำหนดค่าเริ่มต้นให้ startMonth และ endMonth
  startMonth: number = 1;
  endMonth: number = 12;

  availableMonths = [
    { value: 1, label: "มกราคม" }, { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" }, { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" }, { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" }, { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" }, { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" }, { value: 12, label: "ธันวาคม" }
  ];

  pieChartOptions: any;
  pieChartData: any;
  chartData: any;
  chartOptions: any;

  monthNames: string[] = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  constructor(private dashbordService: DashbordService,private cdRef: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') ?? ''; 
    this.loadAvailableYears(); 

    if (this.userId) {
      this.loadCashFlowReport(); 
    } else {
      console.error('❌ ไม่พบ User ID');
    }
  }

  // ✅ โหลดรายการปีที่เลือกได้ (5 ปีล่าสุด)
  loadAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  // ✅ โหลดข้อมูลจาก API ตามปีที่เลือกและช่วงเดือน
  loadCashFlowReport(): void {
    // ✅ ป้องกัน `startMonth` และ `endMonth` เป็น NaN
    if (Number.isNaN(this.startMonth) || Number.isNaN(this.endMonth)) {
      console.error("❌ ค่าของ startMonth หรือ endMonth ไม่ถูกต้อง:", { startMonth: this.startMonth, endMonth: this.endMonth });
      return;
    }

    this.dashbordService.getCashFlowReport(this.userId, this.selectedYear, this.startMonth, this.endMonth).subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.incomeExpense = data.IncomExpent;
        this.monthlyIncomeExpense = data.monthlyIncomeExpense;
        this.categoryExpents = data.categoryExpents;
        this.expenseDetails = data.expenseDetails;
        this.updateExpenses();
        this.updateChart();
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

  // ✅ ฟังก์ชันแปลงตัวเลขเดือนเป็นชื่อเดือน
  getMonthName(monthNumber: number): string {
    return this.monthNames[monthNumber - 1] || 'ไม่ระบุเดือน';
  }

  selectExpense(expense: any) {
    this.selectedCategory = expense.expense_detail;
    this.showPopup = true;
  }

  updateChart(): void {
    this.chartData = {
      labels: this.monthlyIncomeExpense.map(item => this.getMonthName(item.month)), 
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
      labels: this.categoryExpents.map(item => item.expenseCategory),
      datasets: [
        {
          data: this.categoryExpents.map(item => item.totalAmount),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800', '#795548']
        }
      ]
    };

    this.pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      },
      layout: {
        padding: { top: 30, bottom: 30, left: 30, right: 30 }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { font: { size: 14 }, padding: 15, boxWidth: 20 }
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
      aspectRatio: 1,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      },
      hover: { 
        mode: 'nearest', 
        intersect: true 
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14 },
            padding: 10,
            color: "#333",
            usePointStyle: true,
            boxWidth: 10
          },
          onClick: (e: any, legendItem: any, legend: any) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            ci.getDatasetMeta(index).hidden = ci.getDatasetMeta(index).hidden === null ? !ci.data.datasets[index].hidden : null;
            ci.update();
          }
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function (context: any) {
              let value = context.raw.toLocaleString();
              return `${context.label}: ${value} บาท`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            drawBorder: false,
            color: "rgba(0, 0, 0, 0.1)"
          },
          title: {
            display: true,
            text: "เดือน",
            font: { size: 16, weight: 'bold' }
          },
          ticks: { font: { size: 14 } }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "จำนวนเงิน (บาท)",
            font: { size: 16, weight: 'bold' }
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
            borderColor: "rgba(0, 0, 0, 0.2)",
            borderDash: [5, 5]
          },
          ticks: {
            font: { size: 14 },
            callback: function (value: number) {
              return value.toLocaleString() + " บาท";
            }
          }
        }
      }
    };
  }

  // ✅ ฟังก์ชันเลือกหมวดหมู่และเปิด Popup
  openPopup(category: string) {
    this.dialog.open(ExpensesDetailComponent, {
      width: '600px', // ✅ กำหนดขนาด Dialog
      data: {
        userId: this.userId,
        selectedCategory: category,
        selectedYear: new Date().getFullYear(),
        startMonth: 1,
        endMonth: 12
      }
    });
  }
  
  
  

  // ✅ ฟังก์ชันปิด Popup
  closePopup() {
    this.showPopup = false;
  }
}
