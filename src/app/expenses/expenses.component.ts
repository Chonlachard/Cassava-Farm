import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from './expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { AddexpensesComponent } from './addexpenses/addexpenses.component';
import Swal from 'sweetalert2';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expense_date', 'category', 'amount', 'details', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  startDate: string = '';
  endDate: string = '';
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadExpenses();
    }
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadExpenses() {
    this.expensesService.getExpenses(this.userId).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }

  onSearch() {
    if (this.startDate && this.endDate) {
      this.expensesService.getExpensesByDateRange(this.userId, this.startDate, this.endDate).subscribe((res: any) => {
        this.dataSource.data = res;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      }, (error) => {
        Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถค้นหาข้อมูลได้.', 'error');
      });
    } else {
      Swal.fire('กรุณาระบุช่วงวันที่ให้ครบถ้วน');
    }
  }

  openAddExpense(expenseId?: number): void {
    const dialogRef = this.dialog.open(AddexpensesComponent, {
      width: '600px',
      data: expenseId ? { id: expenseId } : {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses(); // รีเฟรชรายการหลังจากเพิ่ม/แก้ไขรายจ่ายใหม่
      }
    });
  }

  editExpense(expenseId: number): void {
    this.openAddExpense(expenseId); // เปิดไดอะล็อกการแก้ไข
  }

  deleteExpense(expenseId: number): void {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณต้องการลบข้อมูลนี้จริง ๆ หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.deleteExpense(expenseId).subscribe(() => {
          Swal.fire(
            'ลบข้อมูลแล้ว!',
            'ข้อมูลค่าใช้จ่ายถูกลบเรียบร้อยแล้ว.',
            'success'
          );
          // รีเฟรชข้อมูลหลังจากลบสำเร็จ
          this.loadExpenses(); // เรียก loadExpenses เพื่อโหลดข้อมูลใหม่
        }, (error) => {
          Swal.fire(
            'เกิดข้อผิดพลาด!',
            'ไม่สามารถลบข้อมูลได้.',
            'error'
          );
        });
      }
    });
  }

  clearSearch(){
    this.startDate = '';
    this.endDate = '';
    this.loadExpenses();
  }
}
