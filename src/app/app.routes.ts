import { Routes } from '@angular/router';
import { MapDashboard } from './components/map-dashboard/map-dashboard';
import { Login } from './components/login/login';
import { Admin } from './components/admin/admin';

export const routes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  { path: 'map', component: MapDashboard },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin },
  { path: '**', redirectTo: 'map' }
];
