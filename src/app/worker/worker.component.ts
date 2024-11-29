import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WorkerService } from './worker.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { AddWorkerComponent } from './add-worker/add-worker.component';
import { EditWorkerComponent } from './edit-worker/edit-worker.component';
import { debounceTime, filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

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
  skillOptions: string[] = ['คนขุด', 'คนฉีด', 'ตัดต้น', 'คนปลูก'];

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      skills: ['']
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadWorker();

      // ค้นหาตามการเปลี่ยนแปลงของฟอร์ม และดีบาวน์ให้การค้นหาช้าลง
      this.searchForm.valueChanges.pipe(
        debounceTime(500), // เว้นเวลาระหว่างการค้นหาหลังจากพิมพ์
        filter(() => this.searchForm.valid) // ค้นหาต่อเมื่อฟอร์มมีค่าถูกต้อง
      ).subscribe(() => {
        this.onSearch();
      });
    } else {
      // หากไม่พบ userId, ให้ปิดการทำงาน หรือแสดงข้อความผิดพลาด
      Swal.fire('ไม่พบข้อมูลผู้ใช้', 'กรุณาล็อกอินใหม่', 'error');
    }
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadWorker(filter: any = {}) {
    // ตรวจสอบว่ามีการกรองหรือไม่ ถ้ามีก็ส่งไปใน request
    this.workerService.getWorker(this.userId, filter).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }

  onSearch() {
    const filters: any = {};

    // ตรวจสอบค่าที่กรอกในฟอร์ม
    const keyword = this.searchForm.get('keyword')?.value;
    if (keyword) {
      filters.keyword = keyword;
    }

    const skills = this.searchForm.get('skills')?.value;
    if (skills) {
      filters.skills = skills;
    }

    // ค้นหาข้อมูลคนงาน
    this.loadWorker(filters);
  }
  

  clearSearch() {
    // รีเซ็ตฟอร์มการค้นหาทั้งหมด
    this.searchForm.reset();
    this.loadWorker(); // โหลดข้อมูลทั้งหมด
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
      title: this.translate.instant('worker.deleteConfirmTitle'),
      text: this.translate.instant('worker.deleteConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: this.translate.instant('worker.deleteConfirmButtonText'),
      cancelButtonText: this.translate.instant('worker.deleteCancelButtonText')
    }).then((result) => {
      if (result.isConfirmed) {
        this.workerService.deleteWorker(workerId).subscribe(
          () => {
            Swal.fire(
              this.translate.instant('worker.deleteSuccessTitle'),
              this.translate.instant('worker.deleteSuccessText'),
              'success'
            );
            this.loadWorker();
          },
          (error) => {
            console.error('เกิดข้อผิดพลาดในการลบข้อมูลคนงาน:', error);
            Swal.fire(
              this.translate.instant('worker.deleteErrorTitle'),
              this.translate.instant('worker.deleteErrorText'),
              'error'
            );
          }
        );
      }
    });
  }
  
}
