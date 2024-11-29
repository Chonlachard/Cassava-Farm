import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkerService } from '../worker.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2'; // ใช้สำหรับแสดงการแจ้งเตือน
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-worker',
  templateUrl: './edit-worker.component.html',
  styleUrls: ['./edit-worker.component.css']
})
export class EditWorkerComponent implements OnInit {
  workerForm: FormGroup;
  availableSkills: string[] = ['คนขุด', 'คนฉีด', 'ตัดต้น','คนปลูก']; // ทักษะที่สามารถเลือกได้
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService,
    public dialogRef: MatDialogRef<EditWorkerComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any // รับข้อมูล workerId ที่ถูกส่งมาจาก Edit
  ) {
    this.workerForm = this.fb.group({
      worker_id: [''], // ID ของคนงาน
      user_id: [{ value: '', disabled: true }], // ปิดการแก้ไข user_id
      worker_name: ['', Validators.required], // ชื่อ-นามสกุลของคนงาน (ต้องกรอก)
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // เบอร์โทรศัพท์ของคนงาน (ต้องกรอก 10 หลัก)
      skills: [[]] // ใช้เป็น array สำหรับทักษะ
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.workerForm.patchValue({ user_id: this.userId });

    if (this.data && this.data.workerId) { // ใช้ workerId จาก data
      this.loadWorkerData(this.data.workerId); // โหลดข้อมูลคนงานเมื่อมี worker_id ถูกส่งมา
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลคนงานจาก API
  loadWorkerData(workerId: string): void {
    this.workerService.getWorkerById(workerId).subscribe(
      response => {
        if (response) {
          this.workerForm.patchValue(response); // โหลดข้อมูลลงในฟอร์ม
        }
      },
      error => {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลคนงาน:', error);
        Swal.fire({
          icon: 'error',
          title: this.translate.instant('common.error'),
          text: 'ไม่สามารถดึงข้อมูลคนงานได้!',
          confirmButtonText: 'ตกลง'
        });
        this.dialogRef.close(); // ปิด dialog หากดึงข้อมูลล้มเหลว
      }
    );
  }

  onSubmit(): void {
    if (this.workerForm.valid) {
      const formData = {
        ...this.workerForm.value,
        user_id: this.workerForm.get('user_id')?.value, // เพิ่ม user_id ที่ปิดการแก้ไข
        skills: this.workerForm.get('skills')?.value || [] // ตรวจสอบว่า skills เป็น array
      };
  
  
      this.workerService.updateWorker(formData).subscribe(
        response => {
          console.log('แก้ไขข้อมูลคนงานสำเร็จ:', response);
          Swal.fire({
            icon: 'success',
            title: this.translate.instant('common.success'),
            text: this.translate.instant('worker.successEdit'),
            confirmButtonText: this.translate.instant('common.ok')
          });
          this.dialogRef.close(true); // ปิด dialog และส่งผลลัพธ์กลับไปยัง component หลัก
        },
        error => {
          console.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลคนงาน:', error);
          Swal.fire({
            icon: 'error',
            title: this.translate.instant('common.error'),
            text: this.translate.instant('worker.errorEdit'),
             confirmButtonText: this.translate.instant('common.ok')
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'warning',
        title:  this.translate.instant('common.incomplete'),
        text: this.translate.instant('worker.incompleteForm'),
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
