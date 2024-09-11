import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HarvestsService } from './harvests.service';
import { AddHarvestComponent } from './add-harvest/add-harvest.component';


@Component({
  selector: 'app-harvests',
  templateUrl: './harvests.component.html',
  styleUrls: ['./harvests.component.css'] // เปลี่ยนจาก styleUrl เป็น styleUrls
})
export class HarvestsComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['harvest_date', 'plot_name', 'company_name', 'net_weight_kg', 'starch_percentage', 'amount', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userId: string = '';
  searchForm: FormGroup;
  plots: any[] = []; // ตัวแปรสำหรับเก็บข้อมูล plot ที่ได้จากการค้นหา

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private fb: FormBuilder,
    private harvestsService: HarvestsService,
    public dialog: MatDialog // กำหนดให้ใช้ MatDialog
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
      this.plots = res; // เก็บข้อมูล plot ในตัวแปร plots
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

  Edit() {
    // Implement edit logic if needed
  }

  Delete() {
    // Implement delete logic if needed
  }

  openAdd() {
    // เปิด AddHarvestComponent เป็น dialog
    const dialogRef = this.dialog.open(AddHarvestComponent, {
      width: '500px', // กำหนดขนาด dialog
      data: { userId: this.userId } // ส่งข้อมูลที่ต้องการให้กับ dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      // รีเฟรชข้อมูลหลังจาก dialog ปิด
      this.loadHarvests();
    });
  }
}
