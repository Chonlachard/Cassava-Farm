import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CassavaAreaServiceService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  savePlantedArea(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json' // กำหนด content type เป็น JSON
    });

    return this.http.post<any>(`${this.apiUrl}/addplots`, data, { headers })
      .pipe(
        catchError(this.handleError) // การจัดการข้อผิดพลาด
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(() => new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'));

  }

  getCassavaArea(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getplots?user_id=${userId}`);
  }

  
  deletePlot(plotId: string): Observable<any> {
    debugger
    return this.http.put(`${this.apiUrl}/deleteplot/${plotId}`, {}); // เปลี่ยนเป็น PUT เพื่ออัปเดตข้อมูล
  }


  getPlotById(plotId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getPlotUpdate/${plotId}`);
  }

  updatePlot(plotData: any): Observable<any> {
    // กำหนด URL ของ API โดยใช้ plot_id
    return this.http.put<any>(`${this.apiUrl}/updateplot`, plotData);
  }

  checkFarmExists(userId: string): Observable<{ hasFarm: boolean }> {
    return this.http.get<{ hasFarm: boolean }>(`${this.apiUrl}/checkplot?user_id=${userId}`);
  }






}
