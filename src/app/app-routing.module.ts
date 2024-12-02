import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashbordComponent } from './dashbord/dashbord.component';
import { ProfileComponent } from './profile/profile.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { AddexpensesComponent } from './expenses/addexpenses/addexpenses.component';
import { CassavaPlantedAreaComponent } from './cassava-planted-area/cassava-planted-area.component';
import { AddPlantedAreaComponent } from './cassava-planted-area/add-planted-area/add-planted-area.component';
import { HarvestsComponent } from './harvests/harvests.component';
import { AddHarvestComponent } from './harvests/add-harvest/add-harvest.component';
import { EditHarvestComponent } from './harvests/edit-harvest/edit-harvest.component';
import { WorkerComponent } from './worker/worker.component';
import { AddWorkerComponent } from './worker/add-worker/add-worker.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { EnterOtpComponent } from './forgot-password/enter-otp/enter-otp.component';
import { ChangePasswordComponent } from './forgot-password/change-password/change-password.component';
import { EditPlantedComponent } from './cassava-planted-area/edit-planted/edit-planted.component';


const routes: Routes = [
  {path: 'login',component: LoginComponent},
  {path:'dashboard',component:DashbordComponent},
  { path: 'profile', component: ProfileComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'addexpenses', component: AddexpensesComponent },
  { path: 'cassavaPlantedArea', component: CassavaPlantedAreaComponent },
  { path: 'addPlantedArea', component: AddPlantedAreaComponent },
  { path: 'harvests', component: HarvestsComponent },
  { path: 'addHarvests', component: AddHarvestComponent },
  {path: 'editHarvests/:harvestId', component: EditHarvestComponent},
  {path: 'worker',component:WorkerComponent},
  {path: 'addWorker',component:AddWorkerComponent},
  {path: 'editWorker',component:EditHarvestComponent},
  {path: 'forgotPassword', component: ForgotPasswordComponent},
  { path: 'enter-otp', component: EnterOtpComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  {path:'edit-plot', component:EditPlantedComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
