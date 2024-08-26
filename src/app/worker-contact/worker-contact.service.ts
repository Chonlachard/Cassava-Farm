import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Worker } from '../../interfaces/worker.model'; // นำเข้า Worker Interface

@Injectable({
  providedIn: 'root'
})
export class WorkerContactService {
  private baseUrl = 'http://localhost:3000/api/workers';

  constructor(private http: HttpClient) { }

  // สร้างพนักงานใหม่
  createWorker(worker: Worker): Observable<Worker> {
    debugger
    return this.http.post<Worker>(this.baseUrl, worker).pipe(
      catchError(this.handleError)
    );
  }

  // รับข้อมูลพนักงานทั้งหมด หรือค้นหาตาม user_id
  getWorkers(userId: string): Observable<Worker[]> {
    const params = new HttpParams().set('user_id', userId);
    return this.http.get<Worker[]>(this.baseUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // อัปเดตข้อมูลพนักงาน
  updateWorker(id: number, worker: Worker): Observable<Worker> {
    return this.http.put<Worker>(`${this.baseUrl}/${id}`, worker).pipe(
      catchError(this.handleError)
    );
  }

  // ลบพนักงาน
  deleteWorker(id: number, userId: string): Observable<void> {
    const params = new HttpParams().set('user_id', userId);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params }).pipe(
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
