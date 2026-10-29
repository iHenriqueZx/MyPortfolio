
import {
  Component,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout, TimeoutError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnDestroy {
  identificador = '';
  senha = '';
  carregando = false;
  mensagemErro = '';
  somAtivado = false;

  private audioContext: AudioContext | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  @HostListener('document:mousemove', ['$event'])
  acompanharCursor(event: MouseEvent): void {
    const host = this.elementRef.nativeElement;

    host.style.setProperty('--mouse-x', `${event.clientX}px`);
    host.style.setProperty('--mouse-y', `${event.clientY}px`);

    if (!host.classList.contains('cursor-light-active')) {
      host.classList.add('cursor-light-active');
    }
  }

  @HostListener('document:mouseleave')
  pararLuzCursor(): void {
    this.elementRef.nativeElement.classList.remove('cursor-light-active');
  }

  alternarSom(): void {
    this.somAtivado = !this.somAtivado;

    if (this.somAtivado) {
      this.tocarSom('click');
    }
  }

  tocarSom(tipo: 'click' | 'focus' = 'click'): void {
    if (!this.somAtivado) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        void this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const agora = this.audioContext.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        tipo === 'focus' ? 620 : 760,
        agora
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        tipo === 'focus' ? 700 : 480,
        agora + 0.055
      );

      gain.gain.setValueAtTime(0.0001, agora);
      gain.gain.exponentialRampToValueAtTime(0.045, agora + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.065);

      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);

      oscillator.start(agora);
      oscillator.stop(agora + 0.07);

      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      return;
    }
  }

  entrar(): void {
    if (this.carregando) return;

    if (!this.identificador.trim() || !this.senha) {
      this.mensagemErro = this.t(
        'Preencha o usuário e a senha.',
        'Enter your username and password.'
      );
      return;
    }

    this.mensagemErro = '';
    this.carregando = true;

    this.authService.login(
      this.identificador.trim(),
      this.senha
    ).pipe(
      timeout({ first: 15000 }),
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (erro: unknown) => {
        if (erro instanceof HttpErrorResponse) {
          if (erro.status === 401) {
            this.mensagemErro = this.t(
              'Usuário ou senha incorretos.',
              'Incorrect username or password.'
            );
          } else if (erro.status === 0) {
            this.mensagemErro = this.t(
              'Não foi possível conectar ao servidor.',
              'Unable to connect to the server.'
            );
          } else {
            this.mensagemErro =
              erro.error?.mensagem ||
              erro.error?.erro ||
              erro.error?.message ||
              this.t(
                `Erro ao entrar. Código: ${erro.status}.`,
                `Sign-in error. Code: ${erro.status}.`
              );
          }
        } else if (erro instanceof TimeoutError) {
          this.mensagemErro = this.t(
            'A solicitação demorou demais. Tente novamente.',
            'The request took too long. Please try again.'
          );
        } else {
          this.mensagemErro = this.t(
            'Ocorreu um erro inesperado. Tente novamente.',
            'An unexpected error occurred. Please try again.'
          );
        }

        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.classList.remove('cursor-light-active');

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
  }
}