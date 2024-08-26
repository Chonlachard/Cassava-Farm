import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashbordComponent } from './dashbord/dashbord.component';
import { ProfileComponent } from './profile/profile.component';
import { WorkerContactComponent } from './worker-contact/worker-contact.component';


const routes: Routes = [
  {path: 'login',component: LoginComponent},
  {path:'dashboard',component:DashbordComponent},
  { path: 'profile', component: ProfileComponent },
  {path:'workerContact',component:WorkerContactComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
