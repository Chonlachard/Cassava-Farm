import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit {
  basicData: any; // กำหนดข้อมูลกราฟ
  basicOptions: any; // กำหนดการตั้งค่ากราฟ

  ngOnInit(): void {
    this.loadChart();
  }

  loadChart() {
    this.basicData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'My First dataset',
          backgroundColor: '#42A5F5',
          data: [65, 59, 80, 81, 56, 55, 40],
        },
        {
          label: 'My Second dataset',
          backgroundColor: '#9CCC65',
          data: [28, 48, 40, 19, 86, 27, 90],
        },
      ],
    };

    this.basicOptions = {
      title: {
        display: true,
        text: 'Line Chart',
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    };
  }
}
