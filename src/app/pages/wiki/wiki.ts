
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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WikiPage, WikiService } from '../../services/wiki.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wiki.html',
  styleUrl: './wiki.css'
})
export class Wiki implements OnInit, AfterViewInit, OnDestroy {
  paginas: WikiPage[] = [];
  carregando = true;
  erro = '';

  private audioContext?: AudioContext;
  private clickCaptureHandler?: (event: MouseEvent) => void;
  private mouseMoveHandler?: (event: MouseEvent) => void;
  private frameMouse = 0;
  private mouseX = 0;
  private mouseY = 0;

  constructor(
    private wikiService: WikiService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.carregarPaginas();
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const host = this.elementRef.nativeElement;

    this.zone.runOutsideAngular(() => {
      this.clickCaptureHandler = (event: MouseEvent): void => {
        const alvo = event.target;

        if (!(alvo instanceof Element) || !host.contains(alvo)) {
          return;
        }

        const artigo = alvo.closest('.wiki-card');

        if (!artigo || !host.contains(artigo)) {
          return;
        }

        void this.tocarSom();
      };

      host.addEventListener('click', this.clickCaptureHandler, true);

      this.mouseMoveHandler = (event: MouseEvent): void => {
        if (window.matchMedia('(pointer: coarse)').matches) {
          return;
        }

        const rect = host.getBoundingClientRect();

        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        if (this.frameMouse) {
          return;
        }

        this.frameMouse = requestAnimationFrame(() => {
          this.frameMouse = 0;

          host.style.setProperty('--mouse-x', `${this.mouseX}px`);
          host.style.setProperty('--mouse-y', `${this.mouseY}px`);
        });
      };

      document.addEventListener('mousemove', this.mouseMoveHandler, {
        passive: true
      });
    });
  }

  ngOnDestroy(): void {
    const host = this.elementRef.nativeElement;

    if (this.clickCaptureHandler) {
      host.removeEventListener('click', this.clickCaptureHandler, true);
    }

    if (this.mouseMoveHandler && typeof document !== 'undefined') {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }

    if (this.frameMouse) {
      cancelAnimationFrame(this.frameMouse);
      this.frameMouse = 0;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
  }

  private async tocarSom(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext;

      if (!AudioContextClass) {
        console.warn('Este navegador não suporta AudioContext.');
        return;
      }

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }

      const contexto = this.audioContext;

      if (contexto.state === 'suspended') {
        await contexto.resume();
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
      volume.gain.exponentialRampToValueAtTime(
        0.055,
        agora + 0.008
      );
      volume.gain.exponentialRampToValueAtTime(
        0.0001,
        agora + 0.075
      );

      oscilador.connect(volume);
      volume.connect(contexto.destination);

      oscilador.start(agora);
      oscilador.stop(agora + 0.08);

      oscilador.addEventListener(
        'ended',
        () => {
          oscilador.disconnect();
          volume.disconnect();
        },
        { once: true }
      );
    } catch (erro) {
      console.warn('Não foi possível reproduzir o som:', erro);
    }
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarPaginas(): void {
    this.carregando = true;
    this.erro = '';

    this.wikiService.listarPublicados()
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
        error: erro => {
          console.error('Erro ao carregar a Wiki:', erro);

          this.erro = this.t(
            'Não foi possível carregar os artigos. Tente novamente.',
            'Could not load the articles. Please try again.'
          );
        }
      });
  }

  trecho(conteudo: string): string {
    const texto = (conteudo || '')
      .replace(/[#*_`>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    return texto.length > 180
      ? `${texto.substring(0, 180)}...`
      : texto;
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