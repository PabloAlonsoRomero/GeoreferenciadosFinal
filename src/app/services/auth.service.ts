import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Señal reactiva para almacenar el usuario actual
  readonly currentUser = signal<any | null>(null);

  // Computado reactivo para saber si el usuario está autenticado
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadSession();
  }

  /**
   * Carga los datos de sesión almacenados en LocalStorage si existen.
   */
  private loadSession(): void {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
        } catch {
          this.logout();
        }
      }
    }
  }

  /**
   * Guarda los datos de sesión en LocalStorage y actualiza la señal reactiva.
   */
  saveSession(token: string, user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser.set(user);
    }
  }

  /**
   * Cierra sesión limpiando los datos de LocalStorage y reseteando la señal reactiva.
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUser.set(null);
    }
  }
}
