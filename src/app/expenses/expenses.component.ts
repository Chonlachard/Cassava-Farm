import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ExpensesService } from './expenses.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
  displayedColumns: string[] = ['expense_date','category','amount','details','actions']; // ปรับให้ตรงกับการกำหนดคอลัมน์
  expenses: any[] = []; // ปรับประเภทตามโมเดลข้อมูลของคุณ


  startDate: string = ''; // สำหรับกรองข้อมูลตามวันที่เริ่มต้น
  endDate: string = '';   // สำหรับกรองข้อมูลตามวันที่สิ้นสุด
  userId: string = '';


  constructor(
    private fb: FormBuilder,
    private expensesService: ExpensesService,
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.expensesService.getExpenses(this.userId).subscribe((res: any) => {
        this.expenses = res;
      });
    }
  }

  editExpense(){}
  deleteExpense(){}

  onSearch(){}

}
