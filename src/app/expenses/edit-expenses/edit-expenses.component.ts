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
    private dialogRef: MatDialogRef<EditExpensesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // ✅ รับข้อมูลจาก Dialog
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
      total_price : [''],
      expenses_date: [''],

    });

  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.fetchPlots();
    if (this.data) {
      this.expenseId = this.data.id; // รับค่า id ของรายการที่ต้องการแก้ไข
      this.loadExpenseData(this.expenseId); // โหลดข้อมูลค่าใช้จ่าย
  
      this.expenseForm.patchValue({ category: this.data.category });
      this.selectedCategory = this.data.category;
      this.updateFormFields(this.data.category);
    }
    // ✅ ตรวจจับการเปลี่ยนแปลงค่าในฟอร์มและคำนวณราคารวมใหม่
    this.expenseForm.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  
    // เมื่อเปลี่ยนประเภทค่าใช้จ่าย ฟอร์มจะอัปเดตอัตโนมัติ
    this.expenseForm.get('category')?.valueChanges.subscribe(value => {
      this.selectedCategory = value;
      this.updateFormFields(value);
    });
  }
  
  loadExpenseData(expenseId: string) {
    this.transactionService.getExpenseById(expenseId).subscribe((expenseData) => {
      if (expenseData) {
        console.log('✅ ข้อมูลค่าใช้จ่าย:', expenseData);
        const formattedData = {
          category: expenseData.category ?? '',
          expenses_date: expenseData.expenses_date
            ? expenseData.expenses_date.split('T')[0]
            : '',
          plot_id: expenseData.plot_id ?? '',
          total_price: parseFloat(expenseData.total_price) || 0,

          // ✅ ค่าน้ำมัน
          ...(expenseData.category === 'ค่าน้ำมัน' && {
            price_per_liter: parseFloat(expenseData.price_per_liter) || 0,
            quantity_liters: parseFloat(expenseData.quantity_liters) || 0,
          }),

          // ✅ ค่าคนตัดต้น
          ...(expenseData.category === 'ค่าคนตัดต้น' && {
            number_of_trees: parseFloat(expenseData.number_of_trees) || 0,
            price_per_tree: parseFloat(expenseData.price_per_tree) || 0,
          }),

          // ✅ ค่าพันธุ์มัน
          ...(expenseData.category === 'ค่าพันธุ์มัน' && {
            variety_name: expenseData.variety_name ?? '',
            price_per_tree: parseFloat(expenseData.price_per_tree) || 0,
            purchase_location: expenseData.purchase_location ?? '',
            quantity: parseFloat(expenseData.quantity) || 0,
          }),

          // ✅ ค่าอุปกรณ์
        ...(expenseData.category === 'ค่าอุปกรณ์' && {
          item_name: expenseData.item_name ?? '',
          shop_name: expenseData.shop_name ?? '',
          purchase_price: parseFloat(expenseData.purchase_price) || 0,
          descript: expenseData.descript ?? '',
        }),

          // ✅ ค่าปุ๋ย
          ...(expenseData.category === 'ค่าปุ๋ย' && {
            brand: expenseData.brand ?? '',
            formula: expenseData.formula ?? '',
            price_per_bag: parseFloat(expenseData.price_per_bag) || 0,
            quantity: parseFloat(expenseData.quantity) || 0,
            purchase_location: expenseData.purchase_location ?? '',
          }),

          // ✅ ค่าฮอร์โมน
          ...(expenseData.category === 'ค่าฮอร์โมน' && {
            brand: expenseData.brand ?? '',
            volume: parseFloat(expenseData.volume) || 0,
            price_per_bottle: parseFloat(expenseData.price_per_bottle) || 0,
            quantity: parseFloat(expenseData.quantity) || 0,
            purchase_location: expenseData.purchase_location ?? '',
          }),

          // ✅ ค่ายาฆ่าหญ้า
          ...(expenseData.category === 'ค่ายาฆ่าหญ้า' && {
            brand: expenseData.brand ?? '',
            volume: parseFloat(expenseData.volume) || 0,
            price_per_bottle: parseFloat(expenseData.price_per_bottle) || 0,
            quantity: parseFloat(expenseData.quantity) || 0,
            purchase_location: expenseData.purchase_location ?? '',
          }),

          // ✅ ค่าเช่าที่ดิน
          ...(expenseData.category === 'ค่าเช่าที่ดิน' && {
            owner_name: expenseData.owner_name ?? '',
            owner_phone: expenseData.owner_phone ?? '',
            area: parseFloat(expenseData.area) || 0,
            price_per_rai: parseFloat(expenseData.price_per_rai) || 0,
            rental_period: parseFloat(expenseData.rental_period) || 0,
          }),

          // ✅ ค่าขุด
          ...(expenseData.category === 'ค่าขุด' && {
            weight: parseFloat(expenseData.weight) || 0,
            price_per_ton: parseFloat(expenseData.price_per_ton) || 0,
          }),

          ...(expenseData.category === 'ค่าคนปลูก' &&{
            worker_name: expenseData.worker_name ?? '',
            land_area: parseFloat(expenseData.land_area) || 0,
            price_per_rai: parseFloat(expenseData.price_per_rai) || 0,
          }),
          ...(expenseData.category === 'ค่าคนฉีดยาฆ่าหญ้า' &&{
            number_of_cans: parseFloat(expenseData.number_of_cans) || 0,
            price_per_can: parseFloat(expenseData.price_per_can) || 0,
          }),
          ...(expenseData.category === 'ค่าคนฉีดยาฮอโมน' &&{
            number_of_cans: parseFloat(expenseData.number_of_cans) || 0,
            price_per_can: parseFloat(expenseData.price_per_can) || 0,
          }),
          ...(expenseData.category === 'ค่าซ่อมอุปกรณ์' &&{
            repair_date: expenseData.repair_date ?? '',
            repair_names: expenseData.repair_names ?? '',
            details: expenseData.details ?? '',
            repair_cost: parseFloat(expenseData.repair_cost) || 0,
            shop_name: expenseData.shop_name ?? '',
          })
        };

        // เติมค่าลงในฟอร์ม
        this.expenseForm.patchValue(formattedData);

        // ตั้งค่าหมวดหมู่ที่เลือก และอัปเดตฟอร์มตามหมวดหมู่
        this.selectedCategory = expenseData.category ?? '';
        this.updateFormFields(this.selectedCategory ?? '');
        this.calculateTotalPrice();
      }
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
  onSubmit() {
    if (this.expenseForm.valid) {
      const expenseData = this.expenseForm.value;
  
      // ตรวจสอบว่ากำลังแก้ไขหรือเพิ่มใหม่
      if (this.expenseId) {
        // แก้ไขค่าใช้จ่ายที่มีอยู่
        this.transactionService.updateExpense(this.expenseId, expenseData).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            text: 'แก้ไขค่าใช้จ่ายเรียบร้อยแล้ว!'
          });
          this.dialogRef.close(true); // ปิด Dialog และรีโหลดข้อมูล
        });
      } else {
        // เพิ่มค่าใช้จ่ายใหม่
        this.transactionService.addExpense(expenseData).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'เพิ่มข้อมูลสำเร็จ',
            text: 'เพิ่มรายการค่าใช้จ่ายเรียบร้อยแล้ว!'
          });
          this.dialogRef.close(true); // ปิด Dialog และรีโหลดข้อมูล
        });
      }
    } else {
      // แจ้งเตือนหากฟอร์มไม่ถูกต้อง
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        text: 'โปรดตรวจสอบและกรอกข้อมูลให้ถูกต้อง'
      });
    }
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
  
    // ✅ อัปเดตราคารวมในฟอร์มทุกครั้งที่มีการเปลี่ยนแปลงค่า
    this.expenseForm.patchValue({ total_price: totalPrice }, { emitEvent: false });
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