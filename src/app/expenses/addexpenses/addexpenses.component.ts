import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpensesService } from '../expenses.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-addexpenses',
  templateUrl: './addexpenses.component.html',
  styleUrls: ['./addexpenses.component.css']
})
export class AddexpensesComponent implements OnInit {

  expenseForm: FormGroup;
  isEditing: boolean = false;
  categories = [
    { value: 'ค่าฮอโมน', label: 'expense.categories.hormone' },
    { value: 'ค่าปุ๋ย', label: 'expense.categories.fertilizer' },
    { value: 'ค่ายาฆ่าหญ่า', label: 'expense.categories.herbicide' },
    { value: 'ต่าแรงงาน', label: 'expense.categories.labor' },
    { value: 'ค่าน้ำมัน', label: 'expense.categories.fuel' },
    { value: 'ค่าพันธุ์มัน', label: 'expense.categories.seed' },
    { value: 'ค่าซ่อมอุปกรณ์', label: 'expense.categories.equipmentRepair' },
    { value: 'ค่าอุปกรณ์', label: 'expense.categories.equipment' },
    { value: 'ค่าเช่าที่ดิน', label: 'expense.categories.landRent' },
    { value: 'ค่าขุด(ค่าเก็บเกี่ยว)', label: 'expense.categories.harvestCost' },
    { value: 'อื่นๆ', label: 'expense.categories.other' }
  ];

  constructor(
    private transactionService: ExpensesService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddexpensesComponent>,
    private translate: TranslateService, 
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
      this.translate.get('expense.errorLoading').subscribe(translations => {
        Swal.fire({
          icon: 'error',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
    });
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formData = { ...this.expenseForm.getRawValue() }; // Include all fields including disabled ones
      if (this.isEditing) {
        if (!formData.expense_id) {
          this.translate.get('expense.incompleteDataEdit').subscribe(translations => {
            Swal.fire({
              icon: 'warning',
              title: translations.title,
              text: translations.text,
              timer: 3000,
              timerProgressBar: true,
            });
          });
          return;
        }
  
        this.transactionService.updateExpense(formData).subscribe(
          (response) => {
            this.translate.get('expense.successEdit').subscribe(translations => {
              Swal.fire({
                icon: 'success',
                title: translations.title,
                text: translations.text,
                timer: 3000,
                timerProgressBar: true,
              }).then(() => {
                this.dialogRef.close(true);
              });
            });
          },
          (error) => {
            this.translate.get('expense.errorEdit').subscribe(translations => {
              Swal.fire({
                icon: 'error',
                title: translations.title,
                text: translations.text,
                timer: 3000,
                timerProgressBar: true,
              });
            });
          }
        );
      } else {
        this.transactionService.addExpense(formData).subscribe(
          (response) => {
            this.translate.get('expense.successAdd').subscribe(translations => {
              Swal.fire({
                icon: 'success',
                title: translations.title,
                text: translations.text,
                timer: 3000,
                timerProgressBar: true,
              }).then(() => {
                this.dialogRef.close(true);
              });
            });
          },
          (error) => {
            this.translate.get('expense.errorAdd').subscribe(translations => {
              Swal.fire({
                icon: 'error',
                title: translations.title,
                text: translations.text,
                timer: 3000,
                timerProgressBar: true,
              });
            });
          }
        );
      }
    } else {
      this.translate.get('expense.incompleteData').subscribe(translations => {
        Swal.fire({
          icon: 'warning',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
    }
  }
}
