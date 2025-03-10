import { Component, OnInit, Inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
export class EditExpensesComponent implements OnInit, OnChanges {

  @Input() expenseId!: number;  // ✅ รับค่า expenseId
  @Input() category!: string;  // ✅ รับค่า category
  @Output() closeForm = new EventEmitter<void>(); // ✅ ส่ง event ปิดฟอร์มกลับไป

  expenseForm: FormGroup;
  plots: any[] = [];
  userId: string = '';
  categories = [
    { value: 'ค่าฮอร์โมน', label: 'ค่าฮอร์โมน' },
    { value: 'ค่าปุ๋ย', label: 'ค่าปุ๋ย' },
    { value: 'ค่ายาฆ่าหญ้า', label: 'ค่ายาฆ่าหญ้า' },
    { value: 'ค่าคนตัดต้น', label: 'ค่าคนตัดต้น' },
    { value: 'ค่าคนปลูก', label: 'ค่าคนปลูก' },
    { value: 'ค่าคนฉีดยาฆ่าหญ้า', label: 'ค่าคนฉีดยาฆ่าหญ้า' },
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

  ) {
    this.expenseForm = this.fb.group({
      area: [''],
      brand: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      bundleCount: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      category: ['', Validators.required],  // ต้องการตรวจสอบการกรอกข้อมูล
      cutting_date: [''],
      details: [''],
      descript: [''],
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
      item_name: [''],
      total_price: [''],
      expenses_date: [''],

    });

  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || ''; // ✅ โหลด userId ครั้งเดียว
    this.fetchPlots(); // ✅ โหลดรายการ plots

    if (this.expenseId) {
      this.loadExpenseData(); // ✅ โหลดข้อมูลค่าใช้จ่ายจาก expenseId
    }

    // ✅ ตรวจจับการเปลี่ยนแปลงค่าในฟอร์มและคำนวณราคารวมใหม่
    this.expenseForm.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
  });

    // ✅ อัปเดตฟิลด์ตามประเภทค่าใช้จ่ายเมื่อ category เปลี่ยนแปลง
    this.expenseForm.get('category')?.valueChanges.subscribe(value => {
      this.selectedCategory = value;
      this.updateFormFields(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expenseId'] && changes['expenseId'].currentValue) {
      this.loadExpenseData();
    }
    if (changes['category'] && changes['category'].currentValue) {
      this.selectedCategory = this.category;
    }
  }

  loadExpenseData(): void {
    if (!this.expenseId) return; // ✅ ป้องกันการโหลดถ้า `expenseId` ไม่มีค่า

    this.transactionService.getExpenseById(this.expenseId).subscribe((expenseData) => {
      if (!expenseData) return;

      const formattedData: any = {
        category: expenseData.category ?? '',
        expenses_date: expenseData.expenses_date ? expenseData.expenses_date.split('T')[0] : '',
        plot_id: expenseData.plot_id ?? '',
        total_price: parseFloat(expenseData.total_price) || 0,
      };

      // ✅ ใช้ `switch-case` แทนการเช็คเงื่อนไขหลายๆ ครั้ง
      switch (expenseData.category) {
        case 'ค่าน้ำมัน':
          formattedData.price_per_liter = parseFloat(expenseData.price_per_liter) || 0;
          formattedData.quantity_liters = parseFloat(expenseData.quantity_liters) || 0;
          break;

        case 'ค่าคนตัดต้น':
          formattedData.number_of_trees = parseFloat(expenseData.number_of_trees) || 0;
          formattedData.price_per_tree = parseFloat(expenseData.price_per_tree) || 0;
          break;

        case 'ค่าพันธุ์มัน':
          formattedData.variety_name = expenseData.variety_name ?? '';
          formattedData.price_per_tree = parseFloat(expenseData.price_per_tree) || 0;
          formattedData.purchase_location = expenseData.purchase_location ?? '';
          formattedData.quantity = parseFloat(expenseData.quantity) || 0;
          break;

        case 'ค่าอุปกรณ์':
          formattedData.item_name = expenseData.item_name ?? '';
          formattedData.shop_name = expenseData.shop_name ?? '';
          formattedData.purchase_price = parseFloat(expenseData.purchase_price) || 0;
          formattedData.descript = expenseData.descript ?? '';
          break;

        case 'ค่าปุ๋ย':
          formattedData.brand = expenseData.brand ?? '';
          formattedData.formula = expenseData.formula ?? '';
          formattedData.price_per_bag = parseFloat(expenseData.price_per_bag) || 0;
          formattedData.quantity = parseFloat(expenseData.quantity) || 0;
          formattedData.purchase_location = expenseData.purchase_location ?? '';
          break;

        case 'ค่าฮอร์โมน':
        case 'ค่ายาฆ่าหญ้า':
          formattedData.brand = expenseData.brand ?? '';
          formattedData.volume = parseFloat(expenseData.volume) || 0;
          formattedData.price_per_bottle = parseFloat(expenseData.price_per_bottle) || 0;
          formattedData.quantity = parseFloat(expenseData.quantity) || 0;
          formattedData.purchase_location = expenseData.purchase_location ?? '';
          break;

        case 'ค่าเช่าที่ดิน':
          formattedData.owner_name = expenseData.owner_name ?? '';
          formattedData.owner_phone = expenseData.owner_phone ?? '';
          formattedData.area = parseFloat(expenseData.area) || 0;
          formattedData.price_per_rai = parseFloat(expenseData.price_per_rai) || 0;
          formattedData.rental_period = parseFloat(expenseData.rental_period) || 0;
          break;

        case 'ค่าขุด':
          formattedData.weight = parseFloat(expenseData.weight) || 0;
          formattedData.price_per_ton = parseFloat(expenseData.price_per_ton) || 0;
          break;

        case 'ค่าคนปลูก':
          formattedData.worker_name = expenseData.worker_name ?? '';
          formattedData.land_area = parseFloat(expenseData.land_area) || 0;
          formattedData.price_per_rai = parseFloat(expenseData.price_per_rai) || 0;
          break;

        case 'ค่าคนฉีดยาฆ่าหญ้า':
        case 'ค่าคนฉีดยาฮอโมน':
          formattedData.number_of_cans = parseFloat(expenseData.number_of_cans) || 0;
          formattedData.price_per_can = parseFloat(expenseData.price_per_can) || 0;
          break;

        case 'ค่าซ่อมอุปกรณ์':
          formattedData.repair_date = expenseData.repair_date ?? '';
          formattedData.repair_names = expenseData.repair_names ?? '';
          formattedData.details = expenseData.details ?? '';
          formattedData.repair_cost = parseFloat(expenseData.repair_cost) || 0;
          formattedData.shop_name = expenseData.shop_name ?? '';
          break;
      }

      // ✅ เติมค่าลงในฟอร์ม
      this.expenseForm.patchValue(formattedData);

      // ✅ ตั้งค่าหมวดหมู่ที่เลือก และอัปเดตฟอร์มตามหมวดหมู่
      this.selectedCategory = expenseData.category ?? '';
      this.updateFormFields(this.selectedCategory ?? '');
      this.calculateTotalPrice();
    });
  }




  updateFormFields(category: string) {
    if (!category) {
      console.warn('⚠️ category เป็นค่า null หรือ undefined:', category);
      return;
    }

    console.log('✅ updateFormFields เรียกใช้ด้วย category:', category);

    // **ปิด `emitEvent` ป้องกัน loop**
    this.expenseForm.patchValue({ category }, { emitEvent: false });

    const fieldValues: { [key: string]: any } = {
      'ค่าฮอร์โมน': { brand: '', volume: '', price_per_bottle: '', quantity: '', total_price: '', purchase_location: '', plot_id: '' },
      'ค่าปุ๋ย': { brand: '', formula: '', price_per_bag: '', quantity: '', total_price: '', purchase_location: '', plot_id: '' },
      'ค่ายาฆ่าหญ้า': { brand: '', volume: '', price_per_bottle: '', quantity: '', total_price: '', purchase_location: '', plot_id: '' },
      'ค่าคนตัดต้น': { number_of_trees: '', cutting_price_per_tree: '', total_price: '', plot_id: '' },
      'ค่าคนปลูก': { worker_name: '', land_area: '', price_per_rai: '', total_price: '', plot_id: '' },
      'ค่าคนฉีดยาฆ่าหญ้า': { spray_date: '', number_of_cans: '', price_per_can: '', total_price: '', plot_id: '' },
      'ค่าคนฉีดยาฮอโมน': { spray_date: '', number_of_cans: '', price_per_can: '', total_price: '', plot_id: '' },
      'ค่าน้ำมัน': { fuel_date: '', price_per_liter: '', quantity_liters: '', total_price: '', plot_id: '' },
      'ค่าพันธุ์มัน': { purchase_date: '', quantity: '', cassava_price_per_tree: '', total_price: '', variety_name: '', purchase_location: '', plot_id: '' },
      'ค่าซ่อมอุปกรณ์': { repair_date: '', repair_names: '', details: '', repair_cost: '', shop_name: '', total_price: '' },
      'ค่าอุปกรณ์': { purchase_date: '', item_name: '', shop_name: '', purchase_price: '', descript: '', total_price: '' },
      'ค่าเช่าที่ดิน': { rental_date: '', owner_name: '', owner_phone: '', area: '', price_per_rai: '', rental_period: '', total_price: '', plot_id: '' },
      'ค่าขุด': { payment_date: '', weight: '', price_per_ton: '', total_price: '' }
    };

    if (!fieldValues[category]) {
      console.error('❌ ไม่พบ category นี้ใน fieldValues:', category);
      return;
    }

    console.log('✅ ใช้ค่า fieldValues:', fieldValues[category]);

    // **รวมค่าจาก `expenseData` เพื่อไม่ให้ค่าหาย**
    const updatedFields = Object.assign({}, fieldValues[category], this.expenseForm.value);

    // **ใช้ `setTimeout()` เพื่อให้ UI อัปเดตก่อน**
    setTimeout(() => {
      this.expenseForm.patchValue(updatedFields, { emitEvent: false });
    }, 0);
  }
  onSubmit(): void {
    const category = this.expenseForm.get('category')?.value || '';
    const expenseData = this.expenseForm.value; // ข้อมูลทั้งหมดจากฟอร์ม
    const expenseId = this.expenseId; // ✅ ใช้ `this.expenseId` อย่างเดียว

    if (!expenseId) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่พบข้อมูลค่าใช้จ่าย (expense_id)',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const categoryFields: { [key: string]: string[] } = {
      'ค่าฮอร์โมน': ['brand', 'volume', 'price_per_bottle', 'quantity', 'purchase_location', 'plot_id'],
      'ค่าปุ๋ย': ['brand', 'formula', 'price_per_bag', 'quantity', 'purchase_location', 'plot_id'],
      'ค่ายาฆ่าหญ้า': ['brand', 'volume', 'price_per_bottle', 'quantity', 'purchase_location', 'plot_id'],
      'ค่าคนตัดต้น': ['number_of_trees', 'price_per_tree', 'plot_id'],
      'ค่าคนปลูก': [ 'land_area', 'price_per_rai', 'plot_id'],
      'ค่าคนฉีดยาฆ่าหญ้า': ['number_of_cans', 'price_per_can', 'plot_id'],
      'ค่าคนฉีดยาฮอโมน': ['number_of_cans', 'price_per_can', 'plot_id'],
      'ค่าน้ำมัน': ['price_per_liter', 'quantity_liters', 'plot_id'],
      'ค่าพันธุ์มัน': ['variety_name', 'quantity', 'price_per_tree', 'purchase_location', 'plot_id'],
      'ค่าซ่อมอุปกรณ์': ['repair_names', 'details', 'repair_cost', 'shop_name'],
      'ค่าอุปกรณ์': ['item_name', 'shop_name', 'purchase_price', 'descript'],
      'ค่าเช่าที่ดิน': ['owner_name', 'owner_phone', 'area', 'price_per_rai', 'rental_period', 'plot_id'],
      'ค่าขุด': ['weight', 'price_per_ton', 'plot_id']
    };

    if (!categoryFields[category]) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถตรวจสอบข้อมูลประเภทนี้ได้!',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // ✅ ใช้ `some()` เพื่อตรวจสอบว่ามีฟิลด์ไหนว่างไหม (เร็วขึ้น)
    const isMissingFields = categoryFields[category].some(field => !expenseData[field]);

    if (isMissingFields) {
      const missingFields = categoryFields[category].filter(field => !expenseData[field]);
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        text: `กรุณากรอกข้อมูล: ${missingFields.join(', ')}`,
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const updatedExpenseData = { ...expenseData, expense_id: expenseId };

    console.log(" ส่งข้อมูลไปอัปเดต:", updatedExpenseData);
    this.transactionService.updateExpense(updatedExpenseData).subscribe(
      () => {
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตข้อมูลเรียบร้อย',
          text: 'ข้อมูลค่าใช้จ่ายได้รับการอัปเดตแล้ว!',
          confirmButtonText: 'ตกลง'
        }).then(() => {
          this.closeForm.emit(); // ✅ ใช้ EventEmitter แทน `dialogRef.close()`
        });
      },
      (error) => {
        console.error("❌ เกิดข้อผิดพลาดในการอัปเดตค่าใช้จ่าย:", error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองอีกครั้ง!',
          confirmButtonText: 'ตกลง'
        });
      }
    );
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

  onFormulaInput(event: any): void {
    const inputValue = event.target.value;
    const formattedValue = inputValue
      .replace(/[^0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/(\d{2})(?=\d)/g, '$1-');
    this.expenseForm.get('formula')?.setValue(formattedValue, { emitEvent: false });
  }
  calculateTotalPrice(): void {
    const category = this.expenseForm.get('category')?.value || '';
    let totalPrice = 0;

    switch (category) {
        case 'ค่าฮอร์โมน':
            totalPrice = this.calculateHormoneCost();
            break;
        case 'ค่าปุ๋ย':
            totalPrice = this.calculateFertilizerCost();
            break;
        case 'ค่ายาฆ่าหญ้า':
            totalPrice = this.calculateWeedKillerCost();
            break;
        case 'ค่าคนตัดต้น':
            totalPrice = this.calculateTreeCuttingCost();
            break;
        case 'ค่าคนปลูก':
            totalPrice = this.calculateTreePlantingCost();
            break;
        case 'ค่าคนฉีดยาฆ่าหญ้า':
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

    // ✅ อัปเดตค่า total_price ในฟอร์มให้แสดงผลใน UI
    this.expenseForm.patchValue({ total_price: totalPrice }, { emitEvent: false });

    // ✅ เก็บค่าไว้ในตัวแปรเพื่อนำไปแสดงผล
    this.calculatedTotalPrice = totalPrice;
    console.log('📢 คำนวณราคาใหม่:', totalPrice);
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