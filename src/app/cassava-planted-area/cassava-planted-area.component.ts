import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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

@Component({
  selector: 'app-cassava-planted-area',
  templateUrl: './cassava-planted-area.component.html',
  styleUrls: ['./cassava-planted-area.component.css']
})
export class CassavaPlantedAreaComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['plot_name', 'area_rai', 'imageUrl', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  userId: string = '';
  searchForm: FormGroup;

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
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadPlots();
    } else {
      console.error(this.translate.instant('plot.noUserIdError'));
    }

    // ใช้ valueChanges เพื่อตรวจสอบการเปลี่ยนแปลงในช่องค้นหา
    this.searchForm.get('keyword')?.valueChanges
      .pipe(debounceTime(300)) // รอ 300ms หลังจากผู้ใช้หยุดพิมพ์
      .subscribe((keyword: string) => {
        this.applyFilter(keyword); // ใช้ฟังก์ชันกรองข้อมูล
      });
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // ฟังก์ชันลบข้อมูล
  deleted(plotId: string) {
    Swal.fire({
      title: this.translate.instant('plot.confirmDeleteTitle'),
      text: this.translate.instant('plot.confirmDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('plot.confirmButtonText'),
      cancelButtonText: this.translate.instant('plot.cancelButtonText')
    }).then((result) => {
      if (result.isConfirmed) {
        this.cassavaAreaService.deletePlot(plotId).subscribe(
          response => {
            Swal.fire(
              this.translate.instant('plot.deleteSuccessTitle'),
              this.translate.instant('plot.deleteSuccessText'),
              'success'
            );
            this.loadPlots(); // โหลดข้อมูลใหม่หลังลบสำเร็จ
          },
          error => {
            Swal.fire(
              this.translate.instant('plot.deleteErrorTitle'),
              this.translate.instant('plot.deleteErrorText'),
              'error'
            );
            console.error('Error deleting plot:', error);
          }
        );
      }
    });
  }

  // ฟังก์ชันโหลดข้อมูล
  loadPlots() {
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
  openAdd() {
    const dialogRef = this.dialog.open(AddPlantedAreaComponent, {
      width: '90%',   // กำหนดความกว้างให้เต็มหน้าจอ
      height: '90%',  // กำหนดความสูงให้เต็มหน้าจอ
      maxWidth: '100vw', // ความกว้างสูงสุดเป็น 100% ของหน้าจอ
      maxHeight: '100vh' // ความสูงสูงสุดเป็น 100% ของหน้าจอ
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPlots(); // โหลดข้อมูลใหม่หลังจากเพิ่ม/แก้ไข
      }
    });
  }

  // ฟังก์ชันกรองข้อมูล
  applyFilter(keyword: string) {
    this.dataSource.filter = keyword.trim().toLowerCase(); // กรองข้อมูลในตาราง
  }



  edit(plotId: string) {
    const dialogRef = this.dialog.open(EditPlantedComponent, {
      width: '90%',   // กำหนดความกว้างให้เต็มหน้าจอ
      height: '90%',  // กำหนดความสูงให้เต็มหน้าจอ
      maxWidth: '100vw', // ความกว้างสูงสุดเป็น 100% ของหน้าจอ
      maxHeight: '100vh', // ความสูงสูงสุดเป็น 100% ของหน้าจอ
      data: { plot_id: plotId } // ส่ง plot_id เข้าไปใน Dialog
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPlots(); // โหลดข้อมูลใหม่หลังจากเพิ่ม/แก้ไข
      }
    });
  }
  

  viewDetails(){}

}
