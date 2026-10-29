import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Pedido, PedidoService } from '../../services/pedido.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-historico-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historico-pedidos.html',
  styleUrl: './historico-pedidos.css'
})
export class HistoricoPedidos implements OnInit {
  pedidos: Pedido[] = [];
  carregando = true;
  erro = '';

  constructor(
    private pedidoService: PedidoService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  get pedidosPendentes(): number {
    return this.pedidos.filter(
      pedido => pedido.status === 'PENDENTE'
    ).length;
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarPedidos(): void {
    this.carregando = true;
    this.erro = '';

    this.pedidoService.listar()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: pedidos => {
          this.pedidos = pedidos;
        },
        error: erro => {
          console.error(
            'Erro ao carregar histórico de pedidos:',
            erro
          );

          if (erro.status === 401 || erro.status === 403) {
            this.erro = this.t(
              'Sua sessão expirou ou você precisa entrar na sua conta.',
              'Your session expired or you need to sign in.'
            );
          } else {
            this.erro = this.t(
              'Não foi possível carregar seus pedidos. Tente novamente.',
              'Unable to load your orders. Please try again.'
            );
          }

          this.cdr.detectChanges();
        }
      });
  }

  formatarPreco(valor: number): string {
    return Number(valor).toLocaleString(
      this.idiomaService.idiomaAtual === 'pt'
        ? 'pt-BR'
        : 'en-US',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
  }

  traduzirStatus(status: Pedido['status']): string {
    const statusMap: Record<Pedido['status'], [string, string]> = {
      PENDENTE: ['Pendente', 'Pending'],
      PAGO: ['Pago', 'Paid'],
      CANCELADO: ['Cancelado', 'Cancelled'],
      REEMBOLSADO: ['Reembolsado', 'Refunded']
    };

    const textos = statusMap[status];

    return this.t(textos[0], textos[1]);
  }

  classeStatus(status: Pedido['status']): string {
    return status.toLowerCase();
  }
}