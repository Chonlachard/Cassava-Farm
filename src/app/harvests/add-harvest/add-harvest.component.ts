import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-add-harvest',
  templateUrl: './add-harvest.component.html',
  styleUrls: ['./add-harvest.component.css']
})
export class AddHarvestComponent implements OnInit {
  @Output() closeForm = new EventEmitter<void>(); // ✅ ส่ง event กลับไปที่ parent component
  @Input() plotId: number | null = null;
  harvestForm: FormGroup;
  userId: string = '';
  plots: any[] = [];
  isSubmitting = false; // ✅ ป้องกันกดซ้ำ

  constructor(
    private harvestsService: HarvestsService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.harvestForm = this.fb.group({
      plot_id: ['', Validators.required],
      harvest_date: ['', Validators.required],
      company_name: ['', Validators.required],
      net_weight_kg: ['', [Validators.required, Validators.min(1)]],
      starch_percentage: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      amount: [{ value: '', disabled: true }], // ✅ amount คำนวณอัตโนมัติ
      image: [null]
    });
  }

  async ngOnInit(): Promise<void> {
    this.userId = localStorage.getItem('userId') || '';
    const today = this.formatDate(new Date().toISOString());
    this.harvestForm.patchValue({ harvest_date: today });

    await this.fetchPlots(); // ✅ โหลดข้อมูลแปลง
    console.log("🔍 plot_id ที่ได้รับ:", this.plotId);
    // ✅ ถ้ามี plotId → ตั้งค่า plot_id และล็อกช่องเลือกแปลง
    if (this.plotId) {
      debugger
      this.harvestForm.patchValue({ plot_id: this.plotId });
      this.harvestForm.get('plot_id')?.disable(); // ✅ ล็อกการแก้ไข
    }


    this.setupAutoCalculation(); // ✅ ตั้งค่าการคำนวณ amount อัตโนมัติ
  }

  async fetchPlots(): Promise<void> {
    try {
      const res: any = await this.harvestsService.getSerchPlot(this.userId).toPromise();
      this.plots = res;
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: this.translate.instant('harvest.errorLoadingPlots.title'),
        text: this.translate.instant('harvest.errorLoadingPlots.text'),
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // ✅ ให้เป็น `YYYY-MM-DD`
  }

  setupAutoCalculation(): void {
    this.harvestForm.valueChanges.pipe(debounceTime(300)).subscribe(values => {
      const weight = parseFloat(values.net_weight_kg) || 0;
      const price = parseFloat(values.price) || 0;
      const amount = weight * price;

      this.harvestForm.patchValue({ amount: amount.toFixed(2) }, { emitEvent: false });
    });
  }

  async onSubmit(): Promise<void> {
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

    try {
      await this.harvestsService.addHarvest(formData).toPromise();
      Swal.fire({
        title: this.translate.instant('harvest.addSuccessTitle'),
        text: this.translate.instant('harvest.addSuccessText'),
        icon: 'success'
      }).then(() => {
        this.closeForm.emit(); // ✅ ปิดฟอร์มเมื่อบันทึกสำเร็จ
      });
    } catch (error) {
      console.error('❌ Error adding harvest:', error);
      Swal.fire({
        title: this.translate.instant('harvest.addErrorTitle'),
        text: this.translate.instant('harvest.addErrorText'),
        icon: 'error'
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  onFileSelect(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.harvestForm.patchValue({ image: file });
      this.harvestForm.updateValueAndValidity();
    }
  }

  cancel(): void {
    this.closeForm.emit(); // ✅ ปิดฟอร์มเมื่อกดยกเลิก
  }
}
