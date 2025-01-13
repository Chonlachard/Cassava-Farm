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
      plot_id: ['', Validators.required],
      category: ['', Validators.required],
      details: [''],
      volume: [],
      cuttingDate: [''],
      brand: ['', Validators.required],
      formula: ['', Validators.required],
      paymentDate: [''],
      workerName: [''],
      landArea: [],
      pricePerRai: [],
      plotId: ['', Validators.required],
      bundleCount: ['', Validators.required],
      sprayDate: [''],
      numberOfCans: [],
      remarks: [''],
      purchasePrice: [],
      itemName: [''],
      area: [],
      rentalPeriod: [''],
      ownerPhone: [''],
      ownerName: [''],
      rentalDate: [''],
      purchaseDate: [''],
      varietyName: [''],
      shopName: [''],
      fuelDate: [''],
      repairDate: [''],
      repairNames: [''],
      purchaseLocation: [''],
      quantityLiters: [],
      pricePerBottle: [],
      pricePerBag: [],
      pricePerCan: [],
      pricePerTree: [],
      pricePerSpray: [],
      pricePerLiter: [],
      pricePerSeed: [],
      repairCost: [],
      equipmentCost: [],
      rentCost: [],
      pricePerTon: [],
      weight: [],
      quantity: [Validators.min(1)],
      numberOfTrees: [],
      totalPrice: []
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
        this.plots = res;
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

  // Handle form submission
  onSubmit(): void {
    if (this.expenseForm.valid) {
      const formData = { ...this.expenseForm.getRawValue() };
      this.transactionService.addExpense(formData).subscribe(
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
    } else {
      this.translate.get('expense.incompleteData').subscribe(translations => {
        Swal.fire({
          icon: 'warning',
          title: translations.title,
          text: translations.text,
          timer: 3000,
          timerProgressBar: true,
        });
      });
    }
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
          totalPrice = this.calculateExcavationCost();
          break;
        default:
          totalPrice = 0;
          break;
      }

      this.calculatedTotalPrice = totalPrice;
      this.expenseForm.patchValue({ totalPrice: this.calculatedTotalPrice }, { emitEvent: false });
    });
  }

  // Calculate hormone cost
  calculateHormoneCost(): number {
    const pricePerBottle = this.expenseForm.get('pricePerBottle')?.value || 0;
    const quantityHormone = this.expenseForm.get('quantity')?.value || 0;
    return pricePerBottle * quantityHormone;
  }

  // Calculate fertilizer cost
  calculateFertilizerCost(): number {
    const pricePerBag = this.expenseForm.get('pricePerBag')?.value || 0;
    const quantityFertilizer = this.expenseForm.get('quantity')?.value || 0;
    return pricePerBag * quantityFertilizer;
  }

  // Calculate weed killer cost
  calculateWeedKillerCost(): number {
    const pricePerCan = this.expenseForm.get('pricePerCan')?.value || 0;
    const quantityCans = this.expenseForm.get('quantity')?.value || 0;
    return pricePerCan * quantityCans;
  }

  // Calculate tree cutting cost
  calculateTreeCuttingCost(): number {
    const pricePerTreeCut = this.expenseForm.get('pricePerTree')?.value || 0;
    const numberOfTreesCut = this.expenseForm.get('numberOfTrees')?.value || 0;
    return pricePerTreeCut * numberOfTreesCut;
  }

  // Calculate tree planting cost
  calculateTreePlantingCost(): number {
    const pricePerTreePlant = this.expenseForm.get('pricePerTree')?.value || 0;
    const numberOfTreesPlant = this.expenseForm.get('numberOfTrees')?.value || 0;
    return pricePerTreePlant * numberOfTreesPlant;
  }

  // Calculate weed spraying cost
  calculateWeedSprayingCost(): number {
    const pricePerSprayWeed = this.expenseForm.get('pricePerSpray')?.value || 0;
    const numberOfSprayWeed = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSprayWeed * numberOfSprayWeed;
  }

  // Calculate hormone spraying cost
  calculateHormoneSprayingCost(): number {
    const pricePerSprayHormone = this.expenseForm.get('pricePerSpray')?.value || 0;
    const numberOfSprayHormone = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSprayHormone * numberOfSprayHormone;
  }

  // Calculate fuel cost
  calculateFuelCost(): number {
    const pricePerLiter = this.expenseForm.get('pricePerLiter')?.value || 0;
    const liters = this.expenseForm.get('quantity')?.value || 0;
    return pricePerLiter * liters;
  }

  // Calculate seed cost
  calculateSeedCost(): number {
    const pricePerSeed = this.expenseForm.get('pricePerSeed')?.value || 0;
    const numberOfSeeds = this.expenseForm.get('quantity')?.value || 0;
    return pricePerSeed * numberOfSeeds;
  }

  // Calculate repair cost
  calculateRepairCost(): number {
    return this.expenseForm.get('repairCost')?.value || 0;
  }

  // Calculate equipment cost
  calculateEquipmentCost(): number {
    return this.expenseForm.get('equipmentCost')?.value || 0;
  }

  // Calculate rent cost
  calculateRentCost(): number {
    return this.expenseForm.get('rentCost')?.value || 0;
  }

  // Calculate excavation cost
  calculateExcavationCost(): number {
    const pricePerTon = this.expenseForm.get('pricePerTon')?.value || 0;
    const weightInTons = this.expenseForm.get('weight')?.value || 0;
    return pricePerTon * weightInTons;
  }
}
