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
}
