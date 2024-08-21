import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  private apiUrl = 'http://localhost:3000/api'; // URL ของ API

  private userId: number | null = null;

  constructor(private http: HttpClient) {}

  getUserProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user`, { params: { user_id: userId.toString() } });
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? Number(userId) : null;
  }
}  

