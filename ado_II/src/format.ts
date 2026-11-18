export function fmt(valor: number | null | undefined, casas = 2): string {
  if (valor == null) return "-";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
