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

hideConfirmPassword: boolean = true;

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
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$') // ต้องมีอักษรพิมพ์ใหญ่, พิมพ์เล็ก, และตัวเลข
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  // ฟังก์ชันสำหรับตรวจสอบการตรงกันของรหัสผ่าน
  private passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
  
    if (!confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ required: true });
      return null;
    }
  
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
  
    return null; // ✅ เพิ่ม return ค่า null เพื่อป้องกัน error TS7030
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

          this.router.navigate(['/cassavaPlantedArea']);
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
        this.showSuccessAlert(); // ✅ แสดงข้อความ "สมัครสมาชิกสำเร็จ"
        this.toggleRegisterForm(); // ปิดฟอร์มสมัครสมาชิก
  
        // รีเซ็ตฟอร์มหลังจากสมัครสมาชิกสำเร็จ
        this.registerForm.reset();
  
        // ล้างค่าที่ไม่ใช่ฟิลด์ที่จำเป็นต้องกรอกใหม่
        this.registerForm.get('confirmPassword')?.setValue('');
        this.router.navigate(['/login']);
      },
      error => {
        console.error('Registration failed', error);
        // เปลี่ยนข้อความให้เป็น "อีเมลนี้มีในระบบ กรุณาใช้อีเมลอื่น" ในทุกกรณี
        this.showEmailExistsAlert();
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

  // ฟังก์ชันสำหรับตรวจสอบการป้อนเฉพาะตัวเลข
  validateNumberInput(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) { // อนุญาตเฉพาะ 0-9
      event.preventDefault();
    }
  }

  // ฟังก์ชันสำหรับตรวจสอบการวางข้อมูล
  validatePasteInput(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) { // ตรวจสอบว่ามีเฉพาะตัวเลขหรือไม่
      event.preventDefault();
    }
  }
   // แสดงแจ้งเตือนเมื่อสมัครสมาชิกสำเร็จ
   private showSuccessAlert(): void {
    Swal.fire({
      title: 'สำเร็จ',
      text: 'สมัครสมาชิกสำเร็จ',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
  }

// แสดงแจ้งเตือนเมื่ออีเมลซ้ำ และล้างค่าฟิลด์ email
private showEmailExistsAlert(): void {
  Swal.fire({
    title: 'ข้อผิดพลาด',
    text: 'อีเมลนี้มีในระบบ กรุณาใช้อีเมลอื่น',
    icon: 'error',
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#dc3545',
    timer: 3000,
  }).then(() => {
    this.registerForm.get('email')?.setValue(''); // ล้างค่า email
  });
}

  // ฟังก์ชันสำหรับเปลี่ยนการแสดงฟอร์มสมัครสมาชิก
  toggleRegisterForm() {  
    this.showRegister = !this.showRegister;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
  forgotPassword() {
    this.router.navigate(['/forgotPassword']);
  }
}
