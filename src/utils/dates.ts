export function formatMonthRange(id: string): string {
  const [yearStr, monthStr] = id.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || isNaN(monthIndex)) return id;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  return `${startDay}.${startMonth}-${endDay}.${endMonth}.${year}`;
}

export function formatMonthDate(id: string): string {
  const [yearStr, monthStr] = id.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || isNaN(monthIndex)) return id;
  const date = new Date(year, monthIndex, 1);
const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${year}`;
}