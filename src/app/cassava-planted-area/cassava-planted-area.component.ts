import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AddexpensesComponent } from '../expenses/addexpenses/addexpenses.component';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CassavaAreaServiceService } from './cassava-area-service.service';
import { AddPlantedAreaComponent } from './add-planted-area/add-planted-area.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cassava-planted-area',
  templateUrl: './cassava-planted-area.component.html',
  styleUrl: './cassava-planted-area.component.css'
})




export class CassavaPlantedAreaComponent implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['plot_name', 'area','image', 'actions'];


  constructor(
    private fb: FormBuilder,
    private cassavaAreaService: CassavaAreaServiceService,
    public dialog: MatDialog,
    private router: Router
  ) { }


  ngOnInit(): void {
    const userId = localStorage.getItem('userId') || '';
  }

  deleted(){}
  edit(){}
  loadExpenses(){
    // this.cassavaAreaService.getCassavaArea().subscribe((res: any) => {
    //   this.dataSource.data = res;
    // }
  }
  openAdd(){
    this.router.navigate(['/addPlantedArea']);
  }
  // openAdd(expenseId?: number): void {
  //   const dialogRef = this.dialog.open(AddPlantedAreaComponent, {
  //     width: '600px',
  //     data: expenseId ? { id: expenseId } : {}
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.loadExpenses(); // รีเฟรชรายการหลังจากเพิ่ม/แก้ไขรายจ่ายใหม่
  //     }
  //   });
  // }
  onSearch(){}
  viewDetails(){}
}
