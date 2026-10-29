
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface WikiPage {
  id: number;
  titulo: string;
  slug: string;
  categoria: string;
  conteudo: string;
  publicado: boolean;
  plugin: {
    id: number;
    nome: string;
    versao: string;
  } | null;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface WikiPageRequest {
  titulo: string;
  slug: string;
  categoria: string;
  conteudo: string;
  publicado: boolean;
  pluginId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class WikiService {
  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listarPublicados(): Observable<WikiPage[]> {
    return this.http.get<WikiPage[]>(`${this.apiUrl}/wiki`);
  }

  buscarPublicado(slug: string): Observable<WikiPage> {
    return this.http.get<WikiPage>(
      `${this.apiUrl}/wiki/${encodeURIComponent(slug)}`
    );
  }

  listarTodosAdmin(): Observable<WikiPage[]> {
    return this.http.get<WikiPage[]>(
      `${this.apiUrl}/admin/wiki`,
      { headers: this.obterCabecalhos() }
    );
  }

  criar(pagina: WikiPageRequest): Observable<WikiPage> {
    return this.http.post<WikiPage>(
      `${this.apiUrl}/admin/wiki`,
      pagina,
      { headers: this.obterCabecalhos() }
    );
  }

  atualizar(id: number, pagina: WikiPageRequest): Observable<WikiPage> {
    return this.http.put<WikiPage>(
      `${this.apiUrl}/admin/wiki/${id}`,
      pagina,
      { headers: this.obterCabecalhos() }
    );
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/admin/wiki/${id}`,
      { headers: this.obterCabecalhos() }
    );
  }

  private obterCabecalhos(): HttpHeaders {
    const token = this.authService.obterToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }
}
