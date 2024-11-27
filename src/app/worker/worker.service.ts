import { HttpClient, HttpParams } from '@angular/common/http';
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


  getWorker(userId: string,filters : any={} ): Observable<any> {
    debugger
    let params = new HttpParams().set('user_id', userId);

    // เพิ่มตัวกรองใน query string (ถ้าตัวกรองมีค่า)
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    console.log('Request params:', params.toString());
    return this.http.get(`${this.apiUrl}/getWorkers`, { params });
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

  updateWorker(worker: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/editWorker`, worker);
  }
}
