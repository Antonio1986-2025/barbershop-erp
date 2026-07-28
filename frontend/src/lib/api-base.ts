/**
 * Retorna a URL base da API dinamicamente.
 * Funciona na maquina local (localhost) e de outros dispositivos na rede (pelo IP).
 */
export function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return `http://${window.location.hostname}:3001`;
}
