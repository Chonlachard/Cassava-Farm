import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CassavaAreaServiceService } from './cassava-area-service.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Import SweetAlert2
import { MatPaginator } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService
import { AddPlantedAreaComponent } from './add-planted-area/add-planted-area.component';

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

  constructor(
    private fb: FormBuilder,
    private cassavaAreaService: CassavaAreaServiceService,
    public dialog: MatDialog,
    private router: Router,
    private translate: TranslateService // Inject TranslateService
  ) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadPlots();
    } else {
      console.error(this.translate.instant('plot.noUserIdError'));
    }
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // Function to delete data
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
            this.loadPlots(); // Reload data after successful deletion
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

  // Function to edit data (if needed)
  edit() {
    // Implement edit function here
  }

  // Function to load data
  loadPlots() {
    this.cassavaAreaService.getCassavaArea(this.userId).subscribe((res: any) => {
      this.dataSource.data = res.map((item: any) => ({
        ...item,
        area_rai: Math.round(item.area_rai)
      }));
      // Ensure paginator is set after data load
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, error => {
      console.error(this.translate.instant('plot.loadDataError'), error);
    });
  }

  // Function to open add form
openAdd() {
  const dialogRef = this.dialog.open(AddPlantedAreaComponent, {
    width: '90%',   // กำหนดความกว้างให้เต็มหน้าจอ
    height: '90%',  // กำหนดความสูงให้เต็มหน้าจอ
    maxWidth: '100vw', // กำหนดขนาดกว้างสูงสุดเป็น 100% ของหน้าจอ
    maxHeight: '100vh' // กำหนดขนาดสูงสุดเป็น 100% ของหน้าจอ
  });

  dialogRef.afterClosed().subscribe(result => {
      if (result) {
          // เรียกฟังก์ชันเพื่อโหลดข้อมูลใหม่หลังจากเพิ่ม/แก้ไข
          this.loadPlots();
      }
  });
}



  // Function to search (if needed)
  onSearch() {
    // Implement search function here
  }

  // Function to view details (if needed)
  viewDetails() {
    // Implement view details function here
  }
}
