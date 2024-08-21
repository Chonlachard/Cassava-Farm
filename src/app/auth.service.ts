import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api';
  private isLoggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) { }

  login(email: string, password: string) {
      return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password }).pipe(
          map(response => {
              localStorage.setItem('token', response.token);
              this.setLoggedIn(true);
              return response;
          })
      );
  }

  setLoggedIn(value: boolean) {
      this.isLoggedIn$.next(value);
  }

  get isLoggedIn() {
      return this.isLoggedIn$.asObservable();
  }

  logout() {
      localStorage.removeItem('token');
      this.setLoggedIn(false);
  }
}
