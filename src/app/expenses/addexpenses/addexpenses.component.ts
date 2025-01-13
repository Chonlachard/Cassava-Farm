import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpensesService } from '../expenses.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-addexpenses',
  templateUrl: './addexpenses.component.html',
  styleUrls: ['./addexpenses.component.css']
})
export class AddexpensesComponent implements OnInit {

  expenseForm: FormGroup;
  isFormReset: boolean = false;
  plots: any[] = [];
  categories = [
    { value: 'ค่าฮอร์โมน', label: 'ค่าฮอร์โมน' },
    { value: 'ค่าปุ๋ย', label: 'ค่าปุ๋ย' },
    { value: 'ค่ายาฆ่าหญ่า', label: 'ค่ายาฆ่าหญ่า' },
    { value: 'ค่าคนตัดต้น', label: 'ค่าคนตัดต้น' },
    { value: 'ค่าคนปลูก', label: 'ค่าคนปลูก' },
    { value: 'ค่าคนฉีดยาฆ่าหญ่า', label: 'ค่าคนฉีดยาฆ่าหญ่า' },
    { value: 'ค่าคนฉีดยาฮอโมน', label: 'ค่าคนฉีดยาฮอโมน' },
    { value: 'ค่าน้ำมัน', label: 'ค่าน้ำมัน' },
    { value: 'ค่าพันธุ์มัน', label: 'ค่าพันธุ์มัน' },
    { value: 'ค่าซ่อมอุปกรณ์', label: 'ค่าซ่อมอุปกรณ์' },
    { value: 'ค่าอุปกรณ์', label: 'ค่าอุปกรณ์' },
    { value: 'ค่าเช่าที่ดิน', label: 'ค่าเช่าที่ดิน' },
    { value: 'ค่าขุด', label: 'ค่าขุด' }
  ];
  selectedCategory: string | null = null;
  calculatedTotalPrice: number = 0;

  constructor(
    private transactionService: ExpensesService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<AddexpensesComponent>,

  ) {
    this.expenseForm = this.fb.group({
      user_id: [{ value: '', disabled: true }, Validators.required],
      plot_id: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      category: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      details: [''],
      volume: [''],
      cuttingDate: [''],
      brand: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      formula: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      paymentDate: [''],
      workerName: [''],
      landArea: [''],
      pricePerRai: [''], // ต้องการตรวจสอบการกรอกข้อมูล
      bundleCount: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      sprayDate: [''],
      numberOfCans: [''],
      remarks: [''],
      purchasePrice: [''],
      itemName: [''],
      area: [''],
      rentalPeriod: [''],
      ownerPhone: [''],
      ownerName: [''],
      rentalDate: [''],  // ถ้าไม่จำเป็นต้องกรอก ให้ใช้ค่าว่าง
      purchaseDate: [''],  // ถ้าไม่จำเป็นต้องกรอก ให้ใช้ค่าว่าง
      varietyName: [''],
      shopName: [''],
      fuelDate: [''],
      repairDate: [''],
      repairNames: [''],
      purchaseLocation: [''],
      quantityLiters: [''],
      price_per_bottle: [''],
      pricePerBag: [''],
      pricePerCan: [''],
      pricePerTree: [''],
      pricePerSpray: [''],
      pricePerLiter: [''],
      pricePerSeed: [''],
      repairCost: [''],
      equipmentCost: [''],
      rentCost: [''],
      pricePerTon: [''],
      weight: [''],
      quantity: ['', Validators.min(1)],  // ตรวจสอบจำนวน
      numberOfTrees: [''],
      totalPrice: ['']
    });

  }

  ngOnInit() {
    this.initializeForm();
    this.fetchPlots();
    this.calculateTotalPrice();
    this.onCategoryChange();
  }

  // Initialize form with user ID
  initializeForm(): void {
    const userId = localStorage.getItem('userId') || '';
    this.expenseForm.patchValue({ user_id: userId });
  }

