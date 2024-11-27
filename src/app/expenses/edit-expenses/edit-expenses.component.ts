import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpensesService } from '../expenses.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-editexpenses',
 templateUrl: './edit-expenses.component.html',
  styleUrls: ['./edit-expenses.component.css']
})
export class EditExpensesComponent implements OnInit {

  expenseForm: FormGroup;
  expenseId! : number;
  plots: any[] = [];
  categories = [
    { value: 'ค่าฮอร์โมน', label: 'expense.categories.hormone' },
    { value: 'ค่าปุ๋ย', label: 'expense.categories.fertilizer' },
    { value: 'ค่ายาฆ่าหญ้า', label: 'expense.categories.herbicide' },
    { value: 'ค่าแรงงาน', label: 'expense.categories.labor' },
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
    private translate: TranslateService,
    private dialogRef: MatDialogRef<EditExpensesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.expenseForm = this.fb.group({
      expense_id: [''], // ID ของค่าใช้จ่าย
      user_id: [{ value: '', disabled: true }, Validators.required],
      plot_id: ['', Validators.required],
      expense_date: ['', Validators.required],
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      details: ['']
    });
  }

  ngOnInit() {
    this.expenseId = this.data.id; // กำหนด ID ของค่าใช้จ่าย
    this.fetchExpense();
    const userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: userId });
    this.fetchPlots();
  }

  fetchExpense(): void {
    this.transactionService.getExpense(this.expenseId).subscribe((expense: any) => {
      console.log('Fetched Expense Data:', expense);
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

  fetchPlots(): void {
    const userId = localStorage.getItem('userId') || '';
    this.transactionService.getDeopPlot(userId).subscribe((res: any) => {
      this.plots = res;
    }, error => {
      this.translate.get('harvest.errorLoadingPlots').subscribe((translations: { title: string; text: string; }) => {
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
      const formData = { ...this.expenseForm.getRawValue(), expense_id: this.expenseId }; // ส่ง ID ค่าใช้จ่ายในการอัพเดต
      this.transactionService.updateExpense(formData).subscribe(
        () => {
          this.translate.get('expense.successEdit').subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations.title,
              text: translations.text,
              timer: 3000,
              timerProgressBar: true,
            }).then(() => {
              this.dialogRef.close(true); // ปิด dialog และส่งค่ากลับว่า edit สำเร็จ
            });
          });
        },
        () => {
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
    }
  }
}
