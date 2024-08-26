import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from './profile.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService



@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  newPassword: string = '';
  confirmPassword: string = '';
  userId: string = ''; // ดึง userId จาก local storage หรือบริการที่เกี่ยวข้อง
  

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private router: Router,
    private translate: TranslateService // Inject TranslateService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || ''; // ดึง userId จาก local storage
    this.loadProfile();
  }

  loadProfile(): void {
    if (this.userId) {
      this.profileService.getProfile(this.userId).subscribe(profile => {
        console.log('Profile loaded:', profile);

        // Mapping API response to form fields
        this.profileForm.patchValue({
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          email: profile.email
        });
      }, error => {
        console.error('Error loading profile', error);
      });
    } else {
      console.error('User ID not found in local storage');
    }
  }

  updateProfile(): void {
    const title = this.translate.instant('profile.updateProfileTitle');
    const text = this.translate.instant('profile.updateProfileText');
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
        if (this.profileForm.valid) {
          this.profileService.updateProfile(this.userId, this.profileForm.value).subscribe(response => {
            Swal.fire(
              this.translate.instant('profile.updateSuccessTitle'),
              this.translate.instant('profile.updateSuccessText'),
              'success'
            );
          }, error => {
            Swal.fire(
              this.translate.instant('profile.updateErrorTitle'),
              this.translate.instant('profile.updateErrorText'),
              'error'
            );
          });
        } else {
          Swal.fire(
            this.translate.instant('profile.formInvalidTitle'),
            this.translate.instant('profile.formInvalidText'),
            'error'
          );
        }
      }
    });
  }

  changePassword(): void {
    if (this.newPassword === this.confirmPassword) {
      if (this.newPassword.length >= 6) { // เพิ่มความปลอดภัย รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
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
            this.profileService.changePassword(this.userId, this.newPassword).subscribe(response => {
              Swal.fire(
                this.translate.instant('profile.changePasswordSuccessTitle'),
                this.translate.instant('profile.changePasswordSuccessText'),
                'success'
              );
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
}
