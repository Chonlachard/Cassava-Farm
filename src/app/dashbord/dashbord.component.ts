import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DashbordService } from './dashbord.service';
import { Chart } from 'chart.js'; // นำเข้า Chart.js

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

  // ตัวแปรสำหรับกราฟ
  public chart: any;

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
      this.totalIncome = data.summary.totalIncome || 0;
      this.totalExpenses = data.summary.totalExpenses || 0;
      this.netProfit = data.summary.totalProfit || 0;
      
      // อัปเดตข้อมูลกราฟ
      this.updateChartData(data.incomeExpenses);
    });
  }

  // ฟังก์ชันสำหรับการเปลี่ยนปีที่เลือก
  onYearChange(year: string) {
    this.selectedYear = +year; // แปลงเป็น number
    this.fetchFinancialData(this.selectedYear);
  }

  // ฟังก์ชันอัปเดตข้อมูลกราฟ
  updateChartData(data: any[]): void {
    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const incomeData = Array(12).fill(0);
    const expensesData = Array(12).fill(0);

    if (data && data.length > 0) {
        data.forEach(item => {
            const monthIndex = monthNames.indexOf(item.month);
            if (monthIndex >= 0) {
                incomeData[monthIndex] = item.income || 0;
                expensesData[monthIndex] = item.expenses || 0;
            }
        });
    }

    // กรณีไม่มีข้อมูล
    this.createChart(monthNames, incomeData, expensesData);
  }

  // ฟังก์ชันสร้างกราฟ
  createChart(monthNames: string[], incomeData: number[], expensesData: number[]): void {
    if (this.chart) {
      this.chart.destroy(); // ทำลายกราฟเก่า
    }

    this.chart = new Chart('canvas', {
      type: 'bar',
      data: {
        labels: monthNames, // เดือนที่จะแสดงในแกน X
        datasets: [
          {
            label: 'รายรับ',
            data: incomeData, // ข้อมูลรายรับ
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'รายจ่าย',
            data: expensesData, // ข้อมูลรายจ่าย
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'เดือน',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount (thousands)',
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 20,
            },
          },
        },
      },
    });
  }
}
