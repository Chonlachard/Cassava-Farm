import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpensesService } from '../expenses.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-editexpenses',
 templateUrl: './edit-expenses.component.html',
  styleUrls: ['./edit-expenses.component.css']
})
export class EditExpensesComponent implements OnInit {

  expenseForm: FormGroup;
  expenseId: string = ''; // กำหนด ID ของค่าใช้จ่าย
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
  treesPerBundle: number = 0;


  constructor(
    private transactionService: ExpensesService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<EditExpensesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.expenseForm = this.fb.group({
      area: [''],
      brand: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      bundleCount: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      category: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      cutting_date: [''],
      details: [''],
      descript : [''],
      equipmentCost: [''],
      fuel_date: [''],
      formula: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      land_area: [''],
      number_of_cans: [''],
      number_of_trees: [''],
      owner_name: [''],
      owner_phone: [''],
      payment_date: [''],
      plot_id: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      price_per_can: [''],
      price_per_liter: [''],
      price_per_rai: [''], // ต้องการตรวจสอบการกรอกข้อมูล
      pricePerSeed: [''],
      pricePerSpray: [''],
      price_per_ton: [''],
      price_per_bag: [''],
      price_per_bottle: [''],
      price_per_tree: [''],
      purchase_date: [''],  // ถ้าไม่จำเป็นต้องกรอก ให้ใช้ค่าว่าง
      purchaseLocation: [''],
      purchase_price: [''],
      purchase_location: [''],
      quantity: ['', Validators.min(1)],  // ตรวจสอบจำนวน
      quantity_liters: [''],
      remarks: [''],
      rentCost: [''],
      rental_date: [''],  // ถ้าไม่จำเป็นต้องกรอก ให้ใช้ค่าว่าง
      rental_period: [''],
      repair_cost: [''],
      repair_date: [''],
      repair_names: [''],
      shop_name: [''],
      spray_date: [''],
      totalPrice: [''],
      user_id: [{ value: '', disabled: true }, Validators.required],
      variety_name: [''],
      volume: [''],
      weight: [''],
      worker_name: [''],
      item_name : [''],
      total_price : ['']

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
        if (formValue.brand && formValue.volume && formValue.price_per_bottle && formValue.quantity && formValue.plot_id && formValue.purchase_location) {
          details = { 
              brand: formValue.brand,
              volume: formValue.volume,
              price_per_bottle: formValue.price_per_bottle, // ตรวจสอบว่าใช้ price_per_bottle ในการคำนวณหรือไม่
              quantity: formValue.quantity, 
              purchase_location : formValue.purchase_location, 
              plot_id: formValue.plot_id, // เปลี่ยนจาก plotId เป็น plot_id ตามชื่อที่ถูกต้อง
              totalPrice: this.calculatedTotalPrice // ตรวจสอบการคำนวณ totalPrice ที่ถูกต้อง
          };
          console.log('Details:', details);
      }
        break;
      case 'ค่าปุ๋ย':
        if (formValue.brand && formValue.formula && formValue.price_per_bag && formValue.quantity &&  formValue.plot_id) {
          details = { 
            brand: formValue.brand,
            formula: formValue.formula,
            price_per_bag: formValue.price_per_bag, 
            quantity: formValue.quantity, 
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่ายาฆ่าหญ่า':
        if (formValue.brand && formValue.volume && formValue.price_per_bottle && formValue.quantity &&  formValue.plot_id) {
          details = { 
            brand: formValue.brand,
            volume: formValue.volume,
            price_per_bottle: formValue.price_per_bottle,
            quantity: formValue.quantity, 
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนตัดต้น':
        if (formValue.cutting_date && formValue.price_per_tree && formValue.number_of_trees && formValue.plot_id) {
          details = { 
            cutting_date: formValue.cutting_date,
            price_per_tree: formValue.price_per_tree, 
            number_of_trees: formValue.number_of_trees, 
            totalPrice: this.calculatedTotalPrice,
            plot_id: formValue.plot_id
          };
        }
        break;
      case 'ค่าคนปลูก':
        if (formValue.payment_date  && formValue.worker_name && formValue.land_area && formValue.price_per_rai && formValue.plot_id) {
          details = { 
            payment_date: formValue.payment_date,
            worker_name: formValue.worker_name,
            land_area: formValue.land_area,
            price_per_rai: formValue.price_per_rai,
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนฉีดยาฆ่าหญ่า':
        if (formValue.spray_date && formValue.number_of_cans && formValue.price_per_can && formValue.plot_id) {
          details = { 
            spray_date: formValue.spray_date,
            number_of_cans: formValue.number_of_cans,
            price_per_can: formValue.price_per_can,
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าคนฉีดยาฮอโมน':
        if (formValue.spray_date && formValue.number_of_cans && formValue.price_per_can && formValue.plot_id) {
          details = { 
            spray_date: formValue.spray_date,
            number_of_cans: formValue.number_of_cans,
            price_per_can: formValue.price_per_can,
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าน้ำมัน':
        if (formValue.fuel_date && formValue.price_per_liter && formValue.quantity_liters && formValue.plot_id) {
          details = { 
            fuel_date: formValue.fuel_date,
            price_per_liter: formValue.price_per_liter, 
            quantity_liters: formValue.quantity_liters, 
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าพันธุ์มัน':
        if (formValue.purchase_date && formValue.quantity && formValue.price_per_tree && formValue.plot_id && formValue.variety_name && formValue.purchase_location) {
          details = { 
            purchase_date: formValue.purchase_date,
            quantity: formValue.quantity,
            price_per_tree: formValue.price_per_tree,
            plot_id: formValue.plot_id,
            variety_name: formValue.variety_name,
            purchase_location: formValue.purchase_location,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าซ่อมอุปกรณ์':
        if (formValue.repair_date && formValue.repair_names && formValue.repair_cost && formValue.shop_name) {
          details = { 
            repair_date: formValue.repair_date,
            repair_names: formValue.repair_names,
            details: formValue.details,
            repair_cost: formValue.repair_cost, 
            shop_name: formValue.shop_name
          };
        }
        break;
      case 'ค่าอุปกรณ์':
        if (formValue.purchase_date && formValue.item_name && formValue.shop_name && formValue.purchase_price) {
          details = { 
            purchase_date: formValue.purchase_date,
            item_name: formValue.item_name,
            shop_name: formValue.shop_name,
            purchase_price: formValue.purchase_price,
            descript: formValue.descript
          };
        }
        break;
      case 'ค่าเช่าที่ดิน':
        if (formValue.rental_date && formValue.owner_name && formValue.owner_phone && formValue.area && formValue.price_per_rai && formValue.rental_period && formValue.plot_id) {
          details = { 
            rental_date: formValue.rental_date,
            owner_name: formValue.owner_name,
            owner_phone: formValue.owner_phone,
            area: formValue.area,
            price_per_rai: formValue.price_per_rai,
            rental_period: formValue.rental_period,
            plot_id: formValue.plot_id,
            totalPrice: this.calculatedTotalPrice
          };
        }
        break;
      case 'ค่าขุด':
        if (formValue.payment_date && formValue.weight && formValue.price_per_ton) {
          details = { 
            payment_date: formValue.payment_date,
            weight: formValue.weight,
            price_per_ton: formValue.price_per_ton, 
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
    const price_per_bag = this.expenseForm.get('price_per_bag')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return price_per_bag * quantity;
  }

  calculateWeedKillerCost(): number {
    const price_per_bottle = this.expenseForm.get('price_per_bottle')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return price_per_bottle * quantity;
  }

  calculateTreeCuttingCost(): number {
    const price_per_tree = this.expenseForm.get('price_per_tree')?.value || 0;
    const number_of_trees = this.expenseForm.get('number_of_trees')?.value || 0;
    return price_per_tree * number_of_trees;
  }

  calculateTreePlantingCost(): number {
    const price_per_rai = this.expenseForm.get('price_per_rai')?.value || 0;
    const land_area = this.expenseForm.get('land_area')?.value || 0;
    return price_per_rai * land_area;
  }

  calculateWeedSprayingCost(): number {
    const price_per_can = this.expenseForm.get('price_per_can')?.value || 0;
    const number_of_cans = this.expenseForm.get('number_of_cans')?.value || 0;
    return price_per_can * number_of_cans;
  }

  calculateHormoneSprayingCost(): number {
    const price_per_can = this.expenseForm.get('price_per_can')?.value || 0;
    const number_of_cans = this.expenseForm.get('number_of_cans')?.value || 0;
    return price_per_can * number_of_cans;
  }

  calculateFuelCost(): number {
    const price_per_liter = this.expenseForm.get('price_per_liter')?.value || 0;
    const quantity_liters = this.expenseForm.get('quantity_liters')?.value || 0;
    return price_per_liter * quantity_liters;
  }

  calculateSeedCost(): number {
    const price_per_tree = this.expenseForm.get('price_per_tree')?.value || 0;
    const quantity = this.expenseForm.get('quantity')?.value || 0;
    return price_per_tree * quantity;
  }

  calculateRepairCost(): number {
    return this.expenseForm.get('repairCost')?.value || 0;
  }

  calculateEquipmentCost(): number {
    return this.expenseForm.get('equipmentCost')?.value || 0;
  }

  calculateRentCost(): number {
    const price_per_rai = this.expenseForm.get('price_per_rai')?.value || 0;
    const area = this.expenseForm.get('area')?.value || 0;
    return price_per_rai * area;
  }

  calculateDiggingCost(): number {
    const price_per_ton = (this.expenseForm.get('price_per_ton')?.value || 0) / 1000;
    const weight = this.expenseForm.get('weight')?.value || 0;
    return price_per_ton * weight;
  }
}
