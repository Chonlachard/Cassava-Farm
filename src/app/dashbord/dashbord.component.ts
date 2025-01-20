import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit {
  chartData: any; // กำหนดข้อมูลกราฟ
  chartOptions: any; // กำหนดการตั้งค่ากราฟ

  ngOnInit(): void {
    // กำหนดข้อมูลเริ่มต้นสำหรับกราฟ
    this.chartData = {
      labels: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน'],
      datasets: [
        {
          label: 'รายรับ',
          data: [5000, 8000, 6000, 10000],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'รายจ่าย',
          data: [3000, 4000, 2000, 5000],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };

    // ตั้งค่าการแสดงผลของกราฟ
    this.chartOptions = {
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
    };
  }
}
