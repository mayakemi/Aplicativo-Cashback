export function formatDateTime(isoStringOrDate) {
  const d = isoStringOrDate instanceof Date ? isoStringOrDate : new Date(isoStringOrDate);
  if (Number.isNaN(d.getTime())) return String(isoStringOrDate);

  // Formato local simples; suficiente para o TD.
  return d.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
}

