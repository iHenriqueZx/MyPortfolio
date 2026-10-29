
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Plugin {
  id: number;
  nome: string;
  versao: string;
  descricao: string;
  tecnologias: string;
  gratuito: boolean;
  preco: number;
  categoria: string;
  icone: string;
  download: string;
  videoDemonstracao: string;
  dataCadastro: string;
  downloads?: number;
}

export interface ResultadoUpload {
  nomeArquivo: string;
  download: string;
  mensagem: string;
}

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listarTodos(): Observable<Plugin[]> {
    return this.http.get<Plugin[]>(`${this.apiUrl}/plugins`);
  }

  buscarPorId(id: number): Observable<Plugin> {
    return this.http.get<Plugin>(`${this.apiUrl}/plugins/${id}`);
  }

  cadastrar(
    plugin: Omit<Plugin, 'id' | 'dataCadastro' | 'downloads'>
  ): Observable<Plugin> {
    return this.http.post<Plugin>(
      `${this.apiUrl}/admin/plugins`,
      plugin,
      { headers: this.obterCabecalhos() }
    );
  }

  atualizar(
    id: number,
    plugin: Omit<Plugin, 'id' | 'dataCadastro' | 'downloads'>
  ): Observable<Plugin> {
    return this.http.put<Plugin>(
      `${this.apiUrl}/admin/plugins/${id}`,
      plugin,
      { headers: this.obterCabecalhos() }
    );
  }

  uploadArquivo(id: number, arquivo: File): Observable<ResultadoUpload> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    return this.http.post<ResultadoUpload>(
      `${this.apiUrl}/admin/plugins/${id}/upload`,
      formData,
      { headers: this.obterCabecalhos() }
    );
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/admin/plugins/${id}`,
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
