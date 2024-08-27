import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ExpensesService } from './expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { AddexpensesComponent } from './addexpenses/addexpenses.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'] // แก้ไขเป็น styleUrls
})
export class ExpensesComponent implements OnInit {
  displayedColumns: string[] = ['expense_date', 'category', 'amount', 'details', 'actions']; // ปรับให้ตรงกับการกำหนดคอลัมน์
  expenses: any[] = []; // ปรับประเภทตามโมเดลข้อมูลของคุณ

  startDate: string = ''; // สำหรับกรองข้อมูลตามวันที่เริ่มต้น
  endDate: string = '';   // สำหรับกรองข้อมูลตามวันที่สิ้นสุด
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

  loadExpenses() {
    this.expensesService.getExpenses(this.userId).subscribe((res: any) => {
      this.expenses = res;
    });
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
          this.ngOnInit(); // เรียก ngOnInit เพื่อโหลดข้อมูลใหม่
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

  onSearch() {
    // ฟังก์ชันค้นหาข้อมูล
  }
}
