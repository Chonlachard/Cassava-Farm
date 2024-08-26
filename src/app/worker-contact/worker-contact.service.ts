import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorkerContactService {
  private baseUrl = 'http://localhost:3000/api/workers';

  constructor(private http: HttpClient) { }

  // สร้างพนักงานใหม่
  createWorker(worker: any): Observable<any> {
    return this.http.post(this.baseUrl, worker).pipe(
      catchError(this.handleError)
    );
  }

  // รับข้อมูลพนักงานทั้งหมด หรือค้นหาตาม user_id
  getWorkers(userId: string): Observable<any> {
    return this.http.get<any>(this.baseUrl, { params: { user_id: userId } });
  }

  // อัปเดตข้อมูลพนักงาน
  updateWorker(id: number, worker: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, worker).pipe(
      catchError(this.handleError)
    );
  }

  // ลบพนักงาน
  deleteWorker(id: number, userId: string): Observable<any> {
    let params = new HttpParams().set('user_id', userId);
    return this.http.delete(`${this.baseUrl}/${id}`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // จัดการข้อผิดพลาด
  private handleError(error: any) {
    // คุณสามารถเปลี่ยนแปลงหรือปรับปรุงการจัดการข้อผิดพลาดตามความต้องการของคุณ
    console.error('An error occurred:', error);
    return throwError(() => new Error('An error occurred. Please try again later.'));
  }
}
