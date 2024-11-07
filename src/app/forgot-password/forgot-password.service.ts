import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }


  sendOtp(email: string): Observable<any> {
    const url = `${this.apiUrl}/sendOTP`;
    return this.http.post(url, { email }).pipe(
      catchError(this.handleError)
    );
  }


  // 2. ตรวจสอบ OTP ที่ผู้ใช้กรอก
  // ส่ง OTP ไปที่ backend พร้อมกับ email
  verifyOtp(email: string, otp: string): Observable<any> {
    const url = `${this.apiUrl}/verify-otp`;
    return this.http.post(url, { email, otp }).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(email: string, newPassword: string): Observable<any> {
    debugger
    const body = { email, newPassword };
    return this.http.post<any>(`${this.apiUrl}/change-password`, body);
  }


   // ฟังก์ชันสำหรับส่ง OTP ใหม่
   resendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resendOtp`, { email });
  }


  private handleError(error: any) {
    console.error('เกิดข้อผิดพลาด:', error);
    return throwError(() => new Error('เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง'));
  }

}
