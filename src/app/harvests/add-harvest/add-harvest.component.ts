import { Component, OnInit } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  isSubmitting = false; // ✅ ป้องกันกดซ้ำ

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddHarvestComponent>,
    private translate: TranslateService
  ) {
    this.harvestForm = this.fb.group({
      plot_id: ['', Validators.required],
      harvest_date: ['', Validators.required],
      company_name: ['', Validators.required],
      net_weight_kg: ['', [Validators.required, Validators.min(1)]],
      starch_percentage: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      amount: ['', [Validators.required, Validators.min(1)]],
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
    this.harvestsService.getSerchPlot(this.userId).subscribe(
      (res: any) => {
        this.plots = res;
      },
      error => {
        Swal.fire({
          icon: 'error',
          title: this.translate.instant('harvest.errorLoadingPlots.title'),
          text: this.translate.instant('harvest.errorLoadingPlots.text'),
          timer: 3000,
          timerProgressBar: true,
        });
      }
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // ✅ ให้เป็น `YYYY-MM-DD`
  }

  onSubmit(): void {
    if (this.harvestForm.invalid) {
      Swal.fire({
        title: this.translate.instant('harvest.formInvalidErrorTitle'),
        text: this.translate.instant('harvest.formInvalidErrorText'),
        icon: 'error'
      });
      return;
    }

    if (this.isSubmitting) return; // ✅ ป้องกันกดซ้ำ
    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('user_id', this.userId);
    ['plot_id', 'harvest_date', 'company_name', 'net_weight_kg', 'starch_percentage', 'price', 'amount'].forEach(field => {
      const value = this.harvestForm.get(field)?.value;
      if (value) formData.append(field, value.toString());
    });

    const image = this.harvestForm.get('image')?.value;
    if (image) formData.append('image', image);

    const formDataObject: any = {};
  formData.forEach((value, key) => {
    formDataObject[key] = value;
  });
  console.log("🚀 Submitting Harvest Data:", formDataObject);

    this.harvestsService.addHarvest(formData).subscribe(
      () => {
        Swal.fire({
          title: this.translate.instant('harvest.addSuccessTitle'),
          text: this.translate.instant('harvest.addSuccessText'),
          icon: 'success'
        }).then(() => {
          this.dialogRef.close();
        });
      },
      error => {
        console.error('❌ Error adding harvest:', error);
        Swal.fire({
          title: this.translate.instant('harvest.addErrorTitle'),
          text: this.translate.instant('harvest.addErrorText'),
          icon: 'error'
        });
      }
    ).add(() => this.isSubmitting = false);
  }

  onFileSelect(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.harvestForm.patchValue({ image: file });
      this.harvestForm.updateValueAndValidity();
    }
  }
}
