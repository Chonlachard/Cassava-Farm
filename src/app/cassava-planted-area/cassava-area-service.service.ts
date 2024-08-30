import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CassavaAreaServiceService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient
  ) { }

  getCassavaArea() {}
}
