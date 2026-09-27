// Piccolo involucro attorno a localStorage: se non è disponibile
// (navigazione privata, dati bloccati) il gioco funziona lo stesso.
const PREFISSO = "tasto-dopo-tasto:";

export function leggi(chiave, predefinito = null) {
  try {
    const valore = localStorage.getItem(PREFISSO + chiave);
    return valore === null ? predefinito : JSON.parse(valore);
  } catch {
    return predefinito;
  }
}

export function salva(chiave, valore) {
  try {
    localStorage.setItem(PREFISSO + chiave, JSON.stringify(valore));
  } catch {
    // niente da fare: resterà solo per questa visita
  }
}

export function cancella(chiave) {
  try {
    localStorage.removeItem(PREFISSO + chiave);
  } catch {
    // ignorato
  }
}
