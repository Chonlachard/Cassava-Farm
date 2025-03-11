import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from './expenses.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { EditExpensesComponent } from './edit-expenses/edit-expenses.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DetailComponent } from './detail/detail.component';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  @ViewChild('addFormSection') addFormSection!: ElementRef; // ✅ ดึงตำแหน่งของฟอร์มแก้ไข
  @ViewChild('showPreviewSection') showPreviewSection!: ElementRef; // ✅ ดึงตำแหน่งของฟอร์มแก้ไข
  @ViewChild('editFormSection') editFormSection!: ElementRef; // ✅ ดึงตำแหน่งของฟอร์มแก้ไข
  displayedColumns: string[] = ['expenses_date','plot_name', 'category', 'total_price', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  plotForm!: FormGroup;
  
  searchForm: FormGroup;
  showAddForm = false;
  showEditForm = false;
  showPreviewForm = false;
  plots: any[] = [];
  categories = [
    { value: 'ค่าฮอร์โมน', label: 'ค่าฮอร์โมน' },
    { value: 'ค่าปุ๋ย', label: 'ค่าปุ๋ย' },
    { value: 'ค่ายาฆ่าหญ้า', label: 'ค่ายาฆ่าหญ้า' },
    { value: 'ค่าคนตัดต้น', label: 'ค่าคนตัดต้น' },
    { value: 'ค่าคนปลูก', label: 'ค่าคนปลูก' },
    { value: 'ค่าคนฉีดยาฆ่าหญ้า', label: 'ค่าคนฉีดยาฆ่าหญ้า' },
    { value: 'ค่าคนฉีดยาฮอโมน', label: 'ค่าคนฉีดยาฮอโมน' },
    { value: 'ค่าน้ำมัน', label: 'ค่าน้ำมัน' },
    { value: 'ค่าพันธุ์มัน', label: 'ค่าพันธุ์มัน' },
    { value: 'ค่าซ่อมอุปกรณ์', label: 'ค่าซ่อมอุปกรณ์' },
    { value: 'ค่าอุปกรณ์', label: 'ค่าอุปกรณ์' },
    { value: 'ค่าเช่าที่ดิน', label: 'ค่าเช่าที่ดิน' },
    { value: 'ค่าขุด', label: 'ค่าขุด' }
  ];

  userId: string = '';
  selectedPlotIdForAddForm: number | null = null;
  selectedExpenseId: number | null = null;
selectedCategory: string | null = null;

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    private translate: TranslateService
  ) {
    this.searchForm = this.fb.group({
      category: [''],
      startDate: [''],
      endDate: [''],
      plot: ['']
    });
  }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';
    this.fetchPlots();

     // ✅ สร้าง plotForm เพื่อเก็บค่าแปลงที่เลือก
     this.plotForm = this.fb.group({
      selectedPlot: [null] // ค่าเริ่มต้นเป็น null (ยังไม่ได้เลือกแปลง)
    });

    // Auto-search when form values change
    this.searchForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.onSearch());

    if (this.userId) {
      this.loadExpenses();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  fetchPlots(): void {
    this.expensesService.getDeopPlot(this.userId).subscribe({
      next: (res: any) => {
        this.plots = res;
      },
      error: () => {
        this.showError('harvest.errorLoadingPlots');
      }
    });
  }

  loadExpenses(filters: any = {}) {
    console.log('filters', filters);
    this.expensesService.getExpenses(this.userId, filters).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
      }
    });
  }

  onSearch() {
    // ✅ ดึงค่าจากฟอร์มค้นหา
    const filters = { ...this.searchForm.value };

    // ✅ เพิ่มค่า plot_id ถ้ามีการเลือกแปลง
    const selectedPlot = this.plotForm?.get('selectedPlot')?.value;
    if (selectedPlot) {
        filters.plot = selectedPlot;
    }

    console.log("🔍 ค่าที่ส่งไปโหลดข้อมูล:", filters);
    
    this.loadExpenses(filters);
}


