import { Component, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { ExpensesDetailService } from './expenses-detail.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expenses-detail.component.html',
  styleUrls: ['./expenses-detail.component.css']
})
export class ExpensesDetailComponent implements OnChanges, AfterViewInit {
  @Input() showPopup: boolean = false;
  @Input() userId: string = '';
  @Input() selectedCategory: string = '';
  @Input() selectedYear!: number;
  @Input() startMonth!: number;
  @Input() endMonth!: number;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  expenses: any[] = [];
  dataSource = new MatTableDataSource<any>();
  loading: boolean = false;

  constructor(private expensesDetailService: ExpensesDetailService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showPopup'] && this.showPopup) {
      this.loadExpenseDetails();
    }
  }

  ngAfterViewInit() {
    // ✅ ตรวจสอบก่อนกำหนดค่าให้ Paginator
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadExpenseDetails(): void {
    this.loading = true;
    this.expensesDetailService.getExpensesDetail(this.userId, this.selectedCategory, this.selectedYear, this.startMonth, this.endMonth)
      .subscribe({
        next: (response) => {
          console.log("📌 ข้อมูลที่ดึงมา:", response);
          this.expenses = response.expenses;
          this.dataSource.data = this.expenses;

          // ✅ ตรวจสอบให้แน่ใจว่า `paginator` มีค่าก่อนกำหนด
          if (this.paginator) {
            setTimeout(() => {
              this.dataSource.paginator = this.paginator;
            });
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('❌ เกิดข้อผิดพลาด:', error);
          this.loading = false;
        }
      });
  }

  closePopup(): void {
    this.showPopup = false;
  }
}
