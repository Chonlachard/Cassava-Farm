import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';





// กำหนดรูปแบบของข้อมูลค่าใช้จ่าย
export interface Expense {
  id: string;
  user_id: string;
  expense_date: string;
  category: string;
  amount: number;
  details: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private apiUrl = 'http://localhost:3000/api/';

  constructor(
    private http: HttpClient
  ) { }

  getExpenses(userId: string) : Observable<any> {
    debugger
    return this.http.get(`${this.apiUrl}/getExpenses?user_id=${userId}`);
    
  }
}
