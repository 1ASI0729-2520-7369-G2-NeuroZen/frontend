import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReportService } from '../services/report.service';
import { AuthService } from '../services/auth.service';
import { Report, ReportType } from '../models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedReportType = signal<ReportType>('MONTHLY');
  generatingReport = signal(false);

  reportTypes: ReportType[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'];

  constructor(
    private reportService: ReportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error.set('User not logged in');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.reportService.getReportsByEmployeeId(currentUser.id).subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load reports');
        this.loading.set(false);
        console.error('Error loading reports:', err);
      },
    });
  }

  generateReport(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      alert('User not logged in');
      return;
    }

    this.generatingReport.set(true);

    this.reportService
      .generateReport({
        employeeId: currentUser.id,
        reportType: this.selectedReportType(),
      })
      .subscribe({
        next: (report) => {
          console.log('Report generated:', report);
          this.loadReports();
          this.generatingReport.set(false);
        },
        error: (err) => {
          console.error('Error generating report:', err);
          alert('Failed to generate report. Please try again.');
          this.generatingReport.set(false);
        },
      });
  }

  selectReportType(type: ReportType): void {
    this.selectedReportType.set(type);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getReportTypeLabel(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      MONTHLY: 'Mensual',
      QUARTERLY: 'Trimestral',
      ANNUAL: 'Anual',
      CUSTOM: 'Personalizado',
    };
    return labels[type];
  }

  getProgressPercentage(report: Report): number {
    if (!report.totalAppointments || report.totalAppointments === 0) return 0;
    return Math.round(
      ((report.completedAppointments || 0) / report.totalAppointments) * 100
    );
  }

  getScoreClass(score: number | undefined): string {
    if (!score) return 'text-muted';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }
}

