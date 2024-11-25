import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from './expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { AddexpensesComponent } from './addexpenses/addexpenses.component';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService
import { EditExpensesComponent } from './edit-expenses/edit-expenses.component';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expense_date','plot_name', 'category', 'amount', 'details', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  startDate: string = '';
  
  endDate: string = '';
  userId: string = '';
  searchForm!: FormGroup;
  plots: any[] = [];
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
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    public dialog: MatDialog,
    private translate: TranslateService // Inject TranslateService
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';
    this.fetchPlots();

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
    const userId = localStorage.getItem('userId') || '';
    this.expensesService.getDeopPlot(userId).subscribe((res: any) => {
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
        Swal.fire({
          title: this.translate.instant('expense.errorTitle'),
          text: this.translate.instant('expense.errorText'),
          icon: 'error'
        });
      });
    } else {
      Swal.fire(this.translate.instant('expense.searchForm.dateRangeError'));
    }
  }

  openAddExpense(expenseId?: number): void {
    const dialogRef = this.dialog.open(AddexpensesComponent, {
        width: '600px',
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result) {
            this.loadExpenses(); // Refresh list after adding/editing expense
        }
    });
}


editExpense(expenseId: number): void {
  debugger
  const dialogRef = this.dialog.open(EditExpensesComponent, {
    width: '600px',
    data: { id: expenseId } // ส่ง expenseId ไปยัง dialog
  });

  dialogRef.afterClosed().subscribe(result => {
      if (result) {
          this.loadExpenses(); // Refresh list after adding/editing expense
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
        this.expensesService.deleteExpense(expenseId).subscribe(() => {
          Swal.fire(
            this.translate.instant('expense.deleteSuccessTitle'),
            this.translate.instant('expense.deleteSuccessText'),
            'success'
          );
          this.loadExpenses(); // Reload data after successful delete
        }, (error) => {
          Swal.fire(
            this.translate.instant('expense.errorTitle'),
            this.translate.instant('expense.errorText'),
            'error'
          );
        });
      }
    });
  }

  clearSearch() {
    this.startDate= '',
      this.endDate= '',
    this.loadExpenses();
  }
}
