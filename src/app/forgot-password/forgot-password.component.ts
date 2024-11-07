import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  email: string = '';
  errorMessage: string | null = null;


  constructor(private router: Router) {}


  onSubmit(){}
  goBack() {
    this.router.navigate(['/login']); // เปลี่ยนเส้นทางกลับไปยังหน้าเข้าสู่ระบบ
  }
}
