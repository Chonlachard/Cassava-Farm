import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WorkerService } from '../worker.service';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-worker',
  templateUrl: './add-worker.component.html',
  styleUrls: ['./add-worker.component.css']
})
export class AddWorkerComponent implements OnInit {

  workerForm: FormGroup;
  availableSkills: string[] = ['คนขุด', 'คนฉีด', 'ตัดต้น','คนปลูก']; // ทักษะที่สามารถเลือกได้

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService,
    public dialogRef: MatDialogRef<AddWorkerComponent>,
    private translate: TranslateService
  ) {
    this.workerForm = this.fb.group({
      worker_id: [''], // ID ของคนงาน สามารถปล่อยว่างได้
      user_id: [{ value: '', disabled: true }], // ปิดการแก้ไข user_id
      worker_name: [''], // ชื่อ-นามสกุลของคนงาน
      phone: [''], // เบอร์โทรศัพท์ของคนงาน
      skills: [[]] // ใช้เป็น array สำหรับทักษะ
    });
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId') || '';
    this.workerForm.patchValue({ user_id: userId }); // ตั้งค่า user_id ที่ปิดการแก้ไข
  }

  onSubmit(): void {
    if (this.workerForm.valid) { // ตรวจสอบความถูกต้องของฟอร์มก่อนส่งข้อมูล
      const formData = {
        ...this.workerForm.value, // คัดลอกค่าจากฟอร์ม
        user_id: this.workerForm.get('user_id')?.value, // เพิ่ม user_id จากฟอร์ม
        skills: this.workerForm.get('skills')?.value.join(', ') // แปลง skills เป็น string ที่แยกด้วย ,
      };

      this.workerService.addWorker(formData).subscribe(
        response => {
          console.log('เพิ่มข้อมูลคนงานสำเร็จ:', response);

          // แสดง SweetAlert2 เมื่อเพิ่มข้อมูลสำเร็จ
          Swal.fire({
            icon: 'success',
            title: this.translate.instant('common.success'),
            text: this.translate.instant('worker.successAdd'),
            confirmButtonText: this.translate.instant('common.ok')
          }).then(() => {
            // ปิด dialog หลังจากแสดง alert
            this.dialogRef.close(true); // ส่งค่า true กลับไปยัง WorkerComponent
          });

          // ทำการรีเซ็ตฟอร์มหลังจากบันทึกข้อมูลสำเร็จ
          this.workerForm.reset();
        },
        error => {
          console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลคนงาน:', error);

          // แสดง SweetAlert2 เมื่อเกิดข้อผิดพลาด
          Swal.fire({
            icon: 'error',
            title: this.translate.instant('common.error'),
            text: this.translate.instant('worker.errorAdd'),
            confirmButtonText: this.translate.instant('common.ok')
          });
        }
      );
    } else {
      console.log('กรุณากรอกข้อมูลให้ครบถ้วน');

      // แสดง SweetAlert2 ถ้าฟอร์มไม่ถูกต้อง
      Swal.fire({
        icon: 'warning',
        title:  this.translate.instant('common.incomplete'),
        text:  this.translate.instant('worker.incompleteData'),
        confirmButtonText: this.translate.instant('common.ok')
      });
    }
  }

  onSkillChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const skills: string[] = this.workerForm.get('skills')?.value || [];

    if (checkbox.checked) {
      skills.push(checkbox.value); // เพิ่มทักษะเมื่อเลือก
    } else {
      const index = skills.indexOf(checkbox.value);
      if (index >= 0) {
        skills.splice(index, 1); // ลบทักษะเมื่อไม่เลือก
      }
    }

    this.workerForm.patchValue({ skills }); // อัปเดตค่าทักษะในฟอร์ม
  }
}
