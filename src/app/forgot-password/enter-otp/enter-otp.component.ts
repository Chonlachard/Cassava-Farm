import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPasswordService } from '../forgot-password.service';

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
    private route: ActivatedRoute
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
          this.errorMessage = 'OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง';
        },
      });
    } else {
      this.errorMessage = 'กรุณากรอก OTP';
    }
  }

  // ฟังก์ชัน resend OTP
  resendOTP(): void {
    this.forgotService.resendOtp(this.email).subscribe({
      next: () => {
        this.successMessage = 'OTP ถูกส่งไปที่อีเมลของคุณแล้ว';
        this.errorMessage = null; // ล้างข้อความผิดพลาด
        this.startTimer(); // เริ่มจับเวลาหลังจากส่ง OTP ใหม่
      },
      error: () => {
        this.errorMessage = 'เกิดข้อผิดพลาดในการส่ง OTP ใหม่';
        this.successMessage = null; // ล้างข้อความสำเร็จ
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
