import { Routes } from '@angular/router';
import { Coaching } from './coaching/coaching';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { AssessmentTrackingComponent } from './assessment-tracking/assessment-tracking.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { PsychologistDashboardComponent } from './psychologist-dashboard/psychologist-dashboard.component';
import { ReportsComponent } from './reports/reports.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'coaching', component: Coaching, canActivate: [AuthGuard] },
  { path: 'assessment-tracking', component: AssessmentTrackingComponent, canActivate: [AuthGuard] },
  { path: 'profile-settings', component: ProfileSettingsComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },
  {
    path: 'psychologist-dashboard',
    component: PsychologistDashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '/home' },
];
