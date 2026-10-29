import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PluginService, Plugin } from '../../services/plugin.service';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-admin-plugin-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-plugin-form.html',
  styleUrl: './admin-plugin-form.css'
})
export class AdminPluginForm implements OnInit {
  editando = false;
  carregando = false;
  salvando = false;
  enviandoArquivo = false;
  erro = '';
  sucesso = '';

  pluginId: number | null = null;
  arquivoSelecionado: File | null = null;

  plugin: Omit<Plugin, 'id' | 'dataCadastro'> = {
    nome: '',
    versao: '1.0.0',
    descricao: '',
    tecnologias: '',
    gratuito: true,
    preco: 0,
    categoria: 'Gameplay',
    icone: '',
    download: '',
    videoDemonstracao: ''
  };

  constructor(
    private pluginService: PluginService,
    private router: Router,
    private route: ActivatedRoute,
    private idiomaService: IdiomaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id !== null) {
      const numeroId = Number(id);

      if (!Number.isInteger(numeroId) || numeroId <= 0) {
        this.erro = this.t(
          'Identificador de plugin inválido.',
          'Invalid plugin ID.'
        );
        return;
      }

      this.pluginId = numeroId;
      this.editando = true;
      this.carregarPlugin(numeroId);
    }
  }

  t(pt: string, en: string): string {
    return this.idiomaService.traduzir(pt, en);
  }

  carregarPlugin(id: number): void {
    this.carregando = true;
    this.erro = '';

    this.pluginService.buscarPorId(id).pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (plugin: Plugin) => {
        this.plugin = {
          nome: plugin.nome ?? '',
          versao: plugin.versao ?? '1.0.0',
          descricao: plugin.descricao ?? '',
          tecnologias: plugin.tecnologias ?? '',
          gratuito: plugin.gratuito ?? true,
          preco: plugin.preco ?? 0,
          categoria: plugin.categoria ?? 'Gameplay',
          icone: plugin.icone ?? '',
          download: plugin.download ?? '',
          videoDemonstracao: plugin.videoDemonstracao ?? ''
        };
      },
      error: (erro) => {
        console.error('Erro ao carregar plugin:', erro);
        this.erro = erro.error?.message || this.t(
          'Não foi possível carregar este plugin.',
          'Unable to load this plugin.'
        );
      }
    });
  }

  aoAlterarGratuito(): void {
    if (this.plugin.gratuito) {
      this.plugin.preco = 0;
    }
  }

  aoSelecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    this.erro = '';
    this.sucesso = '';

    if (!arquivo) {
      this.arquivoSelecionado = null;
      return;
    }

    if (!arquivo.name.toLowerCase().endsWith('.jar')) {
      this.arquivoSelecionado = null;
      input.value = '';
      this.erro = this.t(
        'Selecione um arquivo com extensão .jar.',
        'Please select a file with the .jar extension.'
      );
      return;
    }

    if (arquivo.size > 100 * 1024 * 1024) {
      this.arquivoSelecionado = null;
      input.value = '';
      this.erro = this.t(
        'O arquivo não pode ultrapassar 100 MB.',
        'The file cannot exceed 100 MB.'
      );
      return;
    }

    this.arquivoSelecionado = arquivo;
  }

  salvar(): void {
    this.erro = '';
    this.sucesso = '';

    if (
      !this.plugin.nome.trim() ||
      !this.plugin.versao.trim() ||
      !this.plugin.descricao.trim() ||
      !this.plugin.categoria.trim()
    ) {
      this.erro = this.t(
        'Preencha todos os campos obrigatórios.',
        'Please fill in all required fields.'
      );
      return;
    }

    if (
      !this.plugin.gratuito &&
      (!Number.isFinite(Number(this.plugin.preco)) ||
        Number(this.plugin.preco) <= 0)
    ) {
      this.erro = this.t(
        'Informe um preço maior que zero para plugins pagos.',
        'Enter a price greater than zero for paid plugins.'
      );
      return;
    }

    const dados = {
      ...this.plugin,
      nome: this.plugin.nome.trim(),
      versao: this.plugin.versao.trim(),
      descricao: this.plugin.descricao.trim(),
      tecnologias: this.plugin.tecnologias.trim(),
      categoria: this.plugin.categoria.trim(),
      icone: this.plugin.icone.trim(),
      download: this.plugin.download.trim(),
      videoDemonstracao: this.plugin.videoDemonstracao.trim(),
      preco: this.plugin.gratuito ? 0 : Number(this.plugin.preco)
    };

    this.salvando = true;

    const requisicao = this.editando && this.pluginId !== null
      ? this.pluginService.atualizar(this.pluginId, dados)
      : this.pluginService.cadastrar(dados);

    requisicao.pipe(
      finalize(() => {
        this.salvando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (pluginSalvo: Plugin) => {
        this.pluginId = pluginSalvo.id;
        this.editando = true;

        if (this.arquivoSelecionado) {
          this.enviarArquivo(pluginSalvo.id);
          return;
        }

        this.router.navigate(['/admin/plugins']);
      },
      error: (erro) => {
        console.error('Erro ao salvar plugin:', erro);
        this.erro = erro.error?.message || this.t(
          'Não foi possível salvar o plugin. Verifique sua sessão e os dados informados.',
          'Unable to save the plugin. Check your session and the information provided.'
        );
      }
    });
  }

  private enviarArquivo(id: number): void {
    if (!this.arquivoSelecionado) {
      return;
    }

    const arquivo = this.arquivoSelecionado;

    this.enviandoArquivo = true;
    this.erro = '';
    this.sucesso = '';

    this.pluginService.uploadArquivo(id, arquivo).pipe(
      finalize(() => {
        this.enviandoArquivo = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (resultado) => {
        this.sucesso = resultado.mensagem;
        this.arquivoSelecionado = null;
        this.router.navigate(['/admin/plugins']);
      },
      error: (erro) => {
        console.error('Erro ao enviar arquivo:', erro);
        this.erro = erro.error?.message || this.t(
          'Os dados foram salvos, mas o envio do arquivo falhou. Tente enviar o arquivo novamente.',
          'The data was saved, but the file upload failed. Please try uploading the file again.'
        );
      }
    });
  }
}