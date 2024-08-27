import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashbordComponent } from './dashbord/dashbord.component';
import { ProfileComponent } from './profile/profile.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { AddexpensesComponent } from './expenses/addexpenses/addexpenses.component';


const routes: Routes = [
  {path: 'login',component: LoginComponent},
  {path:'dashboard',component:DashbordComponent},
  { path: 'profile', component: ProfileComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'addexpenses', component: AddexpensesComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
