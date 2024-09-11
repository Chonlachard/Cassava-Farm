import { Component, OnInit } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-harvest',
  templateUrl: './add-harvest.component.html',
  styleUrls: ['./add-harvest.component.css']
})
export class AddHarvestComponent implements OnInit {
  harvestForm: FormGroup;
  userId: string = '';
  plots: any[] = []; // Define an array to hold plot data

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddHarvestComponent> // Inject MatDialogRef to close dialog
  ) {
    this.harvestForm = this.fb.group({
      harvest_id: [''], // Optional, remove if database handles it
      user_id: [{ value: '', disabled: true }],
      plot_id: [''],
      harvest_date: [''],
      company_name: [''],
      net_weight_kg: [''],
      starch_percentage: [''],
      image: [null], // Initialize as null, not as an empty string
      amount: ['']
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.fetchPlots(); // Fetch plot data on component initialization
    this.setDefaultDate(); // Set default date
  }

  fetchPlots(): void {
    this.harvestsService.getSerchPlot(this.userId).subscribe((res: any) => {
      this.plots = res; // Store plot data in plots array
    });
  }

  setDefaultDate(): void {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    this.harvestForm.get('harvest_date')?.setValue(formattedDate);
  }

  formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`; // Ensure the format is YYYY-MM-DD
  }

  onSubmit(): void {
    if (this.harvestForm.invalid) {
      Swal.fire({
        title: 'ข้อผิดพลาด!',
        text: 'กรุณาตรวจสอบข้อมูลในแบบฟอร์ม',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
  
    const formData = new FormData();
    formData.append('user_id', this.userId); // เพิ่ม user_id ลงใน FormData
    formData.append('plot_id', this.harvestForm.get('plot_id')?.value);
    formData.append('harvest_date', this.formatDate(this.harvestForm.get('harvest_date')?.value));
    formData.append('company_name', this.harvestForm.get('company_name')?.value);
    formData.append('net_weight_kg', this.harvestForm.get('net_weight_kg')?.value);
    formData.append('starch_percentage', this.harvestForm.get('starch_percentage')?.value);
    formData.append('amount', this.harvestForm.get('amount')?.value);
  
    // เพิ่มรูปภาพถ้ามี
    if (this.harvestForm.get('image')?.value) {
      formData.append('image', this.harvestForm.get('image')?.value);
    }
  
    this.harvestsService.addHarvest(formData).subscribe(response => {
      // แสดงการแจ้งเตือนเมื่อเพิ่มข้อมูลสำเร็จ
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'ข้อมูลเก็บเกี่ยวถูกเพิ่มเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง'
      }).then(() => {
        this.dialogRef.close(); // ปิด dialog ถ้าคุณเปิดใน modal
      });
    }, error => {
      console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลเก็บเกี่ยว', error);
      // แสดงข้อความข้อผิดพลาดให้ผู้ใช้ได้ทราบ
      Swal.fire({
        title: 'ข้อผิดพลาด!',
        text: 'ไม่สามารถเพิ่มข้อมูลเก็บเกี่ยวได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    });
  }

  onFileSelect(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.harvestForm.patchValue({
        image: file
      });
    }
  }
}
