import { Component, HostListener, OnInit } from '@angular/core';
import { NavbarService } from './navbar.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  userName: string = '';
  dropdownVisible: boolean = false;

  constructor(
    private navbarService: NavbarService,
    private translate: TranslateService
  ) {
   
  }

  ngOnInit(): void {
    debugger
    // สมมุติว่า userId จะได้รับจากบริการหรือแหล่งข้อมูลอื่น ๆ
    const userId = this.getUserId(); // ใช้ฟังก์ชันเพื่อดึง userId ที่ได้รับจากการล็อกอิน
    console.log('User ID from localStorage:', userId);

    if (userId) {
      this.navbarService.getUserProfile(userId).subscribe(
        data => {
          this.userName = `${data.firstName} ${data.lastName}`;
        },
        error => {
          console.error('Error fetching user profile', error);
        }
      );
    } else {
      console.warn('No user ID available');
    }
  }

  toggleDropdown(event: MouseEvent): void {
    this.dropdownVisible = !this.dropdownVisible;
    event.stopPropagation(); // ป้องกันการคลิกจากการเปลี่ยนแปลงสถานะของ dropdown
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // ตรวจสอบว่าคลิกเกิดขึ้นภายใน dropdown หรือไม่
    const targetElement = event.target as HTMLElement;
    const userMenuElement = document.querySelector('.user-menu') as HTMLElement;
    
    if (userMenuElement && !userMenuElement.contains(targetElement)) {
      this.dropdownVisible = false;
    }
  }
  private getUserId(): number | null {
    // ดึง userId จากบริการ
    return this.navbarService.getUserId();
  }
  logout(){
    console.log('Logging out');
  };

  setLanguage(lang: string) {
    this.translate.use(lang);
  }
}
