import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrinho {
  id: number;
  nome: string;
  versao: string;
  preco: number;
  icone: string;
  quantidade: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private readonly storageKey = 'lizplugins_carrinho';

  private readonly itensSubject = new BehaviorSubject<ItemCarrinho[]>(
    this.carregarItensSalvos()
  );

  readonly itens$ = this.itensSubject.asObservable();

  get itens(): ItemCarrinho[] {
    return this.itensSubject.value;
  }

  get quantidadeTotal(): number {
    return this.itens.reduce(
      (total, item) => total + item.quantidade,
      0
    );
  }

  get quantidadeProdutos(): number {
    return this.itens.length;
  }

  get valorTotal(): number {
    return this.itens.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0
    );
  }

  contem(id: number): boolean {
    return this.itens.some(item => item.id === id);
  }

  adicionar(item: Omit<ItemCarrinho, 'quantidade'>): boolean {
    if (
      !Number.isInteger(item.id) ||
      item.id <= 0 ||
      !Number.isFinite(item.preco) ||
      item.preco <= 0 ||
      typeof item.nome !== 'string' ||
      !item.nome.trim() ||
      typeof item.versao !== 'string' ||
      !item.versao.trim() ||
      typeof item.icone !== 'string'
    ) {
      return false;
    }

    if (this.contem(item.id)) {
      return false;
    }

    this.atualizar([
      ...this.itens,
      {
        ...item,
        quantidade: 1
      }
    ]);

    return true;
  }

  remover(id: number): void {
    this.atualizar(
      this.itens.filter(item => item.id !== id)
    );
  }

  alterarQuantidade(id: number, quantidade: number): void {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      this.remover(id);
      return;
    }

    this.atualizar(
      this.itens.map(item =>
        item.id === id
          ? { ...item, quantidade }
          : item
      )
    );
  }

  limpar(): void {
    this.atualizar([]);
  }

  sincronizar(): void {
    this.atualizar([...this.itens]);
  }

  private atualizar(itens: ItemCarrinho[]): void {
    const novosItens = [...itens];

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(novosItens)
      );
    } catch (erro) {
      console.error(
        'Não foi possível salvar o carrinho:',
        erro
      );
    }

    this.itensSubject.next(novosItens);
  }

  private carregarItensSalvos(): ItemCarrinho[] {
    try {
      const dados = localStorage.getItem(this.storageKey);

      if (!dados) {
        return [];
      }

      const dadosParseados: unknown = JSON.parse(dados);

      if (!Array.isArray(dadosParseados)) {
        return [];
      }

      const itensValidos = dadosParseados.filter(
        (item): item is ItemCarrinho =>
          item !== null &&
          typeof item === 'object' &&
          Number.isInteger(item.id) &&
          item.id > 0 &&
          typeof item.nome === 'string' &&
          item.nome.trim().length > 0 &&
          typeof item.versao === 'string' &&
          item.versao.trim().length > 0 &&
          typeof item.preco === 'number' &&
          Number.isFinite(item.preco) &&
          item.preco > 0 &&
          typeof item.icone === 'string' &&
          Number.isInteger(item.quantidade) &&
          item.quantidade > 0
      );

      const itensUnicos = new Map<number, ItemCarrinho>();

      for (const item of itensValidos) {
        if (!itensUnicos.has(item.id)) {
          itensUnicos.set(item.id, item);
        }
      }

      return Array.from(itensUnicos.values());
    } catch {
      return [];
    }
  }
}