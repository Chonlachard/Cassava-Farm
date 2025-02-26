import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HarvestsService } from '../harvests.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-edit-harvest',
  templateUrl: './edit-harvest.component.html',
  styleUrls: ['./edit-harvest.component.css']
})
export class EditHarvestComponent implements OnInit, OnChanges {
  @Input() harvestId!: number; // ✅ รับค่า `harvestId` จาก `harvests.component`
  @Output() closeForm = new EventEmitter<void>(); // ✅ ส่ง event ปิดฟอร์มกลับไป

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
      harvest_id: [''],
      plot_id: ['', Validators.required],
      harvest_date: ['', Validators.required],
      company_name: ['', Validators.required],
      net_weight_kg: ['', [Validators.required, Validators.min(1)]],
      starch_percentage: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      amount: [{ value: '', disabled: true }], // ✅ คำนวณอัตโนมัติ
      image: [null]
    });
  }

  async ngOnInit(): Promise<void> {
    this.userId = localStorage.getItem('userId') || '';
    await this.fetchPlots();

    if (this.harvestId) {
      await this.loadHarvestData(this.harvestId);
    }
    this.setupAutoCalculation(); // ✅ คำนวณ amount อัตโนมัติ
  }
  // ✅ ตรวจสอบค่าของ harvestId หากมีการเปลี่ยนแปลง
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['harvestId'] && changes['harvestId'].currentValue) {
      console.log("🔄 harvestId เปลี่ยนแปลงเป็น:", changes['harvestId'].currentValue);
      this.loadHarvestData(changes['harvestId'].currentValue);
    }
  }
  async fetchPlots(): Promise<void> {
    try {
        const res: any = await this.harvestsService.getSerchPlot(this.userId).toPromise();
        this.plots = res;

        console.log("✅ ข้อมูลแปลงที่โหลด:", this.plots); // ✅ ตรวจสอบว่าได้ข้อมูลแปลงหรือไม่
    } catch (error) {
        console.error("❌ โหลดข้อมูลแปลงไม่สำเร็จ:", error);
        Swal.fire({
            icon: 'error',
            title: this.translate.instant('harvest.errorLoadingPlots.title'),
            text: this.translate.instant('harvest.errorLoadingPlots.text'),
            timer: 3000,
            timerProgressBar: true,
        });
    }
}


  async loadHarvestData(harvestId: number): Promise<void> {
    try {
      const harvest: any = await this.harvestsService.getHarvest(harvestId).toPromise();
      this.harvestForm.patchValue({
        harvest_id: harvest.harvest_id,
        plot_id: harvest.plot_id,
        harvest_date: this.formatDate(harvest.harvest_date),
        company_name: harvest.company_name,
        net_weight_kg: harvest.net_weight_kg,
        starch_percentage: harvest.starch_percentage,
        price: harvest.price,
        amount: harvest.amount,
        image: harvest.image_path
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: this.translate.instant('harvest.errorLoading.title'),
        text: this.translate.instant('harvest.errorLoading.text'),
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  setupAutoCalculation(): void {
    this.harvestForm.valueChanges.pipe(debounceTime(300)).subscribe(values => {
      const weight = parseFloat(values.net_weight_kg) || 0;
      const price = parseFloat(values.price) || 0;
      const amount = weight * price;
      this.harvestForm.patchValue({ amount: amount.toFixed(2) }, { emitEvent: false });
    });
  }

  onSubmit(): void {
    if (this.harvestForm.invalid) {
      Swal.fire({
        title: this.translate.instant('harvest.formInvalidErrorTitle'),
        text: this.translate.instant('harvest.formInvalidErrorText'),
        icon: 'error',
        confirmButtonText: this.translate.instant('harvest.confirmButtonText')
      });
      return;
    }

    const formData = { ...this.harvestForm.getRawValue() };

    // ✅ ตรวจสอบว่า harvestId มีค่าหรือไม่
    if (!this.harvestId) {
      Swal.fire({
        title: this.translate.instant('harvest.updateErrorTitle'),
        text: 'ไม่สามารถอัปเดตได้ เนื่องจากไม่มี harvestId',
        icon: 'error'
      });
      return;
    }

    this.harvestsService.updateHarvest(formData).subscribe(
      () => {
        Swal.fire({
          title: this.translate.instant('harvest.updateSuccessTitle'),
          text: this.translate.instant('harvest.updateSuccessText'),
          icon: 'success',
          confirmButtonText: this.translate.instant('harvest.confirmButtonText')
        }).then(() => {
          this.closeForm.emit(); // ✅ ใช้แทน this.dialogRef.close();
        });
      },
      () => {
        Swal.fire({
          title: this.translate.instant('harvest.updateErrorTitle'),
          text: this.translate.instant('harvest.updateErrorText'),
          icon: 'error',
          confirmButtonText: this.translate.instant('harvest.confirmButtonText')
        });
      }
    );
  }


  onFileSelect(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.harvestForm.patchValue({ image: file });
    }
  }

  cancel(): void {
    this.closeForm.emit(); // ✅ ปิดฟอร์มเมื่อกดยกเลิก
  }
}
