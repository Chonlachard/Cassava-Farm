import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from '../expenses.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<any>(); // ✅ ใช้ MatTableDataSource
  displayedColumns: string[] = ['expenses_date', 'category', 'description']; // ✅ คอลัมน์ในตาราง
  loading: boolean = true;
  

  @ViewChild(MatPaginator) paginator!: MatPaginator; // ✅ ใช้ MatPaginator

  constructor(
    public dialogRef: MatDialogRef<DetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private expensesService: ExpensesService
  ) {}

  ngOnInit(): void {
    if (this.data.expense_id) {
      this.loadExpenseDetails(this.data.expense_id);
    } else {
      console.error('❌ ไม่พบ expense_id');
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // ✅ ตรวจสอบว่า Paginator ถูกสร้างก่อนกำหนดค่าให้ DataSource
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  loadExpenseDetails(expenseId: string): void {
    debugger
    this.expensesService.getExpensesDetailById(expenseId).subscribe({
      next: (response) => {
        console.log('📌 ข้อมูลที่ดึงมา:', response);
        this.dataSource.data = response.expenses || []; // ✅ ตรวจสอบข้อมูล
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ เกิดข้อผิดพลาด:', error);
        this.loading = false;
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

}
