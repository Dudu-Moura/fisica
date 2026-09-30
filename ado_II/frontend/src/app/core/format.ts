const cache = new Map<number, Intl.NumberFormat>();

// Formata número no padrão pt-BR com `digits` casas decimais.
export function fmt(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  let f = cache.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    cache.set(digits, f);
  }
  return f.format(value);
}

// Formata com `sig` algarismos significativos (para grandezas que variam em ordens de grandeza).
export function fmtSig(value: number | null | undefined, sig = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: sig }).format(value);
}
