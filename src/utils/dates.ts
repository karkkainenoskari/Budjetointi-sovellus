export function formatMonthRange(id: string): string {
  const [yearStr, monthStr] = id.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || isNaN(monthIndex)) return id;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const startDay = start.getDate();
  const startMonth = start.getMonth() + 1;
  const endDay = end.getDate();
  const endMonth = end.getMonth() + 1;
  return `${startDay}.${startMonth}-${endDay}.${endMonth}.${year}`;
}