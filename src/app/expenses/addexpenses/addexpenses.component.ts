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
    { value: 'ค่าฮอร์โมน', label: 'ค่าฮอร์โมน' },
    { value: 'ค่าปุ๋ย', label: 'ค่าปุ๋ย' },
    { value: 'ค่ายาฆ่าหญ่า', label: 'ค่ายาฆ่าหญ่า' },
    { value: 'ค่าคนตัดต้น', label: 'ค่าคนตัดต้น' },
    { value: 'ค่าคนปลูก', label: 'ค่าคนปลูก' },
    { value: 'ค่าคนฉีดยาฆ่าหญ่า', label: 'ค่าคนฉีดยาฆ่าหญ่า' },
    { value: 'ค่าคนฉีดยาฮอโมน', label: 'ค่าคนฉีดยาฮอโมน' },
    { value: 'ค่าน้ำมัน', label: 'ค่าน้ำมัน' },
    { value: 'ค่าพันธุ์มัน', label: 'ค่าพันธุ์มัน' },
    { value: 'ค่าซ่อมอุปกรณ์', label: 'ค่าซ่อมอุปกรณ์' },
    { value: 'ค่าอุปกรณ์', label: 'ค่าอุปกรณ์' },
    { value: 'ค่าเช่าที่ดิน', label: 'ค่าเช่าที่ดิน' },
    { value: 'ค่าขุด', label: 'ค่าขุด' }
  ];
  selectedCategory: string | null = null;
  calculatedTotalPrice: number = 0;
  treesPerBundle: number = 0;

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
      details: [''],
      bundleCount: ['', Validators.required],
    });
  }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: userId });
    this.fetchPlots();
    this.onCategoryChange();
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
  onFormulaInput(event: any): void {
    const inputValue = event.target.value;
    const formattedValue = inputValue.replace(/[^0-9-]/g, '').replace(/(\d{2})(?=\d)/g, '$1-');
    this.expenseForm.get('formula')?.setValue(formattedValue);
  }


  onCategoryChange(): void {
    this.expenseForm.get('category')?.valueChanges.subscribe((value: string) => {
      this.selectedCategory = value; // เก็บค่าประเภทที่เลือก
    });
  }

  calculateTotalPrice(): void {
    this.expenseForm.valueChanges.subscribe(() => {
      const category = this.expenseForm.get('category')?.value || '';  // ดึงหมวดหมู่
      let totalPrice = 0;

      // คำนวณราคาตามหมวดหมู่ที่เลือก
      switch (category) {
        case 'ค่าฮอร์โมน':
          const pricePerBottle = this.expenseForm.get('pricePerBottle')?.value || 0;
          const quantityHormone = this.expenseForm.get('quantity')?.value || 0;
          totalPrice = pricePerBottle * quantityHormone;
          break;

        case 'ค่าปุ๋ย':
          const pricePerBag = this.expenseForm.get('pricePerBag')?.value || 0;
          const quantityFertilizer = this.expenseForm.get('quantity')?.value || 0;
          totalPrice = pricePerBag * quantityFertilizer;
          break;

        case 'ค่าคนตัดต้น':
          const pricePerTreeCutting = this.expenseForm.get('pricePerTree')?.value || 0;
          const numberOfTreesCutting = this.expenseForm.get('numberOfTrees')?.value || 0;
          totalPrice = pricePerTreeCutting * numberOfTreesCutting;
          break;

        case 'ค่าคนปลูก':
          const pricePerTreePlanting = this.expenseForm.get('pricePerTree')?.value || 0;
          const numberOfTreesPlanting = this.expenseForm.get('numberOfTrees')?.value || 0;
          totalPrice = pricePerTreePlanting * numberOfTreesPlanting;
          break;

        // คำนวณหมวดหมู่ "ค่าฉีดยาฆ่าหญ่า"
        case 'ค่าฉีดยาฆ่าหญ่า':
          const numberOfCans = this.expenseForm.get('numberOfCans')?.value || 0;
          const pricePerCan = this.expenseForm.get('pricePerCan')?.value || 0;
          totalPrice = numberOfCans * pricePerCan;
          break;

        // คำนวณหมวดหมู่ "คนฉีดยาฮอร์โมน"
        case 'คนฉีดยาฮอร์โมน':
          const numberOfCansHormone = this.expenseForm.get('numberOfCans')?.value || 0;
          const pricePerCanHormone = this.expenseForm.get('pricePerCan')?.value || 0;
          totalPrice = numberOfCansHormone * pricePerCanHormone;
          break;
        case 'ค่าน้ำมันรถ':
          const pricePerLiter = this.expenseForm.get('pricePerLiter')?.value || 0;
          const quantityLiters = this.expenseForm.get('quantityLiters')?.value || 0;
          totalPrice = pricePerLiter * quantityLiters;
          break;
        case 'ค่าซ่อมอุปกรณ์':
          const repairCost = this.expenseForm.get('repairCost')?.value || 0;
          totalPrice = repairCost;  // ค่าใช้จ่ายในการซ่อม
          break;
        case 'ค่าอุปกรณ์':
          const purchasePrice = this.expenseForm.get('purchasePrice')?.value || 0;
          totalPrice = purchasePrice;  // ราคาที่ซื้อ
          break;
        case 'ค่าขุด':
          const weight = this.expenseForm.get('weight')?.value || 0;  // น้ำหนักสินค้า (ตัน)
          const pricePerTon = this.expenseForm.get('pricePerTon')?.value || 0;  // ราคาต่อตัน
          break;

        // คุณสามารถเพิ่ม case อื่นๆ ที่ต้องการได้
        default:
          totalPrice = 0;  // หากหมวดหมู่ไม่ตรงกับที่กำหนดไว้
          break;
      }

      // กำหนดผลลัพธ์ราคารวม
      this.calculatedTotalPrice = totalPrice;

      // อัพเดตฟอร์มด้วยราคารวมที่คำนวณได้
      this.expenseForm.patchValue({ totalPrice: this.calculatedTotalPrice });
    });
  }



  calculateBundles(): void {
    const selectedBundleCount = this.expenseForm.get('bundleCount')?.value;
    if (selectedBundleCount) {
      this.treesPerBundle = selectedBundleCount;  // จำนวนต้นในแต่ละมัดตามที่เลือก
    } else {
      this.treesPerBundle = 0;
    }
  }

}
