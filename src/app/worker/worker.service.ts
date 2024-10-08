import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) { }


  getWorker(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getWorkers?user_id=${userId}`);
  }

  addWorker(worker: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addWorker`, worker);
  }

  deleteWorker(workerId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteWorker/${workerId}`);
  }

  getWorkerById(workerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getEditWorker/${workerId}`);
  }
}
