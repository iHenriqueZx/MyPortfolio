
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Idioma = 'pt' | 'en';

@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private readonly idiomaKey = 'lizplugins_idioma';

  private idiomaSubject = new BehaviorSubject<Idioma>(
    this.obterIdiomaSalvo()
  );

  idioma$ = this.idiomaSubject.asObservable();

  get idiomaAtual(): Idioma {
    return this.idiomaSubject.value;
  }

  alternarIdioma(): void {
    this.definirIdioma(this.idiomaAtual === 'pt' ? 'en' : 'pt');
  }

  definirIdioma(idioma: Idioma): void {
    localStorage.setItem(this.idiomaKey, idioma);
    this.idiomaSubject.next(idioma);
  }

  private obterIdiomaSalvo(): Idioma {
    const idioma = localStorage.getItem(this.idiomaKey);
    return idioma === 'en' ? 'en' : 'pt';
  }

  traduzir(pt: string, en: string): string {
    return this.idiomaAtual === 'pt' ? pt : en;
  }
}
