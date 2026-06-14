import { Component, OnInit, OnDestroy, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './map-dashboard.html',
  styleUrl: './map-dashboard.css'
})
export class MapDashboard implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  // Instancias de Leaflet
  private map!: L.Map;
  private markerLayerGroup = L.layerGroup();
  private polygonLayerGroup = L.layerGroup();
  private drawingLayer = L.layerGroup();

  // Estados flotantes del mapa (Signals)
  protected readonly isDarkMode = signal(false);
  protected readonly isPencilMode = signal(false);

  // Estados de carga
  protected readonly loading = signal(false);

  // Listas de datos recuperadas del backend
  protected points = signal<any[]>([]);
  protected polygons = signal<any[]>([]);

  // Pestaña activa: 'points' | 'polygons'
  protected activeTab = signal<'points' | 'polygons'>('points');

  // Filtro de búsqueda
  protected searchQuery = signal('');

  // Estados de formularios y edición
  protected editingItem = signal<any | null>(null);
  protected selectedPoint = signal<any | null>(null); // Punto seleccionado para ver detalles y comentarios
  protected showPointDetails = signal(false);

  // Campos del formulario
  protected name = '';
  protected description = '';
  protected lat = 0;
  protected lng = 0;
  protected category = '';
  protected elementCategory = 'general';

  // Coordenadas acumuladas (Rutas / Polígonos)
  protected pathCoordinates: { lat: number; lng: number }[] = [];
  protected newLat = 0;
  protected newLng = 0;

  // Lógica de comentarios
  protected comments = signal<any[]>([]);
  protected newCommentText = '';
  protected newCommentRating = 5;

  // Categorías comunes de turismo
  protected readonly categoriesList = [
    { id: 'historico', label: 'Histórico', color: '#d97706' },
    { id: 'naturaleza', label: 'Naturaleza / Eco', color: '#2ed573' },
    { id: 'gastronomia', label: 'Gastronomía', color: '#ff4757' },
    { id: 'alojamiento', label: 'Alojamiento', color: '#6c5ce7' },
    { id: 'entretenimiento', label: 'Entretenimiento', color: '#ffa502' },
    { id: 'deporte', label: 'Deportivo', color: '#3b82f6' },
    { id: 'otro', label: 'Otro', color: '#94a3b8' }
  ];

  // Listas filtradas reactivamente por búsqueda
  protected readonly filteredPoints = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.points();
    return this.points().filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));
  });


  protected readonly filteredPolygons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.polygons();
    return this.polygons().filter(p => p.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      (window as any).angularMapDashboard = this;
      this.initMap();
      this.loadAllData();
      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'polygons') {
          this.activeTab.set('polygons');
        } else if (params['tab'] === 'points') {
          this.activeTab.set('points');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      delete (window as any).angularMapDashboard;
    }
    if (this.map) {
      this.map.remove();
    }
  }

  // ==========================================
  // INICIALIZACIÓN Y CARGA DE DATOS
  // ==========================================

  private initMap(): void {
    // Inicializar mapa centrado en León, Guanajuato
    this.map = L.map('map-element', {
      zoomControl: false // Ocultar control de zoom por defecto para usar diseño premium
    }).setView([21.151398, -101.711748], 13);

    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Añadir grupos de capas
    this.markerLayerGroup.addTo(this.map);
    this.polygonLayerGroup.addTo(this.map);
    this.drawingLayer.addTo(this.map);

    // Evento de click en el mapa (para capturar coordenadas de puntos)
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.isPencilMode()) return; // Ignorar clicks si está dibujando
      
      const { lat, lng } = e.latlng;
      if (this.authService.isLoggedIn() && this.authService.currentUser()?.role === 'admin') {
        this.zone.run(() => {
          if (this.activeTab() === 'points') {
            this.lat = parseFloat(lat.toFixed(6));
            this.lng = parseFloat(lng.toFixed(6));
          } else {
            this.newLat = parseFloat(lat.toFixed(6));
            this.newLng = parseFloat(lng.toFixed(6));
          }
        });
      }
    });

    // Evento de click derecho en el mapa (para capturar coordenadas directamente en el formulario)
    this.map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      if (this.isPencilMode()) return; // Ignorar clicks si está dibujando
      
      const { lat, lng } = e.latlng;
      if (this.authService.isLoggedIn() && this.authService.currentUser()?.role === 'admin') {
        this.zone.run(() => {
          if (this.activeTab() === 'points') {
            this.lat = parseFloat(lat.toFixed(6));
            this.lng = parseFloat(lng.toFixed(6));
          } else {
            this.newLat = parseFloat(lat.toFixed(6));
            this.newLng = parseFloat(lng.toFixed(6));
          }
        });
        console.log(`Coordenada capturada por click derecho en mapa: ${lat}, ${lng}`);
      }
    });

    // Lógica para Dibujo Libre (Modo Lápiz)
    let isDrawing = false;
    let tempPoints: L.LatLng[] = [];
    let tempPolyline: L.Polyline | null = null;

    this.map.on('mousedown', (e: L.LeafletMouseEvent) => {
      if (!this.isPencilMode() || !this.authService.isLoggedIn() || this.authService.currentUser()?.role !== 'admin') return;
      isDrawing = true;
      tempPoints = [e.latlng];
      this.map.dragging.disable(); // Bloquear movimiento del mapa para poder dibujar
      
      if (tempPolyline) this.drawingLayer.removeLayer(tempPolyline);
      tempPolyline = L.polyline(tempPoints, { color: '#3b82f6', weight: 4, dashArray: '5, 10' }).addTo(this.drawingLayer);
    });

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!this.isPencilMode() || !isDrawing) return;
      tempPoints.push(e.latlng);
      if (tempPolyline) {
        tempPolyline.setLatLngs(tempPoints);
      }
    });

    this.map.on('mouseup', () => {
      if (!this.isPencilMode() || !isDrawing) return;
      isDrawing = false;
      this.map.dragging.enable();

      if (tempPoints.length > 2) {
        this.pathCoordinates = tempPoints.map(p => ({
          lat: parseFloat(p.lat.toFixed(6)),
          lng: parseFloat(p.lng.toFixed(6))
        }));
      }

      // Limpiar trazo temporal
      setTimeout(() => {
        this.drawingLayer.clearLayers();
        tempPolyline = null;
      }, 400);
    });
  }

  private loadAllData(): void {
    this.loading.set(true);
    
    // Cargar puntos
    this.apiService.getPoints().subscribe({
      next: (points) => {
        this.points.set(points);
        this.renderPointsOnMap();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });


    // Cargar polígonos
    this.apiService.getPolygons().subscribe({
      next: (polys) => {
        this.polygons.set(polys);
        this.renderPolygonsOnMap();
      }
    });
  }

  // ==========================================
  // RENDERIZADO EN EL MAPA LEAFLET
  // ==========================================

  protected getCategoryColor(cat: string): string {
    const found = this.categoriesList.find(c => c.id === cat);
    return found ? found.color : '#64748b'; // default slate color
  }

  private renderPointsOnMap(): void {
    this.markerLayerGroup.clearLayers();
    this.points().forEach(p => {
      if (p.active === false) return;
      
      const color = this.getCategoryColor(p.category);
      const icon = L.divIcon({
        html: `
          <div class="marker-pin-container">
            <div class="marker-pin" style="background-color: ${color};"></div>
            <div class="marker-icon-inner">📍</div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([p.lat, p.lng], { icon }).addTo(this.markerLayerGroup);
      
      // Evento al hacer clic en el marcador: Abre detalles del marcador en panel lateral
      marker.on('click', () => {
        this.selectPoint(p);
      });

      // Evento al hacer click derecho en el marcador: abre popup para editar ahí mismo
      marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
        // Evita que el click derecho se propague al mapa
        L.DomEvent.stopPropagation(e);

        const isAdmin = this.authService.isLoggedIn() && this.authService.currentUser()?.role === 'admin';
        
        const popupContent = `
          <div class="map-popup" id="popup-point-${p._id}" style="min-width: 220px; font-family: 'Outfit', sans-serif; padding: 6px;">
            <div class="popup-view-mode" id="pop-view-${p._id}">
              <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 800;">${p.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.4;">${p.description || 'Sin descripción'}</p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b;">
                Categoría: <span class="badge" style="background: #eff6ff; color: #1e40af; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 700; text-transform: uppercase;">${p.category}</span>
              </p>
              ${isAdmin ? `
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button 
                    onclick="window.angularMapDashboard.editPointFromPopup('${p._id}')" 
                    style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background 0.2s;">
                    Editar
                  </button>
                  <button 
                    onclick="window.angularMapDashboard.deletePointFromPopup('${p._id}')" 
                    style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background 0.2s;">
                    Eliminar
                  </button>
                </div>
              ` : '<p style="margin: 0; font-size: 10px; color: #94a3b8; font-style: italic;">Inicia sesión como admin para editar/eliminar</p>'}
            </div>
            
            <div class="popup-edit-mode" id="pop-edit-${p._id}" style="display: none; flex-direction: column; gap: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 13px; font-weight: 800;">Editar Sitio</h3>
              
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <label style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nombre</label>
                <input id="edit-pop-name-${p._id}" type="text" value="${p.name.replace(/"/g, '&quot;')}" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; width: 100%; box-sizing: border-box;" />
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <label style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Descripción</label>
                <textarea id="edit-pop-desc-${p._id}" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; width: 100%; height: 50px; box-sizing: border-box; resize: none; font-family: inherit;">${(p.description || '').replace(/"/g, '&quot;')}</textarea>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <label style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Categoría</label>
                <select id="edit-pop-cat-${p._id}" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; width: 100%; box-sizing: border-box; background: white;">
                  ${this.categoriesList.map(cat => `<option value="${cat.id}" ${cat.id === p.category ? 'selected' : ''}>${cat.label}</option>`).join('')}
                </select>
              </div>
              
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button 
                  onclick="window.angularMapDashboard.savePointFromPopup('${p._id}')" 
                  style="background: #22c55e; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; flex: 1;">
                  Guardar
                </button>
                <button 
                  onclick="window.angularMapDashboard.cancelPopupEdit('${p._id}')" 
                  style="background: #e2e8f0; color: #475569; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
                  X
                </button>
              </div>
            </div>
          </div>
        `;

        L.popup()
          .setLatLng([p.lat, p.lng])
          .setContent(popupContent)
          .openOn(this.map);
      });
    });
  }


  private renderPolygonsOnMap(): void {
    this.polygonLayerGroup.clearLayers();
    this.polygons().forEach(poly => {
      if (poly.active === false) return;
      const latlngs = poly.coordinates.map((c: any) => [c.lat, c.lng]);
      const color = this.getCategoryColor(poly.category);
      const polygon = L.polygon(latlngs, {
        fillColor: color,
        fillOpacity: 0.35,
        color: color,
        weight: 2
      }).addTo(this.polygonLayerGroup);

      polygon.bindPopup(`
        <div class="map-popup">
          <h3>${poly.name}</h3>
          <p>Categoría: <b>${poly.category}</b></p>
          <p>Vértices: <b>${poly.coordinates.length}</b></p>
        </div>
      `);
    });
  }

  // ==========================================
  // LOGICA DEL PANEL DETALLES Y COMENTARIOS
  // ==========================================

  protected selectPoint(point: any): void {
    this.selectedPoint.set(point);
    this.showPointDetails.set(true);
    this.newCommentText = '';
    this.newCommentRating = 5;
    this.loadComments(point._id);
    
    // Centrar mapa
    this.map.flyTo([point.lat, point.lng], 15);
  }

  private loadComments(pointId: string): void {
    this.apiService.getComments(pointId).subscribe({
      next: (res) => {
        this.comments.set(res);
      }
    });
  }

  protected addComment(): void {
    if (!this.newCommentText.trim()) return;
    const commentData = {
      pointId: this.selectedPoint()._id,
      comment: this.newCommentText,
      rating: this.newCommentRating
    };

    this.apiService.createComment(commentData).subscribe({
      next: () => {
        this.newCommentText = '';
        this.newCommentRating = 5;
        this.loadComments(this.selectedPoint()._id);
      },
      error: (err) => {
        alert(err.error?.message || 'Error al agregar comentario');
      }
    });
  }

  protected deleteComment(commentId: string): void {
    if (!confirm('¿Seguro que quieres eliminar tu comentario?')) return;
    this.apiService.deleteComment(commentId).subscribe({
      next: () => {
        this.loadComments(this.selectedPoint()._id);
      }
    });
  }

  // ==========================================
  // OPERACIONES CRUD (FRONTEND A BACKEND)
  // ==========================================

  protected onTabChange(tab: 'points' | 'polygons'): void {
    this.activeTab.set(tab);
    this.resetForm();
  }

  protected addCoordinate(): void {
    if (this.newLat === 0 && this.newLng === 0) return;
    this.pathCoordinates.push({ lat: this.newLat, lng: this.newLng });
    this.newLat = 0;
    this.newLng = 0;
  }

  protected removeCoordinate(index: number): void {
    this.pathCoordinates.splice(index, 1);
  }

  protected editItem(item: any): void {
    this.editingItem.set(item);
    this.name = item.name;
    this.description = item.description || '';
    this.lat = item.lat || 0;
    this.lng = item.lng || 0;
    this.category = item.category || 'general';
    this.elementCategory = item.category || 'general';
    this.pathCoordinates = item.coordinates ? [...item.coordinates] : [];
  }

  protected deleteItem(item: any): void {
    if (!confirm(`¿Seguro que quieres eliminar "${item.name}"?`)) return;

    if (this.activeTab() === 'points') {
      this.apiService.deletePoint(item._id).subscribe({
        next: () => {
          if (this.selectedPoint()?._id === item._id) this.showPointDetails.set(false);
          this.loadAllData();
        }
      });
    } else if (this.activeTab() === 'polygons') {
      this.apiService.deletePolygon(item._id).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  protected saveElement(): void {
    if (!this.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (this.activeTab() === 'points') {
      if (this.lat === 0 || this.lng === 0) {
        alert('Ingrese latitud y longitud válidas haciendo clic en el mapa');
        return;
      }

      const pointData = {
        name: this.name,
        description: this.description,
        lat: this.lat,
        lng: this.lng,
        category: this.elementCategory
      };

      if (this.editingItem()) {
        this.apiService.updatePoint(this.editingItem()._id, pointData).subscribe({
          next: () => {
            this.loadAllData();
            this.resetForm();
          }
        });
      } else {
        this.apiService.createPoint(pointData).subscribe({
          next: () => {
            this.loadAllData();
            this.resetForm();
          }
        });
      }
    } else {
      // Validar coordenadas mínimas (polígonos necesitan mínimo 3 puntos)
      const minCoords = 3;
      if (this.pathCoordinates.length < minCoords) {
        alert(`Se necesitan mínimo ${minCoords} puntos geográficos para trazar este elemento`);
        return;
      }

      const geomData: any = {
        name: this.name,
        coordinates: this.pathCoordinates,
        category: this.elementCategory
      };

      if (this.editingItem()) {
        this.apiService.updatePolygon(this.editingItem()._id, geomData).subscribe({
          next: () => { this.loadAllData(); this.resetForm(); }
        });
      } else {
        this.apiService.createPolygon(geomData).subscribe({
          next: () => { this.loadAllData(); this.resetForm(); }
        });
      }
    }
  }

  protected resetForm(): void {
    this.editingItem.set(null);
    this.name = '';
    this.description = '';
    this.lat = 0;
    this.lng = 0;
    this.elementCategory = 'general';
    this.pathCoordinates = [];
    this.newLat = 0;
    this.newLng = 0;
  }

  protected centerOnItem(item: any): void {
    if (item.lat && item.lng) {
      this.map.flyTo([item.lat, item.lng], 16);
    } else if (item.coordinates && item.coordinates.length > 0) {
      const bounds = L.latLngBounds(item.coordinates.map((c: any) => [c.lat, c.lng]));
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }

  // ==========================================
  // CONTROLES FLOTANTES DEL MAPA
  // ==========================================



  protected toggleDarkMode(): void {
    this.isDarkMode.update(v => !v);
  }

  protected togglePencilMode(): void {
    if (!this.authService.isLoggedIn() || this.authService.currentUser()?.role !== 'admin') {
      alert('Solo los Administradores pueden utilizar la herramienta Lápiz');
      return;
    }
    this.isPencilMode.update(v => !v);
    if (this.isPencilMode()) {
      this.pathCoordinates = [];
    }
  }



  protected handleLogout(): void {
    this.authService.logout();
    this.resetForm();
    this.showPointDetails.set(false);
  }

  // ==========================================
  // EDICIÓN DIRECTA DESDE POPUP (REQUISITO PDF)
  // ==========================================

  public editPointFromPopup(id: string): void {
    const viewDiv = document.getElementById(`pop-view-${id}`);
    const editDiv = document.getElementById(`pop-edit-${id}`);
    if (viewDiv && editDiv) {
      viewDiv.style.display = 'none';
      editDiv.style.display = 'flex';
    }
  }

  public cancelPopupEdit(id: string): void {
    const viewDiv = document.getElementById(`pop-view-${id}`);
    const editDiv = document.getElementById(`pop-edit-${id}`);
    if (viewDiv && editDiv) {
      editDiv.style.display = 'none';
      viewDiv.style.display = 'block';
    }
  }

  public savePointFromPopup(id: string): void {
    const nameInput = document.getElementById(`edit-pop-name-${id}`) as HTMLInputElement;
    const descInput = document.getElementById(`edit-pop-desc-${id}`) as HTMLInputElement;
    const catSelect = document.getElementById(`edit-pop-cat-${id}`) as HTMLSelectElement;

    if (!nameInput || !nameInput.value.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    const updatedData = {
      name: nameInput.value.trim(),
      description: descInput ? descInput.value.trim() : '',
      category: catSelect ? catSelect.value : 'otro'
    };

    this.apiService.updatePoint(id, updatedData).subscribe({
      next: () => {
        alert('Sitio turístico actualizado con éxito directamente desde el popup.');
        this.map.closePopup();
        this.loadAllData(); // Recargar datos para reflejar los cambios en la lista y mapa
      },
      error: (err) => {
        alert(err.error?.message || 'Error al actualizar el punto desde el popup');
      }
    });
  }

  public deletePointFromPopup(id: string): void {
    if (!confirm('¿Seguro que deseas eliminar este punto turístico?')) return;
    this.apiService.deletePoint(id).subscribe({
      next: () => {
        alert('Sitio turístico eliminado con éxito.');
        this.map.closePopup();
        if (this.selectedPoint()?._id === id) {
          this.showPointDetails.set(false);
        }
        this.loadAllData(); // Recargar datos
      },
      error: (err) => {
        alert(err.error?.message || 'Error al eliminar el punto desde el popup');
      }
    });
  }
}
