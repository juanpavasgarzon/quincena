export function formatCOP(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n as number)) return "$ 0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n as number));
  const withDots = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}$ ${withDots}`;
}

export function parseCOP(s: string): number {
  if (typeof s !== "string") return Number(s) || 0;
  const digits = s.replace(/[^\d-]/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

/** Quincena 1 = días 1–15 del mes; quincena 2 = del 16 al fin de mes (calendario local). */
export function suggestPeriodLabel(at: Date = new Date()): string {
  const day = at.getDate();
  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  const month = monthNames[at.getMonth()];
  const year = at.getFullYear();
  const half = day <= 15 ? 1 : 2;
  return `Quincena ${half} — ${month} ${year}`;
}

export function suggestPeriodSub(at: Date = new Date()): string {
  const day = at.getDate();
  const monthNames = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic",
  ];
  const month = monthNames[at.getMonth()];
  if (day <= 15) return `1 — 15 ${month}`;
  const lastDay = new Date(at.getFullYear(), at.getMonth() + 1, 0).getDate();
  return `16 — ${lastDay} ${month}`;
}
