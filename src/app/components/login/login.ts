import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Señales reactivas
  protected readonly isRegister = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  // Modelo de formulario
  protected email = '';
  protected password = '';

  protected toggleMode(): void {
    this.isRegister.update(val => !val);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.email = '';
    this.password = '';
  }

  protected onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor, rellene todos los campos obligatorios');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isRegister()) {
      // Registrar nuevo usuario
      const userData = {
        email: this.email,
        password: this.password
      };
      
      this.apiService.register(userData).subscribe({
        next: () => {
          this.successMessage.set('Registro completado. Iniciando sesión...');
          // Auto-login tras registrar
          this.performLogin();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error durante el registro');
          this.loading.set(false);
        }
      });
    } else {
      // Iniciar sesión
      this.performLogin();
    }
  }

  private performLogin(): void {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.apiService.login(credentials).subscribe({
      next: (res) => {
        this.authService.saveSession(res.token, res.user);
        this.router.navigate(['/map']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Credenciales incorrectas');
        this.loading.set(false);
      }
    });
  }
}
