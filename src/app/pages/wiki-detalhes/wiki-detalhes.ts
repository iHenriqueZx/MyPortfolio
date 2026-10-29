import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { WikiPage, WikiService } from '../../services/wiki.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-wiki-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wiki-detalhes.html',
  styleUrl: './wiki-detalhes.css'
})
export class WikiDetalhe implements OnInit, AfterViewInit, OnDestroy {
  pagina: WikiPage | null = null;
  carregando = true;
  erro = '';

  private audioContext: AudioContext | null = null;
  private clickCaptureHandler?: (event: MouseEvent) => void;
  private mouseMoveHandler?: (event: MouseEvent) => void;
  private frameMouse = 0;
  private mouseX = 0;
  private mouseY = 0;

  constructor(
    private route: ActivatedRoute,
    private wikiService: WikiService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.carregando = true;
          this.erro = '';
          this.pagina = null;

          const slug = params.get('slug') || '';

          return this.wikiService.buscarPublicado(slug).pipe(
            finalize(() => {
              this.carregando = false;
              this.cdr.detectChanges();
            })
          );
        })
      )
      .subscribe({
        next: pagina => {
          this.pagina = pagina;
        },
        error: erro => {
          console.error('Erro ao carregar artigo:', erro);

          this.pagina = null;
          this.erro = this.t(
            'Artigo não encontrado ou indisponível.',
            'Article not found or unavailable.'
          );

          this.carregando = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngAfterViewInit(): void {
    const host = this.elementRef.nativeElement;

    this.zone.runOutsideAngular(() => {
      this.clickCaptureHandler = (event: MouseEvent): void => {
        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const link = target.closest('a');

        if (!link || !host.contains(link)) {
          return;
        }

        if (
          link.hasAttribute('aria-disabled') ||
          link.getAttribute('aria-disabled') === 'true'
        ) {
          return;
        }

        void this.tocarSom();
      };

      host.addEventListener(
        'click',
        this.clickCaptureHandler,
        true
      );

      this.mouseMoveHandler = (event: MouseEvent): void => {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;

        if (this.frameMouse) {
          return;
        }

        this.frameMouse = requestAnimationFrame(() => {
          host.style.setProperty('--mouse-x', `${this.mouseX}px`);
          host.style.setProperty('--mouse-y', `${this.mouseY}px`);
          this.frameMouse = 0;
        });
      };

      document.addEventListener(
        'mousemove',
        this.mouseMoveHandler,
        { passive: true }
      );
    });
  }

  private async tocarSom(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.AudioContext) {
        return;
      }

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new window.AudioContext();
      }

      const contexto = this.audioContext;

      if (contexto.state === 'suspended') {
        await contexto.resume();
      }

      if (contexto.state !== 'running') {
        return;
      }

      const agora = contexto.currentTime;
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();

      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(620, agora);
      oscilador.frequency.exponentialRampToValueAtTime(
        420,
        agora + 0.055
      );

      volume.gain.setValueAtTime(0.0001, agora);
      volume.gain.exponentialRampToValueAtTime(0.045, agora + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.065);

      oscilador.connect(volume);
      volume.connect(contexto.destination);

      oscilador.onended = () => {
        oscilador.disconnect();
        volume.disconnect();
      };

      oscilador.start(agora);
      oscilador.stop(agora + 0.07);
    } catch (erro) {
      console.warn('Não foi possível reproduzir o som:', erro);
    }
  }

  ngOnDestroy(): void {
    const host = this.elementRef.nativeElement;

    if (this.clickCaptureHandler) {
      host.removeEventListener(
        'click',
        this.clickCaptureHandler,
        true
      );
    }

    if (this.mouseMoveHandler) {
      document.removeEventListener(
        'mousemove',
        this.mouseMoveHandler
      );
    }

    if (this.frameMouse) {
      cancelAnimationFrame(this.frameMouse);
      this.frameMouse = 0;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  categoria(categoria: string): string {
    const categorias: Record<string, string> = {
      Geral: this.t('Geral', 'General'),
      Instalação: this.t('Instalação', 'Installation'),
      Configuração: this.t('Configuração', 'Configuration'),
      Tutoriais: this.t('Tutoriais', 'Tutorials'),
      Atualizações: this.t('Atualizações', 'Updates'),
      'Solução de problemas': this.t(
        'Solução de problemas',
        'Troubleshooting'
      )
    };

    return categorias[categoria] || categoria || this.t('Geral', 'General');
  }
}