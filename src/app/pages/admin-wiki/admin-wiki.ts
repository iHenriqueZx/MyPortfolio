
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Plugin, PluginService } from '../../services/plugin.service';
import {
  WikiPage,
  WikiPageRequest,
  WikiService
} from '../../services/wiki.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-admin-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-wiki.html',
  styleUrl: './admin-wiki.css'
})
export class AdminWiki implements OnInit {
  paginas: WikiPage[] = [];
  plugins: Plugin[] = [];

  carregando = false;
  salvando = false;
  mensagem = '';
  erro = '';

  paginaEditandoId: number | null = null;

  formulario: WikiPageRequest = this.novoFormulario();

  constructor(
    private wikiService: WikiService,
    private pluginService: PluginService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPaginas();
    this.carregarPlugins();
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarPaginas(): void {
    this.carregando = true;
    this.erro = '';

    this.wikiService.listarTodosAdmin()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: paginas => {
          this.paginas = paginas;
        },
        error: resposta => {
          console.error('Erro ao carregar páginas da Wiki:', resposta);
          this.erro = this.t(
            'Não foi possível carregar as páginas da Wiki.',
            'Could not load Wiki pages.'
          );
        }
      });
  }

  carregarPlugins(): void {
    this.pluginService.listarTodos().subscribe({
      next: plugins => {
        this.plugins = plugins;
        this.cdr.detectChanges();
      },
      error: resposta => {
        console.error('Erro ao carregar plugins:', resposta);
        this.erro = this.t(
          'Não foi possível carregar os plugins.',
          'Could not load plugins.'
        );
        this.cdr.detectChanges();
      }
    });
  }

  gerarSlug(): void {
    this.formulario.slug = this.formulario.titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  novoArtigo(): void {
    this.paginaEditandoId = null;
    this.formulario = this.novoFormulario();
    this.mensagem = '';
    this.erro = '';
  }

  editar(pagina: WikiPage): void {
    this.paginaEditandoId = pagina.id;
    this.formulario = {
      titulo: pagina.titulo,
      slug: pagina.slug,
      categoria: pagina.categoria,
      conteudo: pagina.conteudo,
      publicado: pagina.publicado,
      pluginId: pagina.plugin?.id ?? null
    };

    this.mensagem = '';
    this.erro = '';
  }

  salvar(): void {
    if (this.salvando) {
      return;
    }

    this.mensagem = '';
    this.erro = '';

    if (
      !this.formulario.titulo.trim() ||
      !this.formulario.slug.trim() ||
      !this.formulario.categoria.trim() ||
      !this.formulario.conteudo.trim()
    ) {
      this.erro = this.t(
        'Preencha o título, endereço, categoria e conteúdo.',
        'Fill in the title, URL, category and content.'
      );
      return;
    }

    this.salvando = true;

    const dados: WikiPageRequest = {
      ...this.formulario,
      titulo: this.formulario.titulo.trim(),
      slug: this.formulario.slug.trim(),
      categoria: this.formulario.categoria.trim(),
      conteudo: this.formulario.conteudo.trim(),
      pluginId: this.formulario.pluginId
        ? Number(this.formulario.pluginId)
        : null
    };

    const requisicao = this.paginaEditandoId === null
      ? this.wikiService.criar(dados)
      : this.wikiService.atualizar(this.paginaEditandoId, dados);

    requisicao
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: pagina => {
          this.mensagem = this.t(
            `Página "${pagina.titulo}" salva com sucesso.`,
            `Page "${pagina.titulo}" saved successfully.`
          );
          this.paginaEditandoId = pagina.id;
          this.carregarPaginas();
        },
        error: resposta => {
          console.error('Erro ao salvar página da Wiki:', resposta);

          this.erro = resposta.error?.detail
            || resposta.error?.message
            || this.t(
              'Não foi possível salvar a página. Verifique os dados e sua autenticação.',
              'Could not save the page. Check the data and your authentication.'
            );
        }
      });
  }

  excluir(pagina: WikiPage): void {
    const confirmado = confirm(
      this.t(
        `Deseja excluir permanentemente a página "${pagina.titulo}"?`,
        `Do you want to permanently delete the page "${pagina.titulo}"?`
      )
    );

    if (!confirmado) {
      return;
    }

    this.erro = '';
    this.mensagem = '';

    this.wikiService.excluir(pagina.id)
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.mensagem = this.t(
            'Página excluída com sucesso.',
            'Page deleted successfully.'
          );

          if (this.paginaEditandoId === pagina.id) {
            this.novoArtigo();
          }

          this.carregarPaginas();
        },
        error: resposta => {
          console.error('Erro ao excluir página da Wiki:', resposta);

          this.erro = resposta.error?.detail
            || resposta.error?.message
            || this.t(
              'Não foi possível excluir a página.',
              'Could not delete the page.'
            );
        }
      });
  }

  private novoFormulario(): WikiPageRequest {
    return {
      titulo: '',
      slug: '',
      categoria: '',
      conteudo: '',
      publicado: false,
      pluginId: null
    };
  }
}