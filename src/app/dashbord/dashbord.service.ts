import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashbordService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getStats(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getPlotAnalytics?user_id=${userId}`);
}
// ฟังก์ชันสำหรับดึงปีที่มีการเก็บเกี่ยว
availableYears(userId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/availableYears?user_id=${userId}`);
}

// ฟังก์ชันสำหรับดึงข้อมูลการเงินตามปี
financialData(year: number, userId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/financialData?year=${year}&user_id=${userId}`);
}
}
