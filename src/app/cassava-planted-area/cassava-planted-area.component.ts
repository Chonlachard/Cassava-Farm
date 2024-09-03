import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CassavaAreaServiceService } from './cassava-area-service.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2

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
      this.loadPlots();
    } else {
      console.error('ไม่พบรหัสผู้ใช้');
    }
  }

  // ฟังก์ชันลบข้อมูล
  deleted(plotId: string) {
    debugger
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณแน่ใจว่าต้องการลบข้อมูลนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cassavaAreaService.deletePlot(plotId).subscribe(
          response => {
            Swal.fire(
              'ลบสำเร็จ!',
              'ข้อมูลของคุณถูกลบเรียบร้อยแล้ว.',
              'success'
            );
            this.loadPlots(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
          },
          error => {
            Swal.fire(
              'ลบไม่สำเร็จ!',
              'เกิดข้อผิดพลาดในการลบข้อมูล.',
              'error'
            );
            console.error('Error deleting plot:', error);
          }
        );
      }
    });
  }

  // ฟังก์ชันแก้ไขข้อมูล (ถ้าต้องการ)
  edit() {
    // ติดตั้งฟังก์ชันแก้ไขที่นี่
  }

  // ฟังก์ชันโหลดข้อมูล
  loadPlots() {
    this.cassavaAreaService.getCassavaArea(this.userId).subscribe((res: any) => {
      // แปลง area_rai เป็นจำนวนเต็ม
      this.dataSource.data = res.map((item: any) => ({
        ...item,
        area_rai: Math.round(item.area_rai)
      }));
    });
  }

  // ฟังก์ชันเปิดหน้าฟอร์มเพิ่มข้อมูล
  openAdd() {
    this.router.navigate(['/addPlantedArea']);
  }

  // ฟังก์ชันค้นหา (ถ้าต้องการ)
  onSearch() {
    // ติดตั้งฟังก์ชันค้นหาที่นี่
  }

  // ฟังก์ชันดูรายละเอียด (ถ้าต้องการ)
  viewDetails() {
    // ติดตั้งฟังก์ชันดูรายละเอียดที่นี่
  }
}
