import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CassavaAreaServiceService } from './cassava-area-service.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // ใช้ SweetAlert2
import { MatPaginator } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core'; // ใช้ TranslateService
import { AddPlantedAreaComponent } from './add-planted-area/add-planted-area.component';
import { debounceTime } from 'rxjs/operators'; // ใช้ debounceTime
import { EditPlantedComponent } from './edit-planted/edit-planted.component';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-cassava-planted-area',
  templateUrl: './cassava-planted-area.component.html',
  styleUrls: ['./cassava-planted-area.component.css']
})
export class CassavaPlantedAreaComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['plot_name', 'area_rai', 'imageUrl', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild('addFormSection') addFormSection!: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  @ViewChild('editFormSection') editFormSection!: ElementRef;
  @ViewChild(MatSort) sort!: MatSort; 
  

  userId: string = '';
  searchForm: FormGroup;
  selectedPlotId?: number;
  showAddForm = false;
  showEditForm = false;

  hasFarm: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cassavaAreaService: CassavaAreaServiceService,
    public dialog: MatDialog,
    private router: Router,
    private translate: TranslateService, // ใช้ TranslateService
  ) {
    // สร้าง FormGroup
    this.searchForm = this.fb.group({
      keyword: [''] // ฟิลด์สำหรับคำค้นหา
    });
  }

  ngOnInit(): void {
    // ดึง userId จาก Local Storage
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.checkPlot(); // เช็คว่าผู้ใช้มีแปลงหรือไม่
    } else {
      console.error('ไม่พบข้อมูลผู้ใช้');
    }

    // ตรวจสอบการเปลี่ยนแปลงในช่องค้นหา
    this.searchForm.get('keyword')?.valueChanges
      .pipe(debounceTime(300)) // รอ 300ms หลังจากผู้ใช้หยุดพิมพ์
      .subscribe((keyword: string) => {
        this.applyFilter(keyword); // ใช้ฟังก์ชันกรองข้อมูล
      });
  }
  checkPlot() {
    this.cassavaAreaService.checkFarmExists(this.userId).subscribe(
      response => {
        this.hasFarm = response.hasFarm; // ✅ อัปเดตค่า hasFarm
        if (this.hasFarm) {
          this.loadPlots(); // ✅ ถ้ามีแปลง → โหลดข้อมูลแปลง
        } else {
          Swal.fire({
            title: 'ไม่มีแปลงมันสำปะหลัง',
            text: 'กรุณาเพิ่มแปลงก่อนใช้งาน',
            icon: 'warning',
            confirmButtonText: 'เพิ่มแปลง'
          }).then(() => {
            this.navigateToAddPlot(); // ✅ ไปเพิ่มแปลง
          });
        }
      },
      error => {
        console.error('เกิดข้อผิดพลาดขณะตรวจสอบแปลง:', error);
      }
    );
}

  navigateToAddPlot() {
    if (this.router.url === '/cassavaPlantedArea') {
      this.openAdd(); // ✅ ถ้าอยู่ในหน้าแปลง → เปิดฟอร์มเพิ่มแปลง
    } else {
      this.router.navigate(['/cassavaPlantedArea']); // ✅ ถ้าอยู่นอกหน้า → เปลี่ยนหน้าไปยังหน้าแปลง
    }
  }




  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;  // ✅ เพิ่ม Sort
    }
  }

  // ฟังก์ชันลบข้อมูล
  deleted(plotId: string) {
    Swal.fire({
      title: this.translate.instant('ยืนยันการลบแปลง'),
      text: this.translate.instant('คุณแน่ใจหรือไม่ว่าต้องการลบแปลงนี้?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ใช่, ลบเลย'),
      cancelButtonText: this.translate.instant('ยกเลิก')
    }).then((result) => {
      if (result.isConfirmed) {
        this.cassavaAreaService.deletePlot(plotId).subscribe(
          response => {
            Swal.fire(
              this.translate.instant('ลบสำเร็จ'),
              this.translate.instant('แปลงนี้ถูกลบเรียบร้อยแล้ว'),
              'success'
            );
            this.loadPlots(); // โหลดข้อมูลใหม่หลังอัปเดต
          },
          error => {
            Swal.fire(
              this.translate.instant('เกิดข้อผิดพลาด'),
              this.translate.instant('ไม่สามารถลบแปลงนี้ได้ กรุณาลองใหม่อีกครั้ง'),
              'error'
            );
            console.error('เกิดข้อผิดพลาดขณะลบแปลง:', error);
          }
        );
      }
    });
  }


  // ฟังก์ชันโหลดข้อมูล
  loadPlots() {
    debugger
    this.cassavaAreaService.getCassavaArea(this.userId).subscribe((res: any) => {
      this.dataSource.data = res.map((item: any) => ({
        ...item,
        area_rai: Math.round(item.area_rai)
      }));
      // ตั้งค่าตัวแบ่งหน้า
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, error => {
      console.error(this.translate.instant('plot.loadDataError'), error);
    });
  }

  // ฟังก์ชันเปิดฟอร์มเพิ่มข้อมูล
  openAdd(): void {
    this.showAddForm = true; // เปิดฟอร์มเพิ่มข้อมูล
    this.showEditForm = false; // ปิดฟอร์มแก้ไข (ถ้ามี)

    setTimeout(() => {
        const element = document.getElementById('addFormSection'); // ใช้ `id` ของฟอร์ม
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.warn("⚠️ ไม่พบ element addFormSection (อาจยังโหลดไม่เสร็จ)");
        }
    }, 100); // ✅ รอให้ Angular อัปเดต DOM ก่อน
}



  // ฟังก์ชันกรองข้อมูล
  applyFilter(keyword: string) {
    this.dataSource.filter = keyword.trim().toLowerCase(); // กรองข้อมูลในตาราง
  }

  closeForm() {
    this.showAddForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ
    this.showEditForm = false; // ปิดฟอร์มเมื่อบันทึกสำเร็จ

    this.loadPlots(); // โหลดข้อมูลใหม่หลังอัปเดต
  }


  edit(plotId: number): void {
    if (plotId) {
      this.selectedPlotId = plotId;
      this.showEditForm = true;
      this.showAddForm = false;

      setTimeout(() => {
        if (this.editFormSection?.nativeElement) {
          this.editFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.warn("⚠️ ไม่พบ element editFormSection");
        }
      }, 100);
    }
  }


  viewDetails() { }

}
