import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from './expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { AddexpensesComponent } from './addexpenses/addexpenses.component';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { EditExpensesComponent } from './edit-expenses/edit-expenses.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expense_date', 'plot_name', 'category', 'amount', 'details', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  searchForm: FormGroup;
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

  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.searchForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      plot_id: [''],
      category: ['']
    });
  }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';
    this.fetchPlots();

    // Auto-search when form values change
    this.searchForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.onSearch());

    if (this.userId) {
      this.loadExpenses();
    }
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
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
    this.expensesService.getExpenses(this.userId, filters).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
      }
    });
  }

  onSearch() {
    const filters = this.searchForm.value;
    this.loadExpenses(filters);
  }

  openAddExpense(): void {
    const dialogRef = this.dialog.open(AddexpensesComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExpenses();
      }
    });
  }

  editExpense(expenseId: number): void {
    const dialogRef = this.dialog.open(EditExpensesComponent, {
      width: '600px',
      data: { id: expenseId }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExpenses();
      }
    });
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
}
