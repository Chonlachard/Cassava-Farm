import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ForgotPasswordService } from './forgot-password.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  email: string = '';
  errorMessage: string | null = null;


  constructor(
    private router: Router,
    private forgotService : ForgotPasswordService
    
  ) {}


  onSubmit() {
    if (this.email) {
      this.forgotService.sendOtp(this.email).subscribe({
        next: () => {
          // ส่งค่า email ไปด้วย
          this.router.navigate(['/enter-otp'], { queryParams: { email: this.email } });
        },
        error: () => {
          this.errorMessage = 'ไม่สามารถส่ง OTP ได้ กรุณาลองอีกครั้ง';
        }
      });
    } else {
      this.errorMessage = 'กรุณากรอกอีเมล';
    }
  }
  goBack() {
    this.router.navigate(['/login']); // เปลี่ยนเส้นทางกลับไปยังหน้าเข้าสู่ระบบ
  }
}
