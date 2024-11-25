import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HarvestsService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) { }

  getHarvests(userId: string, filters: any = {}): Observable<any> {
    debugger
    // เริ่มสร้างพารามิเตอร์สำหรับ query string
    let params = new HttpParams().set('user_id', userId);
  
    // เพิ่มตัวกรองใน query string (ถ้าตัวกรองมีค่า)
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });
  
    // ส่ง request พร้อม query string
    return this.http.get(`${this.apiUrl}/getharvests`, { params });
  }
  

  getSerchPlot(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getSerch?user_id=${userId}`);
  }

  addHarvest(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addharvest`, formData);
  }

  deleteHarvest(harvestId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deleteharvest/${harvestId}`);
  }
  // อัปเดตข้อมูลเก็บเกี่ยว
  updateHarvest(formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateharvest`, formData); // ใช้ PUT สำหรับการอัปเดต
  }

  getHarvest(harvestId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getEditHarvest/${harvestId}`);
  }
  getHarvestImage(harvestId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getHarvestImage/${harvestId}`);
}
}
