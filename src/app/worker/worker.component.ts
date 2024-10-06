import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WorkerService } from './worker.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AddWorkerComponent } from './add-worker/add-worker.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';

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
  Edit(){}
  Delete(){}
}