import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HarvestsService } from './harvests.service';
import { AddHarvestComponent } from './add-harvest/add-harvest.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { EditHarvestComponent } from './edit-harvest/edit-harvest.component';
import { debounceTime } from 'rxjs/operators';

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
  showModal: boolean = false;
  imageUrl: string = '';

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
      harvest_date: ['']
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
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadSearchPlots() {
    this.harvestsService.getSerchPlot(this.userId).subscribe((res: any) => {
      this.plots = res;
    });
  }

  loadHarvests(filters: any = {}) {
    this.harvestsService.getHarvests(this.userId, filters).subscribe((res: any) => {
      this.dataSource.data = res;
    });
  }

  onSearch() {
    const filters = this.searchForm.value;
    this.loadHarvests(filters);
  }

  clearSearch() {
    this.searchForm.reset();
    this.loadHarvests();
  }

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

  openAdd(userId: string): void {
    const dialogRef = this.dialog.open(AddHarvestComponent, {
      width: '500px',
      data: { userId: userId }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadHarvests();
    });
  }

  EditHarvest(harvestId: number): void {
    const dialogRef = this.dialog.open(EditHarvestComponent, {
      width: '500px',
      data: { userId: this.userId, harvestId: harvestId }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadHarvests();
    });
  }

  viewDetails(harvestId: number): void {
    this.harvestsService.getHarvestImage(harvestId).subscribe((res: any) => {
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
    }, () => {
      Swal.fire({
        title: this.translate.instant('harvest.error'),
        text: this.translate.instant('harvest.fetchError'),
        icon: 'error'
      });
    });
  }

  closeModal() {
    this.showModal = false;
    this.imageUrl = '';
  }
}
