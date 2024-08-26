import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { WorkerContactService } from './worker-contact.service';
import { AddWorkerComponent } from './add-worker/add-worker.component';
import { MatDialog } from '@angular/material/dialog';
import { Worker } from '../../interfaces/worker.model'; // นำเข้า Worker Interface จาก src/interfaces

@Component({
  selector: 'app-worker-contact',
  templateUrl: './worker-contact.component.html',
  styleUrls: ['./worker-contact.component.css']
})
export class WorkerContactComponent implements OnInit {
  displayedColumns: string[] = ['worker_id', 'worker_name', 'phone', 'skills', 'actions'];
  availableSkills: string[] = ['Skill1', 'Skill2', 'Skill3'];
  dataSource = new MatTableDataSource<Worker>([]);
  userId: string = '';
  selectedWorker: Worker | null = null; // ใช้ Worker Interface
  newWorker: Worker = { worker_name: '', phone: '', skills: [], user_id: 0 }; // กำหนด skills เป็น array of string

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private workerService: WorkerContactService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('user_id') || '';
    if (this.userId) {
      this.newWorker.user_id = parseInt(this.userId, 10);
      this.loadWorkers();
    } else {
      console.error('User ID is not set in localStorage.');
    }
  }

  loadWorkers(): void {
    if (this.userId) {
      this.workerService.getWorkers(this.userId).subscribe({
        next: (data: Worker[]) => {
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('User ID is not set.');
    }
  }

  addWorker(): void {
    if (this.newWorker.worker_name) {
      this.workerService.createWorker(this.newWorker).subscribe({
        next: (response: Worker) => {
          console.log('Worker added:', response);
          this.resetNewWorker();
          this.loadWorkers(); // รีเฟรชข้อมูลหลังจากเพิ่มพนักงาน
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('Worker Name is required.');
    }
  }

  updateWorker(): void {
    if (this.selectedWorker) {
      this.workerService.updateWorker(this.selectedWorker.worker_id!, this.selectedWorker).subscribe({
        next: (response: Worker) => {
          console.log('Worker updated:', response);
          this.loadWorkers(); // รีเฟรชข้อมูลหลังจากอัปเดตพนักงาน
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('No worker selected for update.');
    }
  }

  deleteWorker(id: number): void {
    if (this.userId) {
      this.workerService.deleteWorker(id, this.userId).subscribe({
        next: () => {
          console.log('Worker deleted');
          this.loadWorkers(); // รีเฟรชข้อมูลหลังจากลบพนักงาน
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('User ID is not set.');
    }
  }

  editWorker(worker: Worker): void {
    this.selectedWorker = { ...worker }; // ทำการสำเนา Worker ที่เลือก
    this.newWorker = {
      worker_name: this.selectedWorker.worker_name,
      phone: this.selectedWorker.phone,
      skills: Array.isArray(this.selectedWorker.skills) ? this.selectedWorker.skills : [], // ตรวจสอบว่า skills เป็น array
      user_id: this.newWorker.user_id // ใช้ user_id ปัจจุบัน
    };
    this.openAddWorkerDialog(); // ใช้ Angular Material Dialog เพื่อเปิดฟอร์มแก้ไข
  }

  resetNewWorker(): void {
    this.newWorker = { worker_name: '', phone: '', skills: [], user_id: parseInt(this.userId, 10) };
    this.selectedWorker = null;
  }

  handleError(error: any): void {
    console.error('An error occurred:', error);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSkillChange(event: any, skill: string): void {
    // ตรวจสอบว่า skills เป็น array ก่อนที่จะใช้ push หรือ filter
    if (Array.isArray(this.newWorker.skills)) {
      if (event.checked) {
        this.newWorker.skills.push(skill);
      } else {
        this.newWorker.skills = this.newWorker.skills.filter(s => s !== skill);
      }
    }
  }

  openAddWorkerDialog(): void {
    const dialogRef = this.dialog.open(AddWorkerComponent, {
      width: '500px',
      disableClose: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadWorkers(); // รีเฟรชข้อมูลเมื่อ dialog ปิดลง
      }
    });
  }
}
