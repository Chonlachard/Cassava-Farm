import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ForgotPasswordService } from '../forgot-password.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  email: string = '';  // ตัวแปรสำหรับรับค่า email
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private translate: TranslateService, // Inject TranslateService
    private forgotService: ForgotPasswordService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // รับค่า email จาก queryParams
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || ''; // ถ้าไม่มี email ให้เป็นค่าว่าง
    });
  }

  changePassword(): void {
    if (this.newPassword === this.confirmPassword) {
      if (this.newPassword.length >= 6) { // เพิ่มความปลอดภัย รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
        // แสดงข้อความยืนยันการเปลี่ยนรหัสผ่าน
        const title = this.translate.instant('profile.changePasswordTitle');
        const text = this.translate.instant('profile.changePasswordText');
        const confirmButtonText = this.translate.instant('profile.confirmButtonText');
        const cancelButtonText = this.translate.instant('profile.cancelButtonText');

        Swal.fire({
          title: title,
          text: text,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: confirmButtonText,
          cancelButtonText: cancelButtonText
        }).then((result) => {
          if (result.isConfirmed) {
            // ส่ง email และ newPassword ไปที่ backend
            this.forgotService.changePassword(this.email, this.newPassword).subscribe(response => {
              Swal.fire(
                this.translate.instant('profile.changePasswordSuccessTitle'),
                this.translate.instant('profile.changePasswordSuccessText'),
                'success'
              );
              this.router.navigate(['/login']); // หลังจากเปลี่ยนรหัสผ่านสำเร็จ ไปที่หน้า login
            }, error => {
              Swal.fire(
                this.translate.instant('profile.changePasswordErrorTitle'),
                this.translate.instant('profile.changePasswordErrorText'),
                'error'
              );
            });
          }
        });
      } else {
        Swal.fire(
          this.translate.instant('profile.passwordLengthErrorTitle'),
          this.translate.instant('profile.passwordLengthErrorText'),
          'error'
        );
      }
    } else {
      Swal.fire(
        this.translate.instant('profile.passwordMismatchErrorTitle'),
        this.translate.instant('profile.passwordMismatchErrorText'),
        'error'
      );
    }
  }

  goBack() {
    this.router.navigate(['/login']); // ถ้าผู้ใช้ต้องการย้อนกลับไปหน้า login
  }
}
