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
  plots: any[] = [];
  categories = [
    { value: 'ค่าฮอร์โมน', label: 'expense.categories.hormone' },
    { value: 'ค่าปุ๋ย', label: 'expense.categories.fertilizer' },
    { value: 'ค่ายาฆ่าหญ่า', label: 'expense.categories.herbicide' },
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
    private dialogRef: MatDialogRef<AddexpensesComponent>,
  ) {
    this.expenseForm = this.fb.group({
      user_id: [{ value: '', disabled: true }, Validators.required],
      plot_id: ['', Validators.required],
      expense_date: [new Date().toISOString().substring(0, 10), Validators.required], // ตั้งค่าวันที่เริ่มต้น
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      details: ['']
    });
  }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: userId });
    this.fetchPlots();
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
        const formData = { ...this.expenseForm.getRawValue() };
        this.transactionService.addExpense(formData).subscribe(
            () => {
                this.translate.get('expense.successAdd').subscribe(translations => {
                    Swal.fire({
                        icon: 'success',
                        title: translations.title,
                        text: translations.text,
                        timer: 3000,
                        timerProgressBar: true,
                    }).then(() => {
                        // ปิด dialog เมื่อแสดงผลการแจ้งเตือนเสร็จสิ้น
                        this.dialogRef.close(true); // ส่งค่า true กลับไปเพื่อแจ้งว่ามีการเพิ่มข้อมูลสำเร็จ
                    });
                });
            },
            () => {
                this.translate.get('expense.errorAdd').subscribe(translations => {
                    Swal.fire({
                        icon: 'error',
                        title: translations.title,
                        text: translations.text,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    // ไม่ปิด dialog ถ้ามีข้อผิดพลาดในการเพิ่ม
                });
            }
        );
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
