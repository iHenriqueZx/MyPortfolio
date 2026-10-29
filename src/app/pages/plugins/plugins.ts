
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PluginService, Plugin as PluginApi } from '../../services/plugin.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { IdiomaService } from '../../services/idioma.service';

interface Plugin {
  id: number;
  name: string;
  version: string;
  description: string;
  technologies: string[];
  price: string;
  preco: number;
  gratuito: boolean;
  download: string;
  videoDemonstracao: string;
  category: string;
  icon: string;
}

@Component({
  selector: 'app-plugins',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './plugins.html',
  styleUrl: './plugins.css'
})
export class Plugins implements OnInit, AfterViewInit, OnDestroy {
  search = '';
  selectedCategory = 'Todos';
  selectedPlugin: Plugin | null = null;
  plugins: Plugin[] = [];
  carregando = true;
  erro = '';
  mensagemCarrinho = '';

  private observer?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private audioContext?: AudioContext;
  private animacaoAgendada = false;
  private frameMouse = 0;
  private mouseX = 0;
  private mouseY = 0;
  private clickCaptureHandler?: (event: MouseEvent) => void;
  private mouseMoveHandler?: (event: MouseEvent) => void;

  constructor(
    private pluginService: PluginService,
    private carrinhoService: CarrinhoService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.carregarPlugins();
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

        const elemento = alvo.closest(
          'button, a, [role="button"], input[type="submit"]'
        );

        if (
          !elemento ||
          elemento.hasAttribute('disabled') ||
          elemento.getAttribute('aria-disabled') === 'true'
        ) {
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

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        entradas => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) {
              continue;
            }

            const elemento = entrada.target;

            this.renderer.removeClass(elemento, 'scroll-hidden');
            this.renderer.addClass(elemento, 'scroll-visible');
            this.observer?.unobserve(elemento);
          }
        },
        {
          threshold: 0.05,
          rootMargin: '0px 0px -20px 0px'
        }
      );
    }

    this.observarElementos();

    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver(() => {
        this.agendarObservacao();
      });

      this.mutationObserver.observe(host, {
        childList: true,
        subtree: true
      });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.mutationObserver?.disconnect();

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
      volume.gain.exponentialRampToValueAtTime(0.055, agora + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.075);

      oscilador.connect(volume);
      volume.connect(contexto.destination);

      oscilador.start(agora);
      oscilador.stop(agora + 0.08);

      oscilador.addEventListener('ended', () => {
        oscilador.disconnect();
        volume.disconnect();
      }, { once: true });
    } catch (erro) {
      console.warn('Não foi possível reproduzir o som:', erro);
    }
  }

  private observarElementos(): void {
    const host = this.elementRef.nativeElement;

    const elementos = host.querySelectorAll<HTMLElement>(
      '.plugins-header, .plugins-toolbar, .plugin-card, .plugins-message'
    );

    elementos.forEach((elemento, index) => {
      if (
        elemento.classList.contains('scroll-visible') ||
        elemento.classList.contains('scroll-hidden')
      ) {
        return;
      }

      this.renderer.setStyle(
        elemento,
        '--reveal-delay',
        `${(index % 3) * 90}ms`
      );

      if (!this.observer) {
        this.renderer.addClass(elemento, 'scroll-visible');
        return;
      }

      this.renderer.addClass(elemento, 'scroll-hidden');
      this.observer.observe(elemento);
    });
  }

  private agendarObservacao(): void {
    if (
      this.animacaoAgendada ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      return;
    }

    this.animacaoAgendada = true;

    requestAnimationFrame(() => {
      this.animacaoAgendada = false;
      this.observarElementos();
    });
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarPlugins(): void {
    this.carregando = true;
    this.erro = '';

    this.pluginService.listarTodos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
          this.agendarObservacao();
        })
      )
      .subscribe({
        next: plugins => {
          this.plugins = plugins.map(plugin =>
            this.converterPlugin(plugin)
          );
        },
        error: erro => {
          console.error('Erro ao carregar plugins:', erro);

          this.erro = this.t(
            'Não foi possível carregar os plugins. Tente novamente.',
            'Could not load plugins. Please try again.'
          );
        }
      });
  }

  private converterPlugin(plugin: PluginApi): Plugin {
    const caminhoDownload = plugin.download || '';
    const preco = plugin.gratuito ? 0 : Number(plugin.preco ?? 0);

    return {
      id: plugin.id,
      name: plugin.nome,
      version: plugin.versao,
      description: plugin.descricao,
      technologies: (plugin.tecnologias || '')
        .split(',')
        .map(tecnologia => tecnologia.trim())
        .filter(Boolean),
      price: plugin.gratuito
        ? this.t('Gratuito', 'Free')
        : preco.toLocaleString(
            this.idiomaService.idiomaAtual === 'pt' ? 'pt-BR' : 'en-US',
            {
              style: 'currency',
              currency: 'BRL'
            }
          ),
      preco,
      gratuito: plugin.gratuito,
      download: caminhoDownload.startsWith('/api/plugins/')
        ? `http://localhost:8080${caminhoDownload}`
        : '',
      videoDemonstracao: plugin.videoDemonstracao || '',
      category: plugin.categoria,
      icon: plugin.icone || plugin.nome.charAt(0).toUpperCase()
    };
  }

  get filteredPlugins(): Plugin[] {
    const searchTerm = this.search.trim().toLowerCase();

    return this.plugins.filter(plugin => {
      const matchesCategory =
        this.selectedCategory === 'Todos' ||
        plugin.category === this.selectedCategory;

      const matchesSearch =
        !searchTerm ||
        plugin.name.toLowerCase().includes(searchTerm) ||
        plugin.description.toLowerCase().includes(searchTerm) ||
        plugin.technologies.some(technology =>
          technology.toLowerCase().includes(searchTerm)
        );

      return matchesCategory && matchesSearch;
    });
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
    this.agendarObservacao();
  }

  openPlugin(plugin: Plugin): void {
    this.selectedPlugin = plugin;
    this.mensagemCarrinho = '';
    this.agendarObservacao();
  }

  closePlugin(): void {
    this.selectedPlugin = null;
    this.mensagemCarrinho = '';
  }

  adicionarAoCarrinho(plugin: Plugin, event?: Event): void {
    event?.stopPropagation();

    if (
      plugin.gratuito ||
      !Number.isFinite(plugin.preco) ||
      plugin.preco <= 0
    ) {
      this.mensagemCarrinho = this.t(
        'Este plugin não está disponível para compra.',
        'This plugin is not available for purchase.'
      );
      return;
    }

    const adicionado = this.carrinhoService.adicionar({
      id: plugin.id,
      nome: plugin.name,
      versao: plugin.version,
      preco: plugin.preco,
      icone: plugin.icon
    });

    this.mensagemCarrinho = adicionado
      ? this.t(
          'Plugin adicionado ao carrinho!',
          'Plugin added to cart!'
        )
      : this.t(
          'Este plugin já está no carrinho.',
          'This plugin is already in the cart.'
        );
  }
}