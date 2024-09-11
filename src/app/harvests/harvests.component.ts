import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HarvestsService } from './harvests.service';
import { AddHarvestComponent } from './add-harvest/add-harvest.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-harvests',
  templateUrl: './harvests.component.html',
  styleUrls: ['./harvests.component.css']
})
export class HarvestsComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['harvest_date', 'plot_name', 'company_name', 'net_weight_kg', 'starch_percentage', 'amount', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';
  searchForm: FormGroup;
  plots: any[] = []; // Variable to store plot data

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private harvestsService: HarvestsService,
    public dialog: MatDialog,
    private translate: TranslateService // Inject TranslateService
  ) {
    this.searchForm = this.fb.group({
      plot: ['']
    });
  }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadHarvests();
      this.loadSerchPlots();
    }
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadSerchPlots() {
    this.harvestsService.getSerchPlot(this.userId).subscribe((res: any) => {
      this.plots = res;
    });
  }

  loadHarvests() {
    this.harvestsService.getHarvests(this.userId).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }

  onSearch() {
    // Implement search logic if needed
  }

  clearSearch() {
    this.searchForm.reset();
  }

 

  DeleteHarest(harvestId: number): void {
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
          response => {
            Swal.fire(
              this.translate.instant('harvest.deleteSuccessTitle'),
              this.translate.instant('harvest.deleteSuccessText'),
              'success'
            ).then(() => {
              this.loadHarvests();
            });
          },
          error => {
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

  openAdd(harvestId?: number): void {
    const dialogRef = this.dialog.open(AddHarvestComponent, {
      width: '500px',
      data: { userId: this.userId, harvestId: harvestId } // ส่ง harvestId ไปยังคอมโพเนนต์
    });
  
    dialogRef.afterClosed().subscribe(result => {
      this.loadHarvests(); // โหลดข้อมูลหลังจากปิด Dialog
    });
  }
  
  EditHarvest(harvestId: number): void{
    this.openAdd(harvestId);
  }
}
