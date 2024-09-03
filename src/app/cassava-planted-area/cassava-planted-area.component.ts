import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CassavaAreaServiceService } from './cassava-area-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cassava-planted-area',
  templateUrl: './cassava-planted-area.component.html',
  styleUrls: ['./cassava-planted-area.component.css']  // แก้ไขจาก 'styleUrl' เป็น 'styleUrls'
})

export class CassavaPlantedAreaComponent implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['plot_name', 'area_rai', 'imageUrl', 'actions'];

  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private cassavaAreaService: CassavaAreaServiceService,
    public dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadExpenses();
    } else {
      console.error('ไม่พบรหัสผู้ใช้');
    }
  }

  deleted() {
    // ติดตั้งฟังก์ชันลบที่นี่
  }

  edit() {
    // ติดตั้งฟังก์ชันแก้ไขที่นี่
  }

  loadExpenses() {
    this.cassavaAreaService.getCassavaArea(this.userId).subscribe((res: any) => {
      // แปลง area_rai เป็นจำนวนเต็ม
      this.dataSource.data = res.map((item: any) => ({
        ...item,
        area_rai: Math.round(item.area_rai)
      }));
    });
  }

  openAdd() {
    this.router.navigate(['/addPlantedArea']);
  }

  onSearch() {
    // ติดตั้งฟังก์ชันค้นหาที่นี่
  }

  viewDetails() {
    // ติดตั้งฟังก์ชันดูรายละเอียดที่นี่
  }
}
