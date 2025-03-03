import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashbordService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) { }

  getCashFlowReport(userId: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getCashFlowReport?user_id=${userId}&startDate=${startDate}&endDate=${endDate}`);
  }




}
