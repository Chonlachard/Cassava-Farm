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


const routes: Routes = [
  {path: 'login',component: LoginComponent},
  {path:'dashboard',component:DashbordComponent},
  { path: 'profile', component: ProfileComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'addexpenses', component: AddexpensesComponent },
  { path: 'cassavaPlantedArea', component: CassavaPlantedAreaComponent },
  { path: 'addPlantedArea', component: AddPlantedAreaComponent },
  { path: 'harvests', component: HarvestsComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
