import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = this.registerForm.value;
      this.authService.register(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Registration successful - redirect to home
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          // Check if backend returned a specific error message
          if (error.status === 409 && error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 409) {
            this.errorMessage = 'El email ya está registrado';
          } else if (error.status === 0) {
            // Network error or CORS issue
            this.errorMessage =
              'No se puede conectar al servidor. Por favor, verifica tu conexión.';
          } else {
            this.errorMessage = 'Error al registrarse. Por favor, intenta de nuevo.';
          }
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          name: 'Nombre',
          email: 'Email',
          password: 'Contraseña',
          confirmPassword: 'Confirmar contraseña',
        };
        return `${fieldLabels[fieldName]} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email no válido';
      }
      if (field.errors['minlength']) {
        if (fieldName === 'name') {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        return 'La contraseña debe tener al menos 6 caracteres';
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }
}
