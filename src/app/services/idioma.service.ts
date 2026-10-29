
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

  readonly idioma$ = this.idiomaSubject.asObservable();

  get idiomaAtual(): Idioma {
    return this.idiomaSubject.value;
  }

  alternarIdioma(): void {
    this.definirIdioma(this.idiomaAtual === 'en' ? 'pt' : 'en');
  }

  definirIdioma(idioma: Idioma): void {
    localStorage.setItem(this.idiomaKey, idioma);
    this.idiomaSubject.next(idioma);
  }

  private obterIdiomaSalvo(): Idioma {
    const idioma = localStorage.getItem(this.idiomaKey);

    if (idioma === 'pt' || idioma === 'en') {
      return idioma;
    }

    return 'en';
  }

  traduzir(pt: string, en: string): string {
    return this.idiomaAtual === 'en' ? en : pt;
  }
}
