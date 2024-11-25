import { Component, OnInit, Inject } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-harvest',
  templateUrl: './edit-harvest.component.html',
  styleUrls: ['./edit-harvest.component.css']
})
export class EditHarvestComponent implements OnInit {
  harvestForm: FormGroup;
  userId: string = '';
  plots: any[] = [];

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditHarvestComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.harvestForm = this.fb.group({
      harvest_id: [''],
      user_id: [{ value: '', disabled: true }],
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
      image: [null],
      amount: ['']
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.harvestForm.patchValue({ user_id: this.userId });
    if (this.data && this.data.harvestId) {
      this.loadHarvestData(this.data.harvestId);
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
        plot_name: harvest.plot_name,
        harvest_date: this.formatDate(harvest.harvest_date),
        company_name: harvest.company_name,
        weight_in : harvest.weight_in,
        weight_out: harvest.weight_out,
        weight_product: harvest.weight_product,
        weight_deduct: harvest.weight_deduct,
        net_weight_kg: harvest.net_weight_kg,
        starch_percentage: harvest.starch_percentage,
        price: harvest.price,
        amount: harvest.amount,
        image: harvest.image_path
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
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
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

    const formData = { ...this.harvestForm.getRawValue() };

    this.harvestsService.updateHarvest(formData).subscribe(response => {
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'ข้อมูลเก็บเกี่ยวถูกแก้ไขเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง'
      }).then(() => {
        this.dialogRef.close();
      });
    }, error => {
      Swal.fire({
        title: 'ข้อผิดพลาด!',
        text: 'ไม่สามารถแก้ไขข้อมูลเก็บเกี่ยวได้ กรุณาลองอีกครั้ง',
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
