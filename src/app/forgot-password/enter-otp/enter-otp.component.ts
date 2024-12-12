import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPasswordService } from '../forgot-password.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-enter-otp',
  templateUrl: './enter-otp.component.html',
  styleUrls: ['./enter-otp.component.css']
})
export class EnterOtpComponent implements OnInit {
  email: string = '';
  otp: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  timer: number = 60; // ตั้งเวลาเริ่มต้นเป็น 60 วินาที
  timerInterval: any; // เพื่อใช้เก็บค่า interval
  showTimer: boolean = false; // เพื่อควบคุมการแสดงผลของเวลา

  constructor(
    private router: Router,
    private forgotService: ForgotPasswordService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // รับค่า email จาก queryParams
    this.route.queryParams.subscribe((params) => {
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
          this.translate.get('form.otpInvalidError').subscribe((translatedMessage: string) => {
            this.errorMessage = translatedMessage;
          });
        },
      });
    } else {
      this.translate.get('form.otpRequiredError').subscribe((translatedMessage: string) => {
        this.errorMessage = translatedMessage;
      });
    }
  }
  // ฟังก์ชัน resend OTP
  resendOTP(): void {
    this.forgotService.resendOtp(this.email).subscribe({
      next: () => {
        // Use translation for success message
        this.translate.get('form.otpSent').subscribe((translatedMessage: string) => {
          this.successMessage = translatedMessage;
        });
        this.errorMessage = null; // Clear previous error message
        this.startTimer(); // Start the timer after resending OTP
      },
      error: () => {
        // Use translation for error message
        this.translate.get('form.otpResendError').subscribe((translatedMessage: string) => {
          this.errorMessage = translatedMessage;
        });
        this.successMessage = null; // Clear previous success message
      },
    });
  }
  

  // ฟังก์ชันเริ่มจับเวลา
  startTimer(): void {
    this.timer = 60; // ตั้งเวลาใหม่
    this.showTimer = true;

    this.timerInterval = setInterval(() => {
      this.timer--; // ลดเวลาไปทีละ 1 วินาที
      if (this.timer <= 0) {
        clearInterval(this.timerInterval); // หยุดจับเวลาเมื่อถึง 0
        this.showTimer = false; // ซ่อนตัวจับเวลาเมื่อหมดเวลา
      }
    }, 1000);
  }

  // ฟังก์ชันสำหรับแสดงเวลาในรูปแบบนาที:วินาที
  getFormattedTime(): string {
    const minutes = Math.floor(this.timer / 60);
    const seconds = this.timer % 60;
    return `${minutes} นาที ${seconds} วินาที`;
  }
}
