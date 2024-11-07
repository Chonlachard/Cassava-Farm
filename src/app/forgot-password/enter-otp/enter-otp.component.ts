import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPasswordService } from '../forgot-password.service';

@Component({
  selector: 'app-enter-otp',
  templateUrl: './enter-otp.component.html',
  styleUrl: './enter-otp.component.css'
})
export class EnterOtpComponent implements OnInit{
  email: string = '';
  otp: string = '';
  errorMessage: string | null = null;

  constructor(private router: Router,  private forgotService : ForgotPasswordService, private route: ActivatedRoute) {}

  ngOnInit() {
    // รับค่า email จาก queryParams
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onSubmit() {
    if (this.otp) {
      this.forgotService.verifyOtp(this.email, this.otp).subscribe({
        next: () => {
          this.router.navigate(['/change-password'], { queryParams: { email: this.email } });
        },
        error: () => {
          this.errorMessage = 'OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง';
        }
      });
    } else {
      this.errorMessage = 'กรุณากรอก OTP';
    }
  }



}
