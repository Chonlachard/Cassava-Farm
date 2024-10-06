import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DashbordComponent } from './dashbord/dashbord.component';
import { ProfileComponent } from './profile/profile.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { AddexpensesComponent } from './expenses/addexpenses/addexpenses.component';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CassavaPlantedAreaComponent } from './cassava-planted-area/cassava-planted-area.component';
import { AddPlantedAreaComponent } from './cassava-planted-area/add-planted-area/add-planted-area.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { HarvestsComponent } from './harvests/harvests.component';
import { AddHarvestComponent } from './harvests/add-harvest/add-harvest.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditHarvestComponent } from './harvests/edit-harvest/edit-harvest.component';
import { WorkerComponent } from './worker/worker.component';
import { AddWorkerComponent } from './worker/add-worker/add-worker.component';
import { EditWorkerComponent } from './worker/edit-worker/edit-worker.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavbarComponent,
    DashbordComponent,
    ProfileComponent,
    ExpensesComponent,
    AddexpensesComponent,
    CassavaPlantedAreaComponent,
    AddPlantedAreaComponent,
    HarvestsComponent,
    AddHarvestComponent,
    EditHarvestComponent,
    WorkerComponent,
    AddWorkerComponent,
    EditWorkerComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }),
    AppRoutingModule,
    BrowserAnimationsModule, // จำเป็นสำหรับ Angular Material
    MatTableModule,          // สำหรับแสดงตาราง
    MatPaginatorModule,      // สำหรับแบ่งหน้าในตาราง
    MatSortModule,           // สำหรับจัดเรียงข้อมูลในตาราง
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule,         // สำหรับ dropdown
    MatFormFieldModule,      // สำหรับ mat-form-field
    GoogleMapsModule,
    MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
