import { Component, OnInit } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddHarvestComponent>,
    private translate: TranslateService
  ) {
    this.harvestForm = this.fb.group({
      plot_id: [''],
      harvest_date: [''],
      company_name: [''],
      weight_in: [''],
      weight_out: [''],
      weight_product: [''],
      weight_deduct: [''],
      net_weight_kg: [''],
      starch_percentage: [''],
      price: [''],
      amount: [''],
      image: [null]
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    const today = this.formatDate(new Date().toISOString());
    this.harvestForm.patchValue({ harvest_date: today });
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    debugger;
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
  
    formData.append('user_id', this.userId); // สมมติว่า userId ถูกดึงจาก session หรือ auth service
    formData.append('plot_id', this.harvestForm.get('plot_id')?.value);
    formData.append('harvest_date', this.formatDate(this.harvestForm.get('harvest_date')?.value));
    formData.append('company_name', this.harvestForm.get('company_name')?.value);
    formData.append('weight_in', this.harvestForm.get('weight_in')?.value);
    formData.append('weight_out', this.harvestForm.get('weight_out')?.value);
    formData.append('weight_product', this.harvestForm.get('weight_product')?.value);
    formData.append('weight_deduct', this.harvestForm.get('weight_deduct')?.value);
    formData.append('net_weight_kg', this.harvestForm.get('net_weight_kg')?.value);
    formData.append('starch_percentage', this.harvestForm.get('starch_percentage')?.value);
    formData.append('price', this.harvestForm.get('price')?.value);
    formData.append('amount', this.harvestForm.get('amount')?.value);
  
    if (this.harvestForm.get('image')?.value) {
      formData.append('image', this.harvestForm.get('image')?.value);
    }
  
    this.harvestsService.addHarvest(formData).subscribe(
      (response) => {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ข้อมูลเก็บเกี่ยวถูกเพิ่มเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        }).then(() => {
          this.dialogRef.close();
        });
      },
      (error) => {
        Swal.fire({
          title: 'ข้อผิดพลาด!',
          text: 'ไม่สามารถเพิ่มข้อมูลเก็บเกี่ยวได้ กรุณาลองอีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง'
        });
      }
    );
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
