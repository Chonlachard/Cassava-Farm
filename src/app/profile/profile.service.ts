import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/api'; // URL สำหรับการดึงข้อมูลโปรไฟล์

  constructor(private http: HttpClient) { }

  // ดึงข้อมูลโปรไฟล์
  getProfile(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profileuser`, { params: { user_id: userId } });
  }

  // อัปเดตข้อมูลโปรไฟล์
  updateProfile(userId: string, profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profileuser`, profileData, { params: { user_id: userId } });
  }

  // เปลี่ยนรหัสผ่าน
  changePassword(userId: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, { newPassword }, { params: { user_id: userId } });
  }
}
