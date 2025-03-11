import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HarvestsService } from './harvests.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-harvests',
  templateUrl: './harvests.component.html',
  styleUrls: ['./harvests.component.css']
})
export class HarvestsComponent implements OnInit, AfterViewInit {

  @ViewChild('addFormSection') addFormSection!: ElementRef; // ✅ ดึงตำแหน่งของฟอร์มแก้ไข
  @ViewChild('editFormSection') editFormSection!: ElementRef; // ✅ ดึงตำแหน่งของฟอร์มแก้ไข
  displayedColumns: string[] = [
    'harvest_date',
    'plot_name',
    'company_name',
    'net_weight_kg',
    'starch_percentage',
    'amount',
    'actions'
  ];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';
  searchForm: FormGroup;
  plots: any[] = [];
  showModal: boolean = false;
  imageUrl: string = '';
  showAddForm = false;
  showEditForm = false;
  selectedHarvestId: number | null = null; //
  plotForm!: FormGroup; // ประกาศ plotForm ให้ Angular รู้จัก
  filteredData: any[] = [];  // ข้อมูลที่ผ่านการกรอง
  originalData: any[] = [];  // ข้อมูลต้นฉบับ
  selectedPlotIdForAddForm: number | null = null; // ✅ แปลงที่เลือกสำหรับฟอร์มเพิ่มข้อมูล


  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private harvestsService: HarvestsService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.searchForm = this.fb.group({
      plot: [''],
      company_name: [''],
      net_weight_kg: [''],
      starch_percentage: [''],
      price: [''],
      harvest_date_start: [''], // ฟิลด์วันที่เริ่มต้น
      harvest_date_end: ['']
    });
  }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadHarvests();
      this.loadSearchPlots();

      this.searchForm.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.onSearch();
      });
    }

    // ✅ ใช้ FormControl เพื่อเก็บค่าเดียว
    this.plotForm = this.fb.group({
      selectedPlot: [null] // ✅ เลือกแค่ 1 แปลงเท่านั้น
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // โหลดรายการแปลงสำหรับการค้นหา
  loadSearchPlots() {
    this.harvestsService.getSerchPlot(this.userId).subscribe((res: any) => {
      this.plots = res;
    });
  }

  // โหลดข้อมูลการเก็บเกี่ยว
  loadHarvests(filters: any = {}) {
    debugger
    this.harvestsService.getHarvests(this.userId, filters).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }

  // เรียกเมื่อมีการค้นหา
  onSearch() {
    debugger
    const filters = this.prepareFilters(this.searchForm.value);
  
    // ✅ กรองข้อมูลตามแปลงที่เลือก
    const selectedPlotId = this.plotForm.get('selectedPlot')?.value;
    filters.plot_id = selectedPlotId ? selectedPlotId : null;
  
    this.loadHarvests(filters);
  }
  

  // รีเซ็ตฟอร์มการค้นหา
  clearSearch() {
    this.searchForm.reset();
    this.loadHarvests();
  }

  // แปลงค่าจากฟอร์มให้เหมาะสมกับ API
  private prepareFilters(formValues: any): any {
    const filters: any = {};
    if (formValues.plot) filters.plot_id = formValues.plot;
    if (formValues.company_name) filters.company_name = formValues.company_name;
    if (formValues.harvest_date_start || formValues.harvest_date_end) {
      filters.harvest_date_start = formValues.harvest_date_start || null;
      filters.harvest_date_end = formValues.harvest_date_end || null;
    }
    if (formValues.net_weight_kg) {
      const [min, max] = formValues.net_weight_kg.split('-').map(Number);
      filters.net_weight_min = min;
      filters.net_weight_max = max;
    }
    if (formValues.starch_percentage) {
      const [min, max] = formValues.starch_percentage.split('-').map(Number);
      filters.starch_percentage_min = min;
      filters.starch_percentage_max = max;
    }
    if (formValues.price) {
      const [min, max] = formValues.price.split('-').map(Number);
      filters.price_min = min;
      filters.price_max = max;
    }
    return filters;
  }

  // ลบข้อมูลการเก็บเกี่ยว
  DeleteHarvest(harvestId: number): void {
    if (!harvestId) {
      Swal.fire({
        title: this.translate.instant('harvest.error'),
        text: this.translate.instant('harvest.noData'),
        icon: 'error'
      });
      return;
    }

    Swal.fire({
      title: this.translate.instant('harvest.confirmDeleteTitle'),
      text: this.translate.instant('harvest.confirmDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.translate.instant('harvest.confirm'),
      cancelButtonText: this.translate.instant('harvest.cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        this.harvestsService.deleteHarvest(harvestId).subscribe(
          () => {
            Swal.fire(
              this.translate.instant('harvest.deleteSuccessTitle'),
              this.translate.instant('harvest.deleteSuccessText'),
              'success'
            ).then(() => {
              this.loadHarvests();
            });
          },
          () => {
            Swal.fire(
              this.translate.instant('harvest.deleteErrorTitle'),
              this.translate.instant('harvest.deleteErrorText'),
              'error'
            );
          }
        );
      }
    });
  }

  openAdd() {
    const selectedPlotId = this.plotForm.get('selectedPlot')?.value || null; // ✅ ดึงค่า plot_id ถ้ามี

    console.log("📍 plot_id ที่จะส่งไปยังฟอร์มเพิ่มข้อมูล:", selectedPlotId);
    
    this.selectedPlotIdForAddForm = selectedPlotId; // ✅ เก็บ plot_id ไว้ใช้งานใน HTML
    this.showAddForm = !this.showAddForm; // สลับสถานะเปิด/ปิดฟอร์ม
    this.showEditForm = false; // ปิดฟอร์มแก้ไข

    setTimeout(() => {
      if (this.addFormSection) {
        this.addFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn("⚠️ ไม่พบ element addFormSection");
      }
    }, 100);
}

  
  closeForm() {
    this.showAddForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ
    this.showEditForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ

    this.loadHarvests(); // โหลดข้อมูลใหม่หลังจากบันทึก
  }

  // แก้ไขข้อมูลการเก็บเกี่ยว
  EditHarvest(harvestId: number): void {
    if (!harvestId) {
      console.error("❌ harvestId เป็นค่าว่าง");
      return;
    }

    // ✅ ปิดฟอร์มเพิ่มข้อมูล
    this.showAddForm = false;

    // ✅ ถ้าเลือกอันใหม่ ให้เปลี่ยนค่าแล้วโหลดข้อมูลใหม่
    if (this.selectedHarvestId !== harvestId) {
      this.selectedHarvestId = harvestId;
      this.showEditForm = false; // ปิดฟอร์มก่อน แล้วเปิดใหม่
      setTimeout(() => {
        this.showEditForm = true;
      }, 10); // ✅ ให้ Angular อัปเดต UI ก่อน

      console.log("✅ เปลี่ยนข้อมูลฟอร์มแก้ไขไปที่ harvestId:", this.selectedHarvestId);
    }

    // ✅ เลื่อนหน้าไปยังฟอร์มแก้ไข
    setTimeout(() => {
      if (this.editFormSection) {
        this.editFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn("⚠️ ไม่พบ element editFormSection");
      }
    }, 100);
  }




  // ดูรายละเอียดรูปภาพ
  viewDetails(harvestId: number): void {
    this.harvestsService.getHarvestImage(harvestId).subscribe(
      (res: any) => {
        if (res.imageUrl) {
          this.imageUrl = res.imageUrl;
          this.showModal = true;
        } else {
          Swal.fire({
            title: this.translate.instant('harvest.error'),
            text: this.translate.instant('harvest.noImageFound'),
            icon: 'error'
          });
        }
      },
      () => {
        Swal.fire({
          title: this.translate.instant('harvest.error'),
          text: this.translate.instant('harvest.fetchError'),
          icon: 'error'
        });
      }
    );
  }

  // ปิด Modal
  closeModal() {
    this.showModal = false;
    this.imageUrl = '';
  }


  togglePlot(plotId: number): void {
    if (!this.plotForm) return;
  
    const currentPlot = this.plotForm.get('selectedPlot')?.value;
  
    // ✅ ถ้ากดแปลงเดิม ให้เซ็ตเป็น null (ล้างค่า)
    this.plotForm.get('selectedPlot')?.setValue(currentPlot === plotId ? null : plotId);
  
    // ✅ โหลดข้อมูลใหม่จาก API ตามแปลงที่เลือก
    this.onSearch();
  }
  



  isSelected(plotId: number): boolean {
    return this.plotForm.get('selectedPlot')?.value === plotId;
  }
  


}
