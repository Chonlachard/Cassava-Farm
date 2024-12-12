import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ForgotPasswordService } from './forgot-password.service';
import { TranslateService } from '@ngx-translate/core';

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
    private forgotService : ForgotPasswordService,
    private translate: TranslateService
    
  ) {}


  onSubmit() {
    if (this.email) {
      this.forgotService.sendOtp(this.email).subscribe({
        next: () => {
          // Send email as query parameter
          this.router.navigate(['/enter-otp'], { queryParams: { email: this.email } });
        },
        error: () => {
          // Use TranslateService to fetch the translation
          this.translate.get('form.invalidEmailMessage').subscribe((translatedMessage: string) => {
            this.errorMessage = translatedMessage;
          });
        }
      });
    } else {
      // Use TranslateService to fetch the translation for empty email
      this.translate.get('form.emailRequiredMessage').subscribe((translatedMessage: string) => {
        this.errorMessage = translatedMessage;
      });
    }
  }
  goBack() {
    this.router.navigate(['/login']); // เปลี่ยนเส้นทางกลับไปยังหน้าเข้าสู่ระบบ
  }
}
