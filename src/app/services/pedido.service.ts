import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PedidoItem {
  pluginId: number;
  nomePlugin: string;
  versaoPlugin: string;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  valorTotal: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'REEMBOLSADO';
  dataCriacao: string;
  itens: PedidoItem[];
}

export interface CriarPedidoRequest {
  itens: {
    pluginId: number;
    quantidade: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly apiUrl = 'http://localhost:8080/api/pedidos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  criar(itens: CriarPedidoRequest['itens']): Observable<Pedido> {
    const token = this.authService.obterToken();

    return this.http.post<Pedido>(
      this.apiUrl,
      { itens },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  listar(): Observable<Pedido[]> {
    const token = this.authService.obterToken();

    return this.http.get<Pedido[]>(
      this.apiUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  buscarPorId(id: number): Observable<Pedido> {
    const token = this.authService.obterToken();

    return this.http.get<Pedido>(
      `${this.apiUrl}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
}