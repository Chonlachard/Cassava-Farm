import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';  // นำเข้า TranslateService
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  hidePassword = true;
  showRegister = false;

  constructor(
    private fb: FormBuilder,
    private authService: LoginService,
    private router: Router,
    private translate: TranslateService 
  ) {
    // สร้างฟอร์มเข้าสู่ระบบ
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // สร้างฟอร์มสมัครสมาชิก
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^\\+?\\d{10,15}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  // ฟังก์ชันสำหรับตรวจสอบการตรงกันของรหัสผ่าน
  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // ฟังก์ชันสำหรับเข้าสู่ระบบ
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.showAlert('login.requiredField', 'error');
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe(
      response => {
        if (response && response.user && response.token) {
          const userId = response.user.user_id;
          console.log('User ID from login:', userId);

          localStorage.setItem('userId', userId.toString());
          localStorage.setItem('token', response.token);

          this.router.navigate(['/dashboard']);
        } else {
          this.showAlert('login.invalidCredentials', 'error');
        }
      },
      error => {
        console.error('Login failed', error);
        this.showAlert('login.loginFailure', 'error');
      }
    );
  }

  // ฟังก์ชันสำหรับสมัครสมาชิก
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.showAlert('login.requiredField', 'error');
      return;
    }
  
    const formValues = this.registerForm.value;
    const userData = {
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      phone: formValues.phoneNumber,
      email: formValues.email,
      password: formValues.password
    };
  
    this.authService.register(userData).subscribe(
      response => {
        console.log('Registration successful', response);
        this.showAlert('login.registrationSuccess', 'success');
        this.toggleRegisterForm(); // ปิดฟอร์มสมัครสมาชิกหลังจากสำเร็จ
  
        // รีเซ็ตฟอร์มหลังจากการสมัครสมาชิกสำเร็จ
        this.registerForm.reset();
        
        // ล้างค่าที่ไม่ใช่ฟิลด์ที่จำเป็นต้องกรอกใหม่
        this.registerForm.get('confirmPassword')?.setValue('');
        this.router.navigate(['/login']);
      },
      error => {
        console.error('Registration failed', error);
        let errorMessage = 'login.registrationFailure';
        if (error.status === 409) {
          errorMessage = 'login.emailExists';
        }
        this.showAlert(errorMessage, 'error');
      }
    );
  }
  
  // ฟังก์ชันสำหรับแสดง SweetAlert2
  private showAlert(key: string, type: 'success' | 'error'): void {
    this.translate.get(key).subscribe((message: string) => {
      Swal.fire({
        title: type === 'success' ? 'Success' : 'Error',
        text: message,
        icon: type,
        confirmButtonText: 'OK',
        confirmButtonColor: type === 'success' ? '#28a745' : '#dc3545',
        timer: 3000,
        timerProgressBar: true
      });
    });
  }

  // ฟังก์ชันสำหรับเปลี่ยนการแสดงฟอร์มสมัครสมาชิก
  toggleRegisterForm() {
    this.showRegister = !this.showRegister;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
