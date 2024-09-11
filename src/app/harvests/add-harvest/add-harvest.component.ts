import { Component, OnInit, Inject } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-harvest',
  templateUrl: './add-harvest.component.html',
  styleUrls: ['./add-harvest.component.css']
})
export class AddHarvestComponent implements OnInit {
  harvestForm: FormGroup;
  userId: string = '';
  plots: any[] = [];
  isEditing: boolean = false;

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddHarvestComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.harvestForm = this.fb.group({
      harvest_id: [''],
      user_id: [{ value: '', disabled: true }],
      plot_id: [''],
      harvest_date: [''],
      company_name: [''],
      net_weight_kg: [''],
      starch_percentage: [''],
      image: [null],
      amount: ['']
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.harvestForm.patchValue({ user_id: this.userId });

    if (this.data && this.data.harvestId) {
      this.isEditing = true;
      this.loadHarvestData(this.data.harvestId);
    } else {
      const today = this.formatDate(new Date().toISOString());
      this.harvestForm.patchValue({ harvest_date: today });
    }

    this.fetchPlots();
  }

  fetchPlots(): void {
    this.harvestsService.getSerchPlot(this.userId).subscribe((res: any) => {
      this.plots = res;
    }, error => {
      this.translate.get('harvest.errorLoadingPlots').subscribe((translations: { title: string; text: string; }) => {
        Swal.fire({
          icon: 'error',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
    });
  }

  loadHarvestData(harvestId: number): void {
    this.harvestsService.getHarvest(harvestId).subscribe((harvest: any) => {
      this.harvestForm.patchValue({
        harvest_id: harvest.harvest_id,
        plot_id: harvest.plot_id,
        harvest_date: this.formatDate(harvest.harvest_date), // ใช้ฟังก์ชัน formatDate เพื่อให้วันที่ถูกต้อง
        company_name: harvest.company_name,
        net_weight_kg: harvest.net_weight_kg,
        starch_percentage: harvest.starch_percentage,
        amount: harvest.amount,
        image: null // รีเซ็ตฟิลด์ image
      });
    }, error => {
      this.translate.get('harvest.errorLoading').subscribe((translations: { title: string; text: string; }) => {
        Swal.fire({
          icon: 'error',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // เดือนต้องเป็น 2 หลัก
    const day = date.getDate().toString().padStart(2, '0'); // วันต้องเป็น 2 หลัก
    return `${year}-${month}-${day}`;
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
    formData.append('user_id', this.userId);
    formData.append('plot_id', this.harvestForm.get('plot_id')?.value);
    formData.append('harvest_date', this.formatDate(this.harvestForm.get('harvest_date')?.value));
    formData.append('company_name', this.harvestForm.get('company_name')?.value);
    formData.append('net_weight_kg', this.harvestForm.get('net_weight_kg')?.value);
    formData.append('starch_percentage', this.harvestForm.get('starch_percentage')?.value);
    formData.append('amount', this.harvestForm.get('amount')?.value);

    if (this.harvestForm.get('image')?.value) {
      formData.append('image', this.harvestForm.get('image')?.value);
    }

    if (this.isEditing) {
      this.harvestsService.updateHarvest(this.harvestForm.get('harvest_id')?.value, formData).subscribe(response => {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ข้อมูลเก็บเกี่ยวถูกแก้ไขเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        }).then(() => {
          this.dialogRef.close();
        });
      }, error => {
        console.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลเก็บเกี่ยว', error);
        Swal.fire({
          title: 'ข้อผิดพลาด!',
          text: 'ไม่สามารถแก้ไขข้อมูลเก็บเกี่ยวได้ กรุณาลองอีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง'
        });
      });
    } else {
      this.harvestsService.addHarvest(formData).subscribe(response => {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ข้อมูลเก็บเกี่ยวถูกเพิ่มเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        }).then(() => {
          this.dialogRef.close();
        });
      }, error => {
        console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลเก็บเกี่ยว', error);
        Swal.fire({
          title: 'ข้อผิดพลาด!',
          text: 'ไม่สามารถเพิ่มข้อมูลเก็บเกี่ยวได้ กรุณาลองอีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง'
        });
      });
    }
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
