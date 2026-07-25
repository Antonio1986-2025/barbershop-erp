import { Injectable } from '@nestjs/common';

/**
 * PhoneService — normalização, formatação e validação de telefones brasileiros.
 *
 * Normalizado (E.164 Brasil): 5567999999999
 * Formatado: (67) 99999-9999
 */
@Injectable()
export class PhoneService {
  /**
   * Remove tudo que não é dígito.
   */
  digits(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Normaliza para E.164 Brasil (55 + DDD + número).
   * Assume que números com 13 dígitos já estão normalizados.
   * 11 dígitos (com DDD): adiciona 55
   * 10 dígitos (DDD + 8 dígitos, telefone fixo antigo): adiciona 55 + 9?
   *   Não — mantém como está, só adiciona 55.
   */
  normalize(phone: string): string {
    const d = this.digits(phone);

    // Já normalizado (55 + DDD + 9 dígitos)
    if (d.length === 13) return d;

    // 55 + DDD + 8/9 dígitos sem 55
    if (d.length === 11 || d.length === 10) return `55${d}`;

    // DDD + número sem 55 e sem 9?
    if (d.length === 9) return `55${d}`;

    // Apenas 8 dígitos (fixo sem DDD)
    if (d.length === 8) return `5567${d}`;

    // Não foi possível normalizar — retorna original
    return d;
  }

  /**
   * Formata para exibição: (67) 99999-9999
   */
  format(phone: string): string {
    const d = this.digits(phone);
    // Tenta extrair DDD + número de diferentes comprimentos
    let ddd = '';
    let number = '';

    if (d.length === 13) {
      // 5567999999999
      ddd = d.slice(2, 4);
      number = d.slice(4);
    } else if (d.length === 11) {
      // 67999999999
      ddd = d.slice(0, 2);
      number = d.slice(2);
    } else if (d.length === 10) {
      // 6799999999 (fixo antigo)
      ddd = d.slice(0, 2);
      number = d.slice(2);
    } else {
      // Não foi possível identificar — retorna raw digits
      return this.digits(phone);
    }

    if (number.length >= 9) {
      return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  /**
   * Valida se o telefone tem comprimento mínimo aceitável para Brasil.
   */
  isValid(phone: string): boolean {
    const d = this.digits(phone);
    return d.length >= 10 && d.length <= 13;
  }

  /**
   * Compara dois telefones ignorando formatação.
   */
  areSame(a: string, b: string): boolean {
    return this.normalize(a) === this.normalize(b);
  }
}
