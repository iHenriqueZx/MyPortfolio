
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

export interface Usuario {
  id: number;
  nomeUsuario: string;
  email: string;
  dataCadastro?: string;
  papel: 'USER' | 'ADMIN';
}

export interface LoginResposta {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface CadastroDados {
  nomeUsuario: string;
  email: string;
  senha: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'lizplugins_token';
  private readonly usuarioKey = 'lizplugins_usuario';

  private autenticadoSubject = new BehaviorSubject<boolean>(
    this.estaAutenticado()
  );

  autenticado$ = this.autenticadoSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(identificador: string, senha: string): Observable<LoginResposta> {
    return this.http.post<LoginResposta>(`${this.apiUrl}/login`, {
      identificador,
      senha
    }).pipe(
      tap(resposta => this.atualizarSessao(resposta))
    );
  }

  cadastrar(dados: CadastroDados): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, dados);
  }

  atualizarSessao(resposta: LoginResposta): void {
    sessionStorage.setItem(this.tokenKey, resposta.token);
    sessionStorage.setItem(
      this.usuarioKey,
      JSON.stringify(resposta.usuario)
    );
    this.autenticadoSubject.next(true);
  }

  obterToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  obterUsuario(): Usuario | null {
    const usuarioStr = sessionStorage.getItem(this.usuarioKey);

    if (!usuarioStr) {
      return null;
    }

    try {
      return JSON.parse(usuarioStr) as Usuario;
    } catch {
      this.logout();
      return null;
    }
  }

  isAdmin(): boolean {
    const token = this.obterToken();

    if (!token) {
      return false;
    }

    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return false;
      }

      const payloadBase64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(atob(payloadBase64));

      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        this.logout();
        return false;
      }

      return payload.papel === 'ADMIN';
    } catch {
      this.logout();
      return false;
    }
  }

  estaAutenticado(): boolean {
    const token = this.obterToken();

    if (!token) {
      return false;
    }

    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return false;
      }

      const payloadBase64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(atob(payloadBase64));

      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.usuarioKey);
    this.autenticadoSubject.next(false);
  }
}
