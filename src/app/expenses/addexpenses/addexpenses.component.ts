import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpensesService } from '../expenses.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-addexpenses',
  templateUrl: './addexpenses.component.html',
  styleUrls: ['./addexpenses.component.css']
})
export class AddexpensesComponent implements OnInit {

  expenseForm: FormGroup;
  isEditing: boolean = false;

  constructor(
    private transactionService: ExpensesService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddexpensesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.expenseForm = this.fb.group({
      expense_id: [''],
      user_id: [{ value: '', disabled: true }, Validators.required], // ตั้งค่า user_id เป็น readonly
      expense_date: ['', Validators.required],
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      details: ['']
    });
  }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: userId });

    if (this.data && this.data.id) {
      this.isEditing = true;
      this.loadExpense(this.data.id);
    } else {
      const today = new Date().toISOString().split('T')[0];
      this.expenseForm.patchValue({ expense_date: today });
    }
  }

  loadExpense(expenseId: number) {
    this.transactionService.getExpense(expenseId).subscribe((expense: any) => {
      this.expenseForm.patchValue(expense);
    }, error => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้.',
        timer: 3000,
        timerProgressBar: true,
      });
    });
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formData = { ...this.expenseForm.getRawValue() }; // ดึงข้อมูลทุกฟิลด์รวมถึงที่ disabled
      if (this.isEditing) {
        if (!formData.expense_id) {
          Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ครบถ้วน!',
            text: 'กรุณาระบุ expense_id สำหรับการแก้ไข!',
            timer: 3000,
            timerProgressBar: true,
          });
          return;
        }

        this.transactionService.updateExpense(formData).subscribe(
          (response) => {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'แก้ไขรายจ่ายสำเร็จ!',
              timer: 3000,
              timerProgressBar: true,
            }).then(() => {
              this.dialogRef.close(true);
            });
          },
          (error) => {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด!',
              text: 'เกิดข้อผิดพลาดในการแก้ไขรายจ่าย กรุณาลองอีกครั้ง!',
              timer: 3000,
              timerProgressBar: true,
            });
          }
        );
      } else {
        this.transactionService.addExpense(formData).subscribe(
          (response) => {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'เพิ่มรายจ่ายสำเร็จ!',
              timer: 3000,
              timerProgressBar: true,
            }).then(() => {
              this.dialogRef.close(true);
            });
          },
          (error) => {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด!',
              text: 'เกิดข้อผิดพลาดในการเพิ่มรายจ่าย กรุณาลองอีกครั้ง!',
              timer: 3000,
              timerProgressBar: true,
            });
          }
        );
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน!',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน!',
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }
}
