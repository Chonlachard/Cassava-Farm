import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';



// กำหนดรูปแบบของข้อมูลค่าใช้จ่าย
export interface Expense {
  expense_id: number; // ใช้ number
  user_id: string;
  expense_date: string; // หรือ Date ถ้าต้องการใช้ Date object
  category: string;
  amount: number;
  details: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) { }

  // ดึงข้อมูลค่าใช้จ่ายตาม userId พร้อมตัวกรอง
  getExpenses(userId: string, filters: any = {}): Observable<any> {
    // สร้างพารามิเตอร์สำหรับ query string
    let params = new HttpParams().set('user_id', userId);

    // เพิ่มตัวกรองใน query string (ถ้าตัวกรองมีค่า)
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    console.log('Request params:', params.toString());

    return this.http.get(`${this.apiUrl}/getExpenses?${params}`);
  }


  addExpense(expense: any): Observable<any> {
    debugger
    console.log(expense);
    // ทำการตรวจสอบ หรือปรับข้อมูลก่อนส่ง API ถ้าจำเป็น
    return this.http.post<any>(`${this.apiUrl}/addExpenses`, expense);
  
  }
  getExpenseById(expenseId: number): Observable<any> {
    debugger
    return this.http.get(`${this.apiUrl}/getExpenseEdit?expense_id=${expenseId}`);
  }

  // ฟังก์ชันสำหรับลบค่าใช้จ่าย
  deleteExpense(expenseId: number): Observable<any> {
    debugger
    const url = `${this.apiUrl}/expenses/${expenseId}`;
    return this.http.put<any>(url, { is_deleted: 1 });
  }

  updateExpense(expenseData: any): Observable<any> {
    debugger
    console.log(expenseData);
    return this.http.put(`${this.apiUrl}/editExpenses`, expenseData);
  }
  
  getExpensesByDateRange(userId: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/expenses/date-range`, {
      params: new HttpParams()
        .set('user_id', userId)
        .set('startDate', startDate)  // ใช้ 'startDate' ตามที่ API คาดหวัง
        .set('endDate', endDate)      // ใช้ 'endDate' ตามที่ API คาดหวัง
    });
  }


  getDeopPlot(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getDeopdowplot?user_id=${userId}`);
  }


  getExpensesDetailById(expenseId: string): Observable<any> {
    debugger
    return this.http.get<any>(`${this.apiUrl}/getExpensesDetailId`, {
      params: { expense_id: expenseId }
    });
  }
}
