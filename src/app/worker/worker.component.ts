import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WorkerService } from './worker.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AddWorkerComponent } from './add-worker/add-worker.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { EditWorkerComponent } from './edit-worker/edit-worker.component';

@Component({
  selector: 'app-worker',
  templateUrl: './worker.component.html',
  styleUrl: './worker.component.css'
})
export class WorkerComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['worker_name', 'phone', 'skills', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService,
    private router: Router,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadWorker();
    }
  }
  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
  loadWorker(){
    this.workerService.getWorker(this.userId).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }
  addWorker() {
    const dialogRef = this.dialog.open(AddWorkerComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadWorker(); // Refresh list after adding/editing expense
      }
    });
  }
  onSearch(){}
  Edit(workerId: string): void { // เปลี่ยนเป็น string เพื่อความสอดคล้อง
    const dialogRef = this.dialog.open(EditWorkerComponent, {
      width: '600px',
      data: { userId: this.userId, workerId: workerId } // ส่งข้อมูล userId และ workerId ไปยัง EditWorkerComponent
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadWorker(); // โหลดข้อมูลใหม่หลังจากมีการแก้ไข
      } else {
        console.log('การแก้ไขถูกยกเลิก'); // แสดงข้อความเมื่อการแก้ไขถูกยกเลิก
      }
    });
  }
  
  
  
  
  Delete(workerId: string) {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.workerService.deleteWorker(workerId).subscribe(
          response => {
            console.log('ลบข้อมูลคนงานสำเร็จ:', response);
            // แสดงข้อความยืนยันการลบ
            Swal.fire(
              'ลบสำเร็จ!',
              'ข้อมูลคนงานถูกลบแล้ว.',
              'success'
            );
            this.loadWorker(); // โหลดข้อมูลใหม่หลังจากลบ
          },
          error => {
            console.error('เกิดข้อผิดพลาดในการลบข้อมูลคนงาน:', error);
            Swal.fire(
              'เกิดข้อผิดพลาด!',
              'ไม่สามารถลบข้อมูลคนงานได้.',
              'error'
            );
          }
        );
      }
    });
  }
}
