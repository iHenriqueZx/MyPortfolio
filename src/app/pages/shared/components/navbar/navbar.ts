
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { CarrinhoService } from '../../../../services/carrinho.service';
import { IdiomaService, Idioma } from '../../../../services/idioma.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  autenticado = false;
  idioma: Idioma = 'pt';
  quantidadeCarrinho = 0;

  private subscriptions = new Subscription();
  private audioContext: AudioContext | null = null;
  private clickCaptureHandler?: (event: MouseEvent) => void;
  private mouseMoveHandler?: (event: MouseEvent) => void;
  private frameMouse = 0;
  private mouseX = 0;
  private mouseY = 0;

  constructor(
    private authService: AuthService,
    private carrinhoService: CarrinhoService,
    private router: Router,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.autenticado$.subscribe(autenticado => {
        this.autenticado = autenticado;
        this.cdr.markForCheck();
      })
    );

    this.subscriptions.add(
      this.idiomaService.idioma$.subscribe(idioma => {
        this.idioma = idioma;
        this.cdr.markForCheck();
      })
    );

    this.subscriptions.add(
      this.carrinhoService.itens$.subscribe(itens => {
        this.quantidadeCarrinho = itens.reduce(
          (total, item) => total + item.quantidade,
          0
        );
        this.cdr.markForCheck();
      })
    );
  }

  ngAfterViewInit(): void {
    const host = this.elementRef.nativeElement;

    this.zone.runOutsideAngular(() => {
      this.clickCaptureHandler = (event: MouseEvent): void => {
        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const clicavel = target.closest(
          'a, button, [role="button"], input[type="submit"]'
        );

        if (!clicavel || !host.contains(clicavel)) {
          return;
        }

        if (
          clicavel.hasAttribute('disabled') ||
          clicavel.getAttribute('aria-disabled') === 'true'
        ) {
          return;
        }

        void this.tocarSom();
      };

      host.addEventListener('click', this.clickCaptureHandler, true);

      this.mouseMoveHandler = (event: MouseEvent): void => {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;

        if (this.frameMouse) {
          return;
        }

        this.frameMouse = requestAnimationFrame(() => {
          const navbar = host.querySelector<HTMLElement>('.navbar');

          if (navbar) {
            const rect = navbar.getBoundingClientRect();

            navbar.style.setProperty(
              '--mouse-x',
              `${this.mouseX - rect.left}px`
            );

            navbar.style.setProperty(
              '--mouse-y',
              `${this.mouseY - rect.top}px`
            );
          }

          this.frameMouse = 0;
        });
      };

      document.addEventListener('mousemove', this.mouseMoveHandler, {
        passive: true
      });
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
      oscilador.frequency.setValueAtTime(720, agora);
      oscilador.frequency.exponentialRampToValueAtTime(
        480,
        agora + 0.065
      );

      volume.gain.setValueAtTime(0.0001, agora);
      volume.gain.exponentialRampToValueAtTime(0.045, agora + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.08);

      oscilador.connect(volume);
      volume.connect(contexto.destination);

      oscilador.onended = () => {
        oscilador.disconnect();
        volume.disconnect();
      };

      oscilador.start(agora);
      oscilador.stop(agora + 0.085);
    } catch (erro) {
      console.warn('Não foi possível reproduzir o som da navbar:', erro);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    const host = this.elementRef.nativeElement;

    if (this.clickCaptureHandler) {
      host.removeEventListener('click', this.clickCaptureHandler, true);
    }

    if (this.mouseMoveHandler) {
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

  irParaPerfil(): void {
    if (this.authService.isAdmin()) {
      this.router.navigateByUrl('/admin');
    } else {
      this.router.navigateByUrl('/perfil');
    }
  }

  abrirCarrinho(): void {
    this.router.navigateByUrl('/carrinho');
  }

  alternarIdioma(): void {
    this.idiomaService.alternarIdioma();
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }
}