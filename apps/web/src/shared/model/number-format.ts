const currency = new Intl.NumberFormat("ko-KR");

export function formatWon(value: number) {
  return `${currency.format(value)}원`;
}

export function formatNumber(value: number) {
  return currency.format(value);
}

export function formatStack(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