  // Fetch plots based on user ID
  fetchPlots(): void {
    const userId = localStorage.getItem('userId') || '';
    this.transactionService.getDeopPlot(userId).subscribe(
      (res: any) => {
        this.plots = res;  // เช็คว่า plots ได้รับข้อมูลจาก API หรือไม่
        console.log('Plots:', this.plots);
      },
      error => {
        this.translate.get('harvest.errorLoadingPlots').subscribe((translations: { title: string; text: string; }) => {
          Swal.fire({
            icon: 'error',
            title: translations.title,
            text: translations.text,
            timer: 3000,
            timerProgressBar: true,
          });
        });
      }
    );
  }

  onSubmit(): void {
    debugger
    const formValue = this.expenseForm.getRawValue();
    const category = formValue.category;
  
    // ตรวจสอบข้อมูลที่จำเป็นสำหรับแต่ละประเภท
    const details = this.getDetailsForCategory(category, formValue);
    if (!details) {
      this.translate.get('expense.incompleteData').subscribe(translations => {
        Swal.fire({
          icon: 'warning',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
      return; // หยุดการดำเนินการหากข้อมูลไม่ครบถ้วน
    }
  
    // จัดเตรียมข้อมูลสำหรับส่ง
    const expenseData = {
      user_id: formValue.user_id,
      category: category,
      details: details, // ส่งข้อมูลที่เกี่ยวข้องกับประเภท
    };
  
    // ส่งข้อมูลไปยัง API หรือบันทึกข้อมูล
    this.transactionService.addExpense(expenseData).subscribe(
      () => {
        this.translate.get('expense.successAdd').subscribe(translations => {
          Swal.fire({
            icon: 'success',
            title: translations.title,
            text: translations.text,
            timer: 3000,
            timerProgressBar: true,
          }).then(() => {
            this.dialogRef.close(true);
          });
        });
      },
      () => {
        this.translate.get('expense.errorAdd').subscribe(translations => {
          Swal.fire({
            icon: 'error',
            title: translations.title,
            text: translations.text,
            timer: 3000,
            timerProgressBar: true,
          });
        });
      }
    );
  }
  
  getDetailsForCategory(category: string, formValue: any) {
    debugger
    let details: any = null;  // ใช้ null แทนการส่งกลับค่าเป็นอ็อบเจ็กต์เปล่า
  
    switch (category) {
      
      case 'ค่าฮอร์โมน':
        if (formValue.brand && formValue.volume && formValue.price_per_bottle && formValue.quantity && formValue.plot_id) {
          details = { 
              brand: formValue.brand,
              volume: formValue.volume,
              price_per_bottle: formValue.price_per_bottle, // ตรวจสอบว่าใช้ price_per_bottle ในการคำนวณหรือไม่
              quantity: formValue.quantity, 
              plot_id: formValue.plot_id, // เปลี่ยนจาก plotId เป็น plot_id ตามชื่อที่ถูกต้อง
              totalPrice: this.calculatedTotalPrice // ตรวจสอบการคำนวณ totalPrice ที่ถูกต้อง
          };
      }
        break;
      case 'ค่าปุ๋ย':
        if (formValue.brand && formValue.formula && formValue.pricePerBag && formValue.quantity &&  formValue.plotId) {
          details = { 
            brand: formValue.brand,
            formula: formValue.formula,
            pricePerBag: formValue.pricePerBag, 
            quantity: formValue.quantity, 
            plotId : formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่ายาฆ่าหญ่า':
        if (formValue.brand && formValue.volume && formValue.price_per_bottle && formValue.quantity &&  formValue.plotId) {
          details = { 
            brand: formValue.brand,
            volume: formValue.volume,
            price_per_bottle: formValue.price_per_bottle,
            quantity: formValue.quantity, 
            plotId : formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนตัดต้น':
        if (formValue.cuttingDate && formValue.pricePerTree && formValue.numberOfTrees) {
          details = { 
            cuttingDate: formValue.cuttingDate,
            pricePerTree: formValue.pricePerTree, 
            numberOfTrees: formValue.numberOfTrees, 
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนปลูก':
        if (formValue.paymentDate && formValue.pricePerTree && formValue.workerName && formValue.landArea && formValue.pricePerRai && formValue.plotId) {
          details = { 
            paymentDate: formValue.paymentDate,
            pricePerTree: formValue.pricePerTree,
            workerName: formValue.workerName,
            landArea: formValue.landArea,
            pricePerRai: formValue.pricePerRai,
            plotId: formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนฉีดยาฆ่าหญ่า':
        if (formValue.sprayDate && formValue.numberOfCans && formValue.pricePerCan && formValue.plotId) {
          details = { 
            sprayDate: formValue.sprayDate,
            numberOfCans: formValue.numberOfCans,
            pricePerCan: formValue.pricePerCan,
            plotId: formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนฉีดยาฮอโมน':
        if (formValue.sprayDate && formValue.numberOfCans && formValue.pricePerCan && formValue.plotId) {
          details = { 
            sprayDate: formValue.sprayDate,
            numberOfCans: formValue.numberOfCans,
            pricePerCan: formValue.pricePerCan,
            plotId: formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าน้ำมัน':
        if (formValue.fuelDate && formValue.pricePerLiter && formValue.quantity && formValue.plotId) {
          details = { 
            fuelDate: formValue.fuelDate,
            pricePerLiter: formValue.pricePerLiter, 
            quantityLiters: formValue.quantity, 
            plotId: formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าพันธุ์มัน':
        if (formValue.purchaseDate && formValue.quantity && formValue.pricePerTree && formValue.plotId && formValue.varietyName && formValue.purchaseLocation) {
          details = { 
            purchaseDate: formValue.purchaseDate,
            quantity: formValue.quantity,
            pricePerTree: formValue.pricePerTree,
            plotId: formValue.plotId,
            varietyName: formValue.varietyName,
            purchaseLocation: formValue.purchaseLocation,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าซ่อมอุปกรณ์':
        if (formValue.repairDate && formValue.repairNames && formValue.repairCost && formValue.shopName) {
          details = { 
            repairDate: formValue.repairDate,
            repairNames: formValue.repairNames,
            details: formValue.details,
            repairCost: formValue.repairCost, 
            shopName: formValue.shopName
          };
        }
        break;
      case 'ค่าอุปกรณ์':
        if (formValue.purchaseDate && formValue.itemName && formValue.shopName && formValue.purchasePrice) {
          details = { 
            purchaseDate: formValue.purchaseDate,
            itemName: formValue.itemName,
            shopName: formValue.shopName,
            purchasePrice: formValue.purchasePrice,
            remarks: formValue.remarks
          };
        }
        break;
      case 'ค่าเช่าที่ดิน':
        if (formValue.rentalDate && formValue.ownerName && formValue.ownerPhone && formValue.area && formValue.pricePerRai && formValue.rentalPeriod && formValue.plotId) {
          details = { 
            rentalDate: formValue.rentalDate,
            ownerName: formValue.ownerName,
            ownerPhone: formValue.ownerPhone,
            area: formValue.area,
            pricePerRai: formValue.pricePerRai,
            rentalPeriod: formValue.rentalPeriod,
            plotId: formValue.plotId,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าขุด':
        if (formValue.paymentDate && formValue.weight && formValue.pricePerTon) {
          details = { 
            paymentDate: formValue.paymentDate,
            weight: formValue.weight,
            pricePerTon: formValue.pricePerTon, 
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      default:
        details = null; // ถ้าไม่พบประเภท
        break;
    }
  
    return details; // คืนค่า details หรือ null ถ้าไม่ครบถ้วน
  }
  
  // Handle formula input for proper formatting
  onFormulaInput(event: any): void {
    const inputValue = event.target.value;
    const formattedValue = inputValue
      .replace(/[^0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/(\d{2})(?=\d)/g, '$1-');
    this.expenseForm.get('formula')?.setValue(formattedValue, { emitEvent: false });
  }

  // Handle category change event
  onCategoryChange(): void {
    this.expenseForm.get('category')?.valueChanges.subscribe((value: string) => {
      this.selectedCategory = value;
    });
  }

  // Calculate total price based on selected category
  calculateTotalPrice(): void {
    this.expenseForm.valueChanges.subscribe(() => {
      const category = this.expenseForm.get('category')?.value || '';
      let totalPrice = 0;

      switch (category) {
        case 'ค่าฮอร์โมน':
          totalPrice = this.calculateHormoneCost();
          break;
        case 'ค่าปุ๋ย':
          totalPrice = this.calculateFertilizerCost();
          break;
        case 'ค่ายาฆ่าหญ่า':
          totalPrice = this.calculateWeedKillerCost();
          break;
        case 'ค่าคนตัดต้น':
          totalPrice = this.calculateTreeCuttingCost();
          break;
        case 'ค่าคนปลูก':
          totalPrice = this.calculateTreePlantingCost();
          break;
        case 'ค่าคนฉีดยาฆ่าหญ่า':
          totalPrice = this.calculateWeedSprayingCost();
          break;
        case 'ค่าคนฉีดยาฮอโมน':
          totalPrice = this.calculateHormoneSprayingCost();
          break;
        case 'ค่าน้ำมัน':
          totalPrice = this.calculateFuelCost();
          break;
        case 'ค่าพันธุ์มัน':
          totalPrice = this.calculateSeedCost();
          break;
        case 'ค่าซ่อมอุปกรณ์':
          totalPrice = this.calculateRepairCost();
          break;
        case 'ค่าอุปกรณ์':
          totalPrice = this.calculateEquipmentCost();
          break;
        case 'ค่าเช่าที่ดิน':
          totalPrice = this.calculateRentCost();
          break;
        case 'ค่าขุด':
          totalPrice = this.calculateDiggingCost();
          break;
      }

      this.calculatedTotalPrice = totalPrice;
    });
  }

  // Separate cost calculation methods for each category (sample implementations)
  calculateHormoneCost(): number {
    const price_per_bottle = this.expenseForm.get('price_per_bottle')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return price_per_bottle * quantity;
  }

  calculateFertilizerCost(): number {
    const pricePerBag = this.expenseForm.get('pricePerBag')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerBag * quantity;
  }

  calculateWeedKillerCost(): number {
    const pricePerCan = this.expenseForm.get('pricePerCan')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerCan * quantity;
  }

  calculateTreeCuttingCost(): number {
    const pricePerTree = this.expenseForm.get('pricePerTree')?.value || 0;
    const numberOfTrees = this.expenseForm.get('numberOfTrees')?.value || 0;
    return pricePerTree * numberOfTrees;
  }

  calculateTreePlantingCost(): number {
    const pricePerTree = this.expenseForm.get('pricePerTree')?.value || 0;
    const numberOfTrees = this.expenseForm.get('numberOfTrees')?.value || 0;
    return pricePerTree * numberOfTrees;
  }

  calculateWeedSprayingCost(): number {
    const pricePerSpray = this.expenseForm.get('pricePerSpray')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSpray * quantity;
  }

  calculateHormoneSprayingCost(): number {
    const pricePerSpray = this.expenseForm.get('pricePerSpray')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSpray * quantity;
  }

  calculateFuelCost(): number {
    const pricePerLiter = this.expenseForm.get('pricePerLiter')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerLiter * quantity;
  }

  calculateSeedCost(): number {
    const pricePerSeed = this.expenseForm.get('pricePerSeed')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSeed * quantity;
  }

  calculateRepairCost(): number {
    return this.expenseForm.get('repairCost')?.value || 0;
  }

  calculateEquipmentCost(): number {
    return this.expenseForm.get('equipmentCost')?.value || 0;
  }

  calculateRentCost(): number {
    return this.expenseForm.get('rentCost')?.value || 0;
  }

  calculateDiggingCost(): number {
    const pricePerTon = this.expenseForm.get('pricePerTon')?.value || 0;
    const weight = this.expenseForm.get('weight')?.value || 0;
    return pricePerTon * weight;
  }
}
