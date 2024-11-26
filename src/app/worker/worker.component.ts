import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WorkerService } from './worker.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AddWorkerComponent } from './add-worker/add-worker.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { EditWorkerComponent } from './edit-worker/edit-worker.component';

@Component({
  selector: 'app-worker',
  templateUrl: './worker.component.html',
  styleUrls: ['./worker.component.css']
})
export class WorkerComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['worker_name', 'phone', 'skills', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';
  
  searchForm: FormGroup;
  skillOptions: string[] = ['คนขุด', 'ฉีดยา', 'ตัดต้น'];

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService,
    private router: Router,
    public dialog: MatDialog,
  ) {
    // Initialize search form
    this.searchForm = this.fb.group({
      keyword: [''],
      skills: ['']
    });
  }

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

  loadWorker() {
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
        this.loadWorker();
      }
    });
  }

  onSearch() {
    const { keyword, skills } = this.searchForm.value;

    this.workerService.getWorker(this.userId).subscribe((res: any) => {
      this.dataSource.data = res.filter((worker: any) =>
        (!keyword || worker.worker_name.includes(keyword) || worker.phone.includes(keyword)) &&
        (!skills || worker.skills.includes(skills))
      );
    });
  }

  clearSearch() {
    this.searchForm.reset();
    this.loadWorker();
  }

  Edit(workerId: string): void {
    const dialogRef = this.dialog.open(EditWorkerComponent, {
      width: '600px',
      data: { userId: this.userId, workerId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadWorker();
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
          () => {
            Swal.fire('ลบสำเร็จ!', 'ข้อมูลคนงานถูกลบแล้ว.', 'success');
            this.loadWorker();
          },
          (error) => {
            console.error('เกิดข้อผิดพลาดในการลบข้อมูลคนงาน:', error);
            Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถลบข้อมูลคนงานได้.', 'error');
          }
        );
      }
    });
  }
}
