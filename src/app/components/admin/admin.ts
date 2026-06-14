import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Señales de datos
  protected readonly points = signal<any[]>([]);
  protected readonly polygons = signal<any[]>([]);
  protected readonly users = signal<any[]>([]);
  protected readonly comments = signal<any[]>([]);
  protected readonly loading = signal(false);

  // Pestaña administrativa activa: 'points' | 'polygons' | 'users' | 'comments'
  protected activeSubTab = signal<'points' | 'polygons' | 'users' | 'comments'>('points');

  // Estadísticas reactivas
  protected readonly totalPoints = computed(() => this.points().length);
  protected readonly totalZones = computed(() => this.polygons().length);
  protected readonly totalUsers = computed(() => this.users().length);
  protected readonly totalComments = computed(() => this.comments().length);

  // Categorías geográficas comunes de turismo
  protected readonly categoriesList = [
    { id: 'historico', label: 'Histórico' },
    { id: 'naturaleza', label: 'Naturaleza / Eco' },
    { id: 'gastronomia', label: 'Gastronomía' },
    { id: 'alojamiento', label: 'Alojamiento' },
    { id: 'entretenimiento', label: 'Entretenimiento' },
    { id: 'deporte', label: 'Deportivo' },
    { id: 'otro', label: 'Otro' }
  ];

  // Formulario y modal de usuarios
  protected userEmail = '';
  protected userPassword = '';
  protected userRole = 'user';
  protected userActive = true;
  protected editingUser = signal<any | null>(null);
  protected showUserModal = signal(false);

  // Formulario y modal de puntos (ubicaciones)
  protected pointName = '';
  protected pointCategory = 'otro';
  protected pointDescription = '';
  protected pointLat = 0;
  protected pointLng = 0;
  protected pointActive = true;
  protected editingPoint = signal<any | null>(null);
  protected showPointModal = signal(false);

  // Formulario y modal de polígonos (zonas)
  protected polygonName = '';
  protected polygonCategory = 'otro';
  protected polygonCoordsText = '';
  protected polygonActive = true;
  protected editingPolygon = signal<any | null>(null);
  protected showPolygonModal = signal(false);

  ngOnInit(): void {
    // Protección de ruta manual: Si no está logeado, redirige a login
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    // Si no es admin, redirige al mapa
    if (this.authService.currentUser()?.role !== 'admin') {
      this.router.navigate(['/map']);
      return;
    }
    this.loadAdminData();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/map']);
  }

  protected loadAdminData(): void {
    this.loading.set(true);
    
    // Cargar puntos
    this.apiService.getPoints(true).subscribe({
      next: (points) => {
        this.points.set(points);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Cargar polígonos
    this.apiService.getPolygons(true).subscribe({
      next: (polys) => this.polygons.set(polys)
    });

    // Cargar usuarios
    this.apiService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => console.error('Error al cargar usuarios:', err)
    });

    // Cargar comentarios
    this.apiService.getAllComments().subscribe({
      next: (comments) => this.comments.set(comments),
      error: (err) => console.error('Error al cargar comentarios:', err)
    });
  }

  protected switchSubTab(tab: 'points' | 'polygons' | 'users' | 'comments'): void {
    this.activeSubTab.set(tab);
  }

  protected deleteComment(id: string): void {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    this.apiService.deleteComment(id).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err.error?.message || 'Error al eliminar comentario')
    });
  }

  protected deletePoint(id: string): void {
    if (!confirm('¿Seguro que quieres eliminar este punto?')) return;
    this.apiService.deletePoint(id).subscribe({
      next: () => this.loadAdminData()
    });
  }

  protected deletePolygon(id: string): void {
    if (!confirm('¿Seguro que quieres eliminar esta zona?')) return;
    this.apiService.deletePolygon(id).subscribe({
      next: () => this.loadAdminData()
    });
  }

  // ==========================================
  // OPERACIONES CRUD USUARIOS
  // ==========================================

  protected openUserModal(user?: any): void {
    if (user) {
      this.editingUser.set(user);
      this.userEmail = user.email;
      this.userPassword = ''; // En blanco si no se cambia
      this.userRole = user.role || 'user';
      this.userActive = user.active !== false;
    } else {
      this.editingUser.set(null);
      this.userEmail = '';
      this.userPassword = '';
      this.userRole = 'user';
      this.userActive = true;
    }
    this.showUserModal.set(true);
  }

  protected closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
  }

  protected saveUser(): void {
    if (!this.userEmail.trim()) {
      alert('El correo electrónico es requerido');
      return;
    }

    const userData: any = {
      email: this.userEmail,
      role: this.userRole,
      active: this.userActive
    };

    if (this.userPassword) {
      userData.password = this.userPassword;
    }

    if (this.editingUser()) {
      this.apiService.updateUser(this.editingUser()._id, userData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closeUserModal();
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar usuario')
      });
    } else {
      if (!this.userPassword) {
        alert('La contraseña es requerida para un nuevo usuario');
        return;
      }
      this.apiService.createUser(userData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closeUserModal();
        },
        error: (err) => alert(err.error?.message || 'Error al crear usuario')
      });
    }
  }

  protected toggleUserActive(user: any): void {
    const newStatus = !user.active;
    if (!confirm(`¿Seguro que quieres ${newStatus ? 'activar' : 'desactivar'} al usuario "${user.email}"?`)) return;
    this.apiService.updateUser(user._id, { active: newStatus }).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err.error?.message || 'Error al actualizar estado del usuario')
    });
  }

  protected removeUser(id: string): void {
    if (!confirm('¿Seguro que deseas desactivar lógicamente este usuario?')) return;
    this.apiService.deleteUser(id).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err.error?.message || 'Error al eliminar usuario')
    });
  }

  // ==========================================
  // OPERACIONES CRUD PUNTOS (UBICACIONES)
  // ==========================================

  protected openPointModal(point?: any): void {
    if (point) {
      this.editingPoint.set(point);
      this.pointName = point.name;
      this.pointCategory = point.category || 'otro';
      this.pointDescription = point.description || '';
      this.pointLat = point.lat;
      this.pointLng = point.lng;
      this.pointActive = point.active !== false;
    } else {
      this.editingPoint.set(null);
      this.pointName = '';
      this.pointCategory = 'otro';
      this.pointDescription = '';
      this.pointLat = 0;
      this.pointLng = 0;
      this.pointActive = true;
    }
    this.showPointModal.set(true);
  }

  protected closePointModal(): void {
    this.showPointModal.set(false);
    this.editingPoint.set(null);
  }

  protected savePoint(): void {
    if (!this.pointName.trim()) {
      alert('El nombre del punto turístico es requerido');
      return;
    }
    if (this.pointLat === 0 || this.pointLng === 0) {
      alert('Se requieren coordenadas de latitud y longitud válidas');
      return;
    }

    const pointData = {
      name: this.pointName,
      category: this.pointCategory,
      description: this.pointDescription,
      lat: this.pointLat,
      lng: this.pointLng,
      active: this.pointActive
    };

    if (this.editingPoint()) {
      this.apiService.updatePoint(this.editingPoint()._id, pointData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closePointModal();
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar punto')
      });
    } else {
      this.apiService.createPoint(pointData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closePointModal();
        },
        error: (err) => alert(err.error?.message || 'Error al crear punto')
      });
    }
  }

  protected togglePointActive(point: any): void {
    const newStatus = !point.active;
    if (!confirm(`¿Seguro que quieres ${newStatus ? 'activar' : 'desactivar'} el punto "${point.name}"?`)) return;
    this.apiService.updatePoint(point._id, { active: newStatus }).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err.error?.message || 'Error al actualizar el estado del punto')
    });
  }

  protected redirectToMapForPoint(): void {
    this.router.navigate(['/map'], { queryParams: { tab: 'points' } });
  }

  // ==========================================
  // OPERACIONES CRUD POLÍGONOS (ZONAS)
  // ==========================================

  protected openPolygonModal(poly?: any): void {
    if (poly) {
      this.editingPolygon.set(poly);
      this.polygonName = poly.name;
      this.polygonCategory = poly.category || 'otro';
      this.polygonCoordsText = poly.coordinates
        ? poly.coordinates.map((c: any) => `${c.lat},${c.lng}`).join('; ')
        : '';
      this.polygonActive = poly.active !== false;
    } else {
      this.editingPolygon.set(null);
      this.polygonName = '';
      this.polygonCategory = 'otro';
      this.polygonCoordsText = '';
      this.polygonActive = true;
    }
    this.showPolygonModal.set(true);
  }

  protected closePolygonModal(): void {
    this.showPolygonModal.set(false);
    this.editingPolygon.set(null);
  }

  protected savePolygon(): void {
    if (!this.polygonName.trim()) {
      alert('El nombre de la zona es requerido');
      return;
    }

    const coords: { lat: number; lng: number }[] = [];
    if (this.polygonCoordsText.trim()) {
      const parts = this.polygonCoordsText.split(';');
      for (const part of parts) {
        if (!part.trim()) continue;
        const [latStr, lngStr] = part.split(',');
        if (latStr && lngStr) {
          const lat = parseFloat(latStr.trim());
          const lng = parseFloat(lngStr.trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coords.push({ lat, lng });
          }
        }
      }
    }

    if (coords.length < 3) {
      alert('Se requieren al menos 3 coordenadas válidas (formato: lat,lng; lat,lng; lat,lng)');
      return;
    }

    const polyData = {
      name: this.polygonName,
      category: this.polygonCategory,
      coordinates: coords,
      active: this.polygonActive
    };

    if (this.editingPolygon()) {
      this.apiService.updatePolygon(this.editingPolygon()._id, polyData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closePolygonModal();
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar zona')
      });
    } else {
      this.apiService.createPolygon(polyData).subscribe({
        next: () => {
          this.loadAdminData();
          this.closePolygonModal();
        },
        error: (err) => alert(err.error?.message || 'Error al crear zona')
      });
    }
  }

  protected togglePolygonActive(poly: any): void {
    const newStatus = !poly.active;
    if (!confirm(`¿Seguro que quieres ${newStatus ? 'activar' : 'desactivar'} la zona "${poly.name}"?`)) return;
    this.apiService.updatePolygon(poly._id, { active: newStatus }).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => alert(err.error?.message || 'Error al actualizar el estado de la zona')
    });
  }

  protected redirectToMapForPolygon(): void {
    this.router.navigate(['/map'], { queryParams: { tab: 'polygons' } });
  }
}
