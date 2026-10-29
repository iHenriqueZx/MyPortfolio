
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnDestroy {
  nomeUsuario = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  carregando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  private audioContext: AudioContext | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private idiomaService: IdiomaService,
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
    host.classList.add('cursor-light-active');
  }

  @HostListener('document:mouseleave')
  pararLuzCursor(): void {
    this.elementRef.nativeElement.classList.remove('cursor-light-active');
  }

  tocarSom(tipo: 'click' | 'focus' = 'click'): void {
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

  cadastrar(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.carregando) {
      return;
    }

    if (!this.nomeUsuario.trim() || !this.email.trim()) {
      this.mensagemErro = this.t(
        'Preencha o nome de usuário e o e-mail.',
        'Enter your username and email.'
      );
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.mensagemErro = this.t(
        'As senhas não coincidem.',
        'Passwords do not match.'
      );
      return;
    }

    if (this.senha.length < 8) {
      this.mensagemErro = this.t(
        'A senha deve ter pelo menos 8 caracteres.',
        'The password must contain at least 8 characters.'
      );
      return;
    }

    this.carregando = true;

    this.authService.cadastrar({
      nomeUsuario: this.nomeUsuario.trim(),
      email: this.email.trim(),
      senha: this.senha
    }).subscribe({
      next: () => {
        this.mensagemSucesso = this.t(
          'Conta criada! Redirecionando para o login...',
          'Account created! Redirecting to sign in...'
        );

        this.senha = '';
        this.confirmarSenha = '';

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1200);
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 0) {
          this.mensagemErro = this.t(
            'Não foi possível conectar ao servidor.',
            'Unable to connect to the server.'
          );
        } else {
          this.mensagemErro =
            erro.error?.mensagem ||
            erro.error?.message ||
            this.t(
              'Não foi possível criar a conta. Verifique os dados e tente novamente.',
              'Unable to create the account. Check your details and try again.'
            );
        }

        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
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