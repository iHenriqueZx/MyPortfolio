import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IdiomaService } from '../../services/idioma.service';

interface PerfilUsuario {
  id: number;
  nomeUsuario: string;
  email: string;
  papel: string;
  dataCadastro: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  perfil: PerfilUsuario | null = null;
  carregando = true;
  erro = '';
  mensagem = '';
  salvandoNome = false;
  salvandoEmail = false;
  salvandoSenha = false;

  email = '';
  nomeUsuario = '';
  senhaAtualEmail = '';
  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';

  private readonly apiUrl = 'http://localhost:8080/api/perfil';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPerfil();
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  traduzirPapel(papel: string): string {
    if (papel === 'ADMIN') {
      return this.t('Administrador', 'Administrator');
    }

    if (papel === 'USER') {
      return this.t('Usuário', 'User');
    }

    return papel;
  }

  private headers(): HttpHeaders {
    const token = this.authService.obterToken();

    return new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  carregarPerfil(): void {
    this.carregando = true;
    this.erro = '';

    this.http.get<PerfilUsuario>(this.apiUrl, {
      headers: this.headers()
    }).pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: perfil => {
        this.perfil = perfil;
        this.nomeUsuario = perfil.nomeUsuario;
        this.email = perfil.email;
      },
      error: erro => {
        console.error('Erro ao carregar perfil:', erro);

        this.erro = erro.status === 401
          ? this.t(
              'Sua sessão expirou ou o token não foi enviado. Entre novamente.',
              'Your session expired or the token was not sent. Please sign in again.'
            )
          : erro.status === 403
            ? this.t(
                'Você não tem permissão para consultar este perfil.',
                'You do not have permission to view this profile.'
              )
            : erro.status === 404
              ? this.t(
                  'A rota do perfil não foi encontrada. Confira o backend.',
                  'The profile endpoint was not found. Check the backend.'
                )
              : this.t(
                  'Não foi possível carregar o perfil. Verifique se o backend está funcionando.',
                  'Unable to load your profile. Check whether the backend is running.'
                );
      }
    });
  }

  alterarEmail(): void {
    this.mensagem = '';
    this.erro = '';

    if (!this.email.trim() || !this.senhaAtualEmail) {
      this.erro = this.t(
        'Preencha o novo e-mail e sua senha atual.',
        'Enter your new email and current password.'
      );
      return;
    }

    this.salvandoEmail = true;

    this.http.patch(
      `${this.apiUrl}/email`,
      {
        email: this.email.trim(),
        senhaAtual: this.senhaAtualEmail
      },
      { headers: this.headers() }
    ).pipe(
      finalize(() => {
        this.salvandoEmail = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.senhaAtualEmail = '';
        this.mensagem = this.t(
          'E-mail atualizado com sucesso.',
          'Email updated successfully.'
        );
        this.carregarPerfil();
      },
      error: erro => {
        console.error('Erro ao alterar e-mail:', erro);
        this.erro =
          erro.error?.detail ||
          erro.error?.message ||
          erro.error?.erro ||
          this.t(
            'Não foi possível alterar o e-mail.',
            'Unable to change email.'
          );
      }
    });
  }

  alterarSenha(): void {
    this.mensagem = '';
    this.erro = '';

    if (!this.senhaAtual || !this.novaSenha || !this.confirmarSenha) {
      this.erro = this.t(
        'Preencha todos os campos de senha.',
        'Fill in all password fields.'
      );
      return;
    }

    if (this.novaSenha.length < 8) {
      this.erro = this.t(
        'A nova senha deve ter pelo menos 8 caracteres.',
        'The new password must contain at least 8 characters.'
      );
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.erro = this.t(
        'As senhas novas não coincidem.',
        'The new passwords do not match.'
      );
      return;
    }

    this.salvandoSenha = true;

    this.http.patch(
      `${this.apiUrl}/senha`,
      {
        senhaAtual: this.senhaAtual,
        novaSenha: this.novaSenha
      },
      { headers: this.headers() }
    ).pipe(
      finalize(() => {
        this.salvandoSenha = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.senhaAtual = '';
        this.novaSenha = '';
        this.confirmarSenha = '';
        this.mensagem = this.t(
          'Senha alterada com sucesso.',
          'Password changed successfully.'
        );
      },
      error: erro => {
        console.error('Erro ao alterar senha:', erro);
        this.erro =
          erro.error?.detail ||
          erro.error?.message ||
          erro.error?.erro ||
          this.t(
            'Não foi possível alterar a senha.',
            'Unable to change password.'
          );
      }
    });
  }

  alterarNomeUsuario(): void {
    const nome = this.nomeUsuario.trim();

    this.erro = '';
    this.mensagem = '';

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(nome)) {
      this.erro = this.t(
        'O nome deve ter de 3 a 30 caracteres, usando apenas letras, números e _.',
        'The username must be 3 to 30 characters long and contain only letters, numbers, and _.'
      );
      return;
    }

    if (nome === this.perfil?.nomeUsuario) {
      this.erro = this.t(
        'Informe um nome diferente do atual.',
        'Enter a username different from the current one.'
      );
      return;
    }

    this.salvandoNome = true;

    this.http.patch<{
      mensagem: string;
      token: string;
      tipo: string;
      usuario: {
        id: number;
        nomeUsuario: string;
        email: string;
        papel: 'USER' | 'ADMIN';
      };
    }>(
      `${this.apiUrl}/nome`,
      { nomeUsuario: nome },
      { headers: this.headers() }
    ).pipe(
      finalize(() => {
        this.salvandoNome = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: resposta => {
        this.authService.atualizarSessao({
          token: resposta.token,
          tipo: resposta.tipo,
          usuario: resposta.usuario
        });

        this.mensagem = resposta.mensagem;
        this.carregarPerfil();
      },
      error: erro => {
        this.erro =
          erro.error?.detail ||
          erro.error?.message ||
          erro.error?.erro ||
          this.t(
            'Não foi possível alterar o nome de usuário.',
            'Unable to change username.'
          );
      }
    });
  }

  sair(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}