
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PluginService, Plugin as PluginApi } from '../../services/plugin.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  pluginsEmDestaque: PluginApi[] = [];
  carregandoDestaques = true;
  erroDestaques = '';

  private observer?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private audioContext?: AudioContext;
  private audioDisponivel = false;
  private animacaoAgendada = false;

  constructor(
    private pluginService: PluginService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.carregarDestaques();
  }

  ngAfterViewInit(): void {
    this.configurarAnimacoes();
    this.configurarObservacaoDoConteudo();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.mutationObserver?.disconnect();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  moverLuz(event: MouseEvent): void {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      return;
    }

    const raiz = document.documentElement;

    raiz.style.setProperty('--mouse-x', `${event.clientX}px`);
    raiz.style.setProperty('--mouse-y', `${event.clientY}px`);
    raiz.style.setProperty('--mouse-opacity', '1');
  }

  @HostListener('document:mouseleave')
  esconderLuz(): void {
    document.documentElement.style.setProperty('--mouse-opacity', '0');
  }

  @HostListener('document:click', ['$event'])
  aoClicar(event: MouseEvent): void {
    const alvo = event.target;

    if (!(alvo instanceof Element)) {
      return;
    }

    const interativo = alvo.closest(
      'a, button, [role="button"], input[type="button"], input[type="submit"]'
    );

    if (!interativo || (interativo as HTMLButtonElement).disabled) {
      return;
    }

    this.tocarSom();
  }

  private tocarSom(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    try {
      if (!this.audioContext) {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (!AudioContextClass) {
          return;
        }

        this.audioContext = new AudioContextClass();
      }

      const contexto = this.audioContext;

      if (contexto.state === 'suspended') {
        void contexto.resume();
      }

      const agora = contexto.currentTime;
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();

      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(620, agora);
      oscilador.frequency.exponentialRampToValueAtTime(880, agora + 0.045);

      volume.gain.setValueAtTime(0.0001, agora);
      volume.gain.exponentialRampToValueAtTime(0.055, agora + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.075);

      oscilador.connect(volume);
      volume.connect(contexto.destination);

      oscilador.start(agora);
      oscilador.stop(agora + 0.08);
    } catch {
      this.audioDisponivel = false;
    }
  }

  private configurarAnimacoes(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      entradas => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            this.observer?.unobserve(entrada.target);
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -45px 0px'
      }
    );

    this.observarElementos();
  }

  private configurarObservacaoDoConteudo(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      this.agendarObservacao();
    });

    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  private agendarObservacao(): void {
    if (this.animacaoAgendada) {
      return;
    }

    this.animacaoAgendada = true;

    requestAnimationFrame(() => {
      this.animacaoAgendada = false;
      this.observarElementos();
    });
  }

  private observarElementos(): void {
    if (!this.observer) {
      return;
    }

    const elementos = this.elementRef.nativeElement.querySelectorAll(
      '.featured-section .section-header, ' +
      '.categories-section .section-header, ' +
      '.plugin-card, ' +
      '.category-card, ' +
      '.plugins-message'
    );

    elementos.forEach(elemento => {
      if (elemento.classList.contains('is-visible')) {
        return;
      }

      this.observer?.observe(elemento);
    });
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarDestaques(): void {
    this.carregandoDestaques = true;
    this.erroDestaques = '';

    this.pluginService.listarTodos()
      .pipe(
        finalize(() => {
          this.carregandoDestaques = false;
          this.cdr.detectChanges();
          this.agendarObservacao();
        })
      )
      .subscribe({
        next: plugins => {
          this.pluginsEmDestaque = [...plugins]
            .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
            .slice(0, 3);
        },
        error: erro => {
          console.error('Erro ao carregar plugins:', erro);

          this.erroDestaques = this.t(
            'Não foi possível carregar os plugins em destaque.',
            'Unable to load featured plugins.'
          );

          this.pluginsEmDestaque = [];
        }
      });
  }

  obterTecnologias(plugin: PluginApi): string[] {
    return (plugin.tecnologias || '')
      .split(',')
      .map(tecnologia => tecnologia.trim())
      .filter(Boolean);
  }

  obterDownload(plugin: PluginApi): string {
    const caminho = plugin.download || '';

    if (caminho.startsWith('/api/plugins/')) {
      return `http://localhost:8080${caminho}`;
    }

    return '';
  }

  formatarPreco(plugin: PluginApi): string {
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