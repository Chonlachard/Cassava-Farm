import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DashbordService } from './dashbord.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexLegend
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

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
  public chartOptions: ChartOptions = {
    series: [
      {
        name: 'รายรับ',
        data: [],
      },
      {
        name: 'รายจ่าย',
        data: [],
      },
    ],
    chart: {
      type: 'bar',
      height: 350,
    },
    dataLabels: {
      enabled: true, // เปิดการแสดงป้ายชื่อข้อมูล
    },
    plotOptions: {
      bar: {
        horizontal: false, // ตั้งค่าว่ากราฟเป็นแบบแนวนอนหรือแนวตั้ง
        columnWidth: '55%',
      },
    },
    xaxis: {
      categories: [], // จะถูกตั้งค่าใน updateChartData
    },
    yaxis: {
      title: {
        text: 'Amount (thousands)',
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      floating: true,
    },
  };

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

    if (data && data.length > 0) {
        this.chartOptions.series[0].data = Array(12).fill(0);
        this.chartOptions.series[1].data = Array(12).fill(0);

        data.forEach(item => {
            const monthIndex = monthNames.indexOf(item.month); // ใช้ชื่อเดือนในการหาตำแหน่ง
            if (monthIndex >= 0) {
                this.chartOptions.series[0].data[monthIndex] = item.income || 0; // รายรับ
                this.chartOptions.series[1].data[monthIndex] = item.expenses || 0; // รายจ่าย
            }
        });

        this.chartOptions.xaxis.categories = monthNames; // ตั้งชื่อเดือนทั้งหมด
    } else {
        // กรณีไม่มีข้อมูล
        this.chartOptions.series[0].data = Array(12).fill(0);
        this.chartOptions.series[1].data = Array(12).fill(0);
        this.chartOptions.xaxis.categories = monthNames; // ตั้งชื่อเดือนทั้งหมด
    }
}

}