openAddExpense(): void {
  // ✅ ดึงค่า plotId ถ้ามีการเลือกแปลง
  this.selectedPlotIdForAddForm = this.plotForm?.get('selectedPlot')?.value || null;

  console.log("📍 plot_id ที่จะส่งไปยังฟอร์มเพิ่มค่าใช้จ่าย:", this.selectedPlotIdForAddForm);

  this.showAddForm = !this.showAddForm; // ✅ สลับสถานะเปิด/ปิดฟอร์ม
  this.showEditForm = false; // ✅ ปิดฟอร์มแก้ไข
  this.showPreviewForm = false; // ✅ ปิดฟอร์มแสดงตัวอย่าง

  setTimeout(() => {
    if (this.addFormSection) {
        this.addFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.warn("⚠️ ไม่พบ element addFormSection");
    }
  }, 100);
}



  closeForm() {
    debugger
    this.showAddForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ
    this.showEditForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ
    this.showPreviewForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ

    console.log('📢 เรียกใช้ loadExpenses()');
    this.loadExpenses();
  }
  handleCloseEditForm(): void {
    console.log('📢 handleCloseEditForm() ถูกเรียก');

    this.showEditForm = false; // ✅ ปิดฟอร์ม
    this.selectedExpenseId = null; // ✅ ล้างค่า
    this.selectedCategory = null; // ✅ ล้างค่า

    // ✅ โหลดข้อมูลใหม่
    this.loadExpenses();
}


  editExpense(expenseId: number, category: string): void {
    if (expenseId && category) { // ✅ ตรวจสอบว่า expenseId และ category มีค่า
        this.selectedExpenseId = expenseId;
        this.selectedCategory = category;
        this.showEditForm = true;
        this.showAddForm = false;
        this.showPreviewForm = false

        // ✅ เลื่อนหน้าไปยังฟอร์มแก้ไข
        setTimeout(() => {
            if (this.editFormSection) {
                this.editFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn("⚠️ ไม่พบ element editFormSection");
            }
        }, 100);
    } else {
        console.warn("❌ ไม่สามารถแก้ไขได้: expenseId หรือ category ไม่ถูกต้อง");
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแก้ไขค่าใช้จ่ายได้ กรุณาลองอีกครั้ง!',
            confirmButtonText: 'ตกลง'
        });
    }
  
}

  deleteExpense(expenseId: number): void {
    Swal.fire({
      title: this.translate.instant('expense.deleteConfirmationTitle'),
      text: this.translate.instant('expense.deleteConfirmationText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.translate.instant('expense.deleteConfirmationConfirm'),
      cancelButtonText: this.translate.instant('expense.deleteConfirmationCancel')
    }).then((result) => {
      if (result.isConfirmed) {
        this.expensesService.deleteExpense(expenseId).subscribe({
          next: () => {
            Swal.fire(
              this.translate.instant('expense.deleteSuccessTitle'),
              this.translate.instant('expense.deleteSuccessText'),
              'success'
            );
            this.loadExpenses();
          },
          error: () => {
            this.showError('expense.errorDelete');
          }
        });
      }
    });
  }

  clearSearch() {
    debugger
    this.searchForm.reset();
    this.loadExpenses();
  }

  private showError(translationKey: string) {
    this.translate.get(translationKey).subscribe((translations: { title: string; text: string }) => {
      Swal.fire({
        icon: 'error',
        title: translations.title,
        text: translations.text,
        timer: 3000,
        timerProgressBar: true
      });
    });
  }

  previewExpense(expenseId: number, category: string): void {
    if (expenseId && category) { // ✅ ตรวจสอบว่า expenseId และ category มีค่า
        this.selectedExpenseId = expenseId;
        this.selectedCategory = category;
        this.showEditForm = false;
        this.showAddForm = false;
        this.showPreviewForm = true

        // ✅ เลื่อนหน้าไปยังฟอร์มแก้ไข
        setTimeout(() => {
            if (this.showPreviewSection) {
                this.showPreviewSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn("⚠️ ไม่พบ element editFormSection");
            }
        }, 100);
    } else {
        console.warn("❌ ไม่สามารถแก้ไขได้: expenseId หรือ category ไม่ถูกต้อง");
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแก้ไขค่าใช้จ่ายได้ กรุณาลองอีกครั้ง!',
            confirmButtonText: 'ตกลง'
        });
    }
  
}


togglePlot(plotId: number): void {
  if (!this.plotForm) return;

  const currentPlot = this.plotForm.get('selectedPlot')?.value;

  // ✅ ถ้ากดแปลงเดิม ให้เซ็ตเป็น null (ล้างค่า)
  this.plotForm.get('selectedPlot')?.setValue(currentPlot === plotId ? null : plotId);

  // ✅ โหลดข้อมูลใหม่จาก API ตามแปลงที่เลือก
  this.onSearch();
}

isSelected(plotId: number): boolean {
  return this.plotForm.get('selectedPlot')?.value === plotId;
}

  
}
