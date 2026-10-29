
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PluginService, Plugin } from '../../services/plugin.service';
import { WikiService } from '../../services/wiki.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  totalPlugins = 0;
  pluginsGratuitos = 0;
  pluginsPagos = 0;
  totalPaginasWiki = 0;

  carregando = true;
  carregandoWiki = true;
  erro = '';

  constructor(
    private pluginService: PluginService,
    private wikiService: WikiService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarEstatisticas();
    this.carregarEstatisticasWiki();
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarEstatisticas(): void {
    this.carregando = true;
    this.erro = '';

    this.pluginService.listarTodos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (plugins: Plugin[]) => {
          this.totalPlugins = plugins.length;
          this.pluginsGratuitos = plugins.filter(
            plugin => plugin.gratuito
          ).length;
          this.pluginsPagos = plugins.filter(
            plugin => !plugin.gratuito
          ).length;
        },
        error: erro => {
          console.error('Erro ao carregar estatísticas:', erro);
          this.erro = this.t(
            'Não foi possível carregar as estatísticas.',
            'Unable to load statistics.'
          );
        }
      });
  }

  carregarEstatisticasWiki(): void {
    this.carregandoWiki = true;

    this.wikiService.listarTodosAdmin()
      .pipe(
        finalize(() => {
          this.carregandoWiki = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: paginas => {
          this.totalPaginasWiki = paginas.length;
        },
        error: erro => {
          console.error('Erro ao carregar estatísticas da Wiki:', erro);
          this.totalPaginasWiki = 0;
        }
      });
  }
}