import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HarvestsService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) {}

  getHarvests(userId: string): Observable<any>{
    return this.http.get(`${this.apiUrl}/getharvests?user_id=${userId}`);
  }

  getSerchPlot(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getSerch?user_id=${userId}`);
  }

  addHarvest(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addharvest`, formData);
  }

  deleteHarvest(harvestId: number): Observable<any> {
    debugger
    return this.http.delete<any>(`${this.apiUrl}/deleteharvest/${harvestId}`);
  }
   // อัปเดตข้อมูลเก็บเกี่ยว
   updateHarvest(harvestId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${harvestId}`, formData); // ใช้ PUT สำหรับการอัปเดต
  }

  getHarvest(harvestId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getEditHarvest/${harvestId}`);
  }
}
