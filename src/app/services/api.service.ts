import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  
  // En desarrollo apunta a localhost:3000, en producción a la URL de Render
  private readonly baseUrl = environment.apiUrl;

  /**
   * Genera las cabeceras HTTP, incluyendo el Token JWT de autorización si está logeado.
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // ==========================================
  // SERVICIOS DE USUARIO
  // ==========================================

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/register`, user, { headers: this.getHeaders() });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login`, credentials, { headers: this.getHeaders() });
  }

  // ==========================================
  // SERVICIOS DE PUNTOS (UBICACIONES)
  // ==========================================

  getPoints(all = false): Observable<any[]> {
    const url = all ? `${this.baseUrl}/points?all=true` : `${this.baseUrl}/points`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  createPoint(point: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/points`, point, { headers: this.getHeaders() });
  }

  updatePoint(id: string, point: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/points/${id}`, point, { headers: this.getHeaders() });
  }

  deletePoint(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/points/${id}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // SERVICIOS DE COMENTARIOS
  // ==========================================

  getComments(pointId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comments/point/${pointId}`, { headers: this.getHeaders() });
  }

  createComment(comment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/comments`, comment, { headers: this.getHeaders() });
  }

  updateComment(id: string, comment: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/comments/${id}`, comment, { headers: this.getHeaders() });
  }  deleteComment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${id}`, { headers: this.getHeaders() });
  }

  getAllComments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comments`, { headers: this.getHeaders() });
  }
  // ==========================================
  // SERVICIOS DE POLÍGONOS (ZONAS)
  // ==========================================

  getPolygons(all = false): Observable<any[]> {
    const url = all ? `${this.baseUrl}/polygons?all=true` : `${this.baseUrl}/polygons`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  createPolygon(polygon: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/polygons`, polygon, { headers: this.getHeaders() });
  }

  updatePolygon(id: string, polygon: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/polygons/${id}`, polygon, { headers: this.getHeaders() });
  }

  deletePolygon(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/polygons/${id}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // SERVICIOS DE USUARIO (ADMINISTRACIÓN)
  // ==========================================

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() });
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user, { headers: this.getHeaders() });
  }

  updateUser(id: string, user: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}`, user, { headers: this.getHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }
}
