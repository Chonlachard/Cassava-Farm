import { Component, OnInit } from '@angular/core';
import { ExpensesService } from '../expenses.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-addexpenses',
  templateUrl: './addexpenses.component.html',
  styleUrls: ['./addexpenses.component.css'] // แก้ไขชื่อไฟล์เป็น styleUrls
})
export class AddexpensesComponent implements OnInit {

  expenseForm: FormGroup; // ตัวแปรสำหรับเก็บฟอร์ม
  successMessage: string | null = null;
  errorMessage: string | null = null;

  userId: string = '';

  constructor(
    private transactionService: ExpensesService, 
    private router: Router,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddexpensesComponent>
  ) {
    this.expenseForm = this.fb.group({
      user_id: ['', Validators.required], // เปลี่ยนเป็น user_id
      expense_date: ['', Validators.required],
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      details: ['']
    });
  }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: this.userId }); // ตั้งค่า user_id ให้กับฟอร์ม

    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.patchValue({ expense_date: today });
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formData = this.expenseForm.value;

      this.transactionService.addExpense(formData).subscribe(
        (response) => {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: 'เพิ่มรายจ่ายสำเร็จ!',
            timer: 3000,
            timerProgressBar: true,
          }).then(() => {
            this.dialogRef.close(true); // ปิดไดอะล็อกและส่งค่า true กลับไป
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
