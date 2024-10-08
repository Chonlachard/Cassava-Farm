import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExpensesService } from './expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { AddexpensesComponent } from './addexpenses/addexpenses.component';
import Swal from 'sweetalert2';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expense_date', 'category', 'amount', 'details', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  startDate: string = '';
  endDate: string = '';
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
    public dialog: MatDialog,
    private translate: TranslateService // Inject TranslateService
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadExpenses();
    }
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
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
      data: expenseId ? { id: expenseId } : {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses(); // Refresh list after adding/editing expense
      }
    });
  }

  editExpense(expenseId: number): void {
    this.openAddExpense(expenseId); // Open dialog for editing
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

  clearSearch(){
    this.startDate = '';
    this.endDate = '';
    this.loadExpenses();
  }
}
