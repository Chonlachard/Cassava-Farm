import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DashbordService } from './dashbord.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ExpensesDetailComponent } from '../expenses-detail/expenses-detail.component';
import { FormControl, FormGroup } from '@angular/forms';





export interface PlotInfo {
  plot_id: string;
  plot_name?: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  expenseCategory: { [key: string]: number };
}

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
  cashFlowForm!: FormGroup;
  expenseIncomePlots: any[] = [];
  expenseIncomePlot: PlotInfo[] = [];

  @ViewChild('expenseReportContainer') expenseReportContainer!: ElementRef;
  @ViewChild('plotInfo') plotInfo!: ElementRef;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // ✅ กำหนดค่าเริ่มต้นให้ startMonth และ endMonth
  startDate: string = ''; // ค่าที่เลือก
  endDate: string = '';
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

  constructor(private dashbordService: DashbordService, private cdRef: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') ?? '';

    // ✅ ต้องกำหนดค่าให้ `cashFlowForm` ก่อนใช้งาน
    const today = new Date();
    this.cashFlowForm = new FormGroup({
      startDate: new FormControl(today.toISOString().split('T')[0]), // ค่าเริ่มต้นเป็นวันที่ปัจจุบัน
      endDate: new FormControl(today.toISOString().split('T')[0])    // ค่าเริ่มต้นเป็นวันที่ปัจจุบัน
    });

    if (this.userId) {
      this.loadCashFlowReport();
    } else {
      console.error('❌ ไม่พบ User ID');
    }
  }

  // ✅ โหลดข้อมูลจาก API ตามช่วงวันที่ที่เลือก
  loadCashFlowReport(): void {
    const startDate = this.cashFlowForm.get('startDate')?.value;
    const endDate = this.cashFlowForm.get('endDate')?.value;

    // ✅ ตรวจสอบว่าค่าของ startDate และ endDate ไม่เป็นค่าว่าง
    if (!startDate || !endDate) {
      console.error("❌ ค่าของ startDate หรือ endDate ไม่ถูกต้อง:", { startDate, endDate });
      return;
    }

    console.log(`📌 กำลังโหลดข้อมูลช่วงวันที่: ${startDate} - ${endDate}`);

    this.dashbordService.getCashFlowReport(this.userId, startDate, endDate).subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.incomeExpense = data.IncomExpent;
        this.monthlyIncomeExpense = data.monthlyIncomeExpense;
        this.categoryExpents = data.categoryExpents;
        this.expenseDetails = data.expenseDetails;

        this.expenseIncomePlot = data.ExpenseIncomePlot;
        console.log('expenseIncomePlot', this.expenseIncomePlot);


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
  getMonthName(monthString: string | null | undefined): string {
    if (!monthString || !monthString.includes('-')) {
      return 'ไม่ระบุเดือน';
    }

    // แยกปีและเดือนออกจากกัน (เช่น "2024-05" -> ["2024", "05"])
    const [year, month] = monthString.split('-');

    // แปลงเป็นตัวเลข และตรวจสอบว่าถูกต้องหรือไม่
    const monthNumber = parseInt(month, 10);
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return 'ไม่ระบุเดือน';
    }

    // รายชื่อเดือนภาษาไทย
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return `${monthNames[monthNumber - 1]} ${year}`; // เช่น "พฤษภาคม 2024"
  }

  selectExpense(expense: any) {
    this.selectedCategory = expense.expense_detail;
    this.showPopup = true;
  }

  updateChart(): void {

    let cumulativeDifference = 0;
    const cumulativeData = this.monthlyIncomeExpense.map(item => {
      cumulativeDifference += (item.totalIncome - item.totalExpense);
      return cumulativeDifference;
    });


    this.chartData = {
      labels: this.monthlyIncomeExpense.map(item => this.getMonthName(item.month)),
      datasets: [
        {
          type: 'line',
          label: 'กระแสเงินสดสะสม',  // ✅ แสดงค่าผลต่างแบบสะสม
          data: cumulativeData,  // ✅ ใช้ค่าผลต่างที่สะสมไว้
          borderColor: '#4CAF50',
          borderWidth: 3,
          fill: false,
          pointStyle: 'circle',
          pointRadius: 4,
          pointBackgroundColor: '#4CAF50',
        },
        {
          type: 'bar',
          label: 'รายรับ (บาท)',
          data: this.monthlyIncomeExpense.map(item => item.totalIncome),
          backgroundColor: '#42A5F5',

        },
        {
          type: 'bar',
          label: 'รายจ่าย (บาท)',
          data: this.monthlyIncomeExpense.map(item => -item.totalExpense),
          backgroundColor: '#FF6384',
          opacity: 0.7,

        },

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
          stacked: true,
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
          stacked: true,
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
  scrollToPlotInfo() {
    this.plotInfo.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
  scrollToExpenseReport() {
    this.expenseReportContainer.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }


  // ✅ ฟังก์ชันปิด Popup
  closePopup() {
    this.showPopup = false;
  }
}
