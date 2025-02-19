import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpensesDetailService {
  private apiUrl = 'http://localhost:3000/api'; // URL ของ Backend API

  constructor(private http: HttpClient) {}

  // ✅ ดึงข้อมูลรายละเอียดรายจ่ายจาก API
  getExpensesDetail(userId: string, category: string, year: number, startMonth: number, endMonth: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getExpensesDetail`, {
      params: {
        user_id: userId,
        category: category,
        year: year.toString(),
        startMonth: startMonth.toString(),
        endMonth: endMonth.toString(),
      }
    });
  }
}
