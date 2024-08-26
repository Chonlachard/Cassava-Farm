import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { WorkerContactService } from './worker-contact.service';

declare var bootstrap: any;

@Component({
  selector: 'app-worker-contact',
  templateUrl: './worker-contact.component.html',
  styleUrls: ['./worker-contact.component.css']
})
export class WorkerContactComponent implements OnInit {
  displayedColumns: string[] = ['worker_id', 'worker_name', 'phone', 'skills', 'actions'];
  availableSkills: string[] = ['Skill1', 'Skill2', 'Skill3'];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';
  showForm: boolean = false;
  selectedWorker: any;
  newWorker = { worker_name: '', phone: '', skills: [] as string[] };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private workerService: WorkerContactService) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('user_id') || '';
    if (this.userId) {
      this.loadWorkers();
    } else {
      console.error('User ID is not set in localStorage.');
    }
  }

  loadWorkers(): void {
    if (this.userId) {
      this.workerService.getWorkers(this.userId).subscribe({
        next: (data) => {
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
        next: (response) => {
          console.log('Worker added:', response);
          this.resetNewWorker();
          this.loadWorkers();
          this.closeModal();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('Worker Name is required.');
    }
  }

  updateWorker(id: number): void {
    if (this.selectedWorker) {
      this.workerService.updateWorker(id, this.selectedWorker).subscribe({
        next: (response) => {
          console.log('Worker updated:', response);
          this.loadWorkers();
          this.closeModal();
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
        next: (response) => {
          console.log('Worker deleted:', response);
          this.loadWorkers();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      console.error('User ID is not set.');
    }
  }

  editWorker(worker: any): void {
    this.selectedWorker = { ...worker };
    this.newWorker = {
      worker_name: this.selectedWorker.worker_name,
      phone: this.selectedWorker.phone,
      skills: this.selectedWorker.skills || []
    };
    this.toggleForm();
  }

  resetNewWorker(): void {
    this.newWorker = { worker_name: '', phone: '', skills: [] };
  }

  handleError(error: any): void {
    console.error('An error occurred:', error);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    const modalElement = document.getElementById('addWorkerModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      if (this.showForm) {
        modal.show();
      } else {
        modal.hide();
      }
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('addWorkerModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.hide();
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSkillChange(event: any, skill: string): void {
    if (event.checked) {
      this.newWorker.skills.push(skill);
    } else {
      this.newWorker.skills = this.newWorker.skills.filter(s => s !== skill);
    }
  }
}
