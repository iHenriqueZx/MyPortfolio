import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PluginService, Plugin } from '../../services/plugin.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-admin-plugins',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin-plugins.html',
  styleUrl: './admin-plugins.css'
})
export class AdminPlugins implements OnInit {
  plugins: Plugin[] = [];
  carregando = true;
  erro = '';
  busca = '';
  categoriaSelecionada = 'Todas';
  filtroPreco = 'Todos';
  pluginExclusao: Plugin | null = null;
  excluindo = false;
  mensagem = '';

  constructor(
    private pluginService: PluginService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPlugins();
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  traduzirCategoria(categoria: string): string {
    const traducoes: Record<string, [string, string]> = {
      'Todas': ['Todas', 'All Categories'],
      'Gameplay': ['Gameplay', 'Gameplay'],
      'Administração': ['Administração', 'Administration'],
      'Customização': ['Customização', 'Customization'],
      'Economia': ['Economia', 'Economy'],
      'Utilidades': ['Utilidades', 'Utilities'],
      'Outros': ['Outros', 'Other']
    };

    const traducao = traducoes[categoria];

    return traducao
      ? this.t(traducao[0], traducao[1])
      : categoria;
  }

  get totalGratuitos(): number {
    return this.plugins.filter(plugin => plugin.gratuito).length;
  }

  get totalPagos(): number {
    return this.plugins.filter(plugin => !plugin.gratuito).length;
  }

  carregarPlugins(): void {
    this.carregando = true;
    this.erro = '';

    this.pluginService.listarTodos().pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (plugins) => {
        this.plugins = [...plugins];
      },
      error: (erro) => {
        console.error('Erro ao carregar plugins:', erro);
        this.erro = this.t(
          'Não foi possível carregar os plugins.',
          'Unable to load plugins.'
        );
      }
    });
  }

  get categorias(): string[] {
    return [
      'Todas',
      ...new Set(this.plugins.map(plugin => plugin.categoria).filter(Boolean))
    ];
  }

  get pluginsFiltrados(): Plugin[] {
    const termo = this.busca.trim().toLowerCase();

    return this.plugins.filter(plugin => {
      const correspondeBusca =
        !termo ||
        plugin.nome.toLowerCase().includes(termo) ||
        plugin.descricao.toLowerCase().includes(termo) ||
        (plugin.tecnologias || '').toLowerCase().includes(termo);

      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        plugin.categoria === this.categoriaSelecionada;

      const correspondePreco =
        this.filtroPreco === 'Todos' ||
        (this.filtroPreco === 'Gratuitos' && plugin.gratuito) ||
        (this.filtroPreco === 'Pagos' && !plugin.gratuito);

      return correspondeBusca && correspondeCategoria && correspondePreco;
    });
  }

  solicitarExclusao(plugin: Plugin): void {
    this.pluginExclusao = plugin;
  }

  cancelarExclusao(): void {
    if (!this.excluindo) {
      this.pluginExclusao = null;
    }
  }

  confirmarExclusao(): void {
    if (!this.pluginExclusao || this.excluindo) {
      return;
    }

    const pluginId = this.pluginExclusao.id;

    this.excluindo = true;
    this.mensagem = '';

    this.pluginService.excluir(pluginId).pipe(
      finalize(() => {
        this.excluindo = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.plugins = this.plugins.filter(
          plugin => plugin.id !== pluginId
        );

        this.mensagem = this.t(
          'Plugin excluído com sucesso.',
          'Plugin deleted successfully.'
        );
        this.pluginExclusao = null;
      },
      error: (erro) => {
        console.error('Erro ao excluir plugin:', erro);
        this.mensagem = this.t(
          'Não foi possível excluir o plugin.',
          'Unable to delete the plugin.'
        );
      }
    });
  }

  formatarPreco(plugin: Plugin): string {
    if (plugin.gratuito) {
      return this.t('Gratuito', 'Free');
    }

    return (plugin.preco ?? 0).toLocaleString(
      this.idiomaService.idiomaAtual === 'pt' ? 'pt-BR' : 'en-US',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
  }
}