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


export function generateMonthRange(startId: string, endId: string): string[] {
  const [startY, startM] = startId.split('-').map((x) => parseInt(x, 10));
  const [endY, endM] = endId.split('-').map((x) => parseInt(x, 10));
  if (isNaN(startY) || isNaN(startM) || isNaN(endY) || isNaN(endM)) {
    return [];
  }
  const startDate = new Date(startY, startM - 1, 1);
  const endDate = new Date(endY, endM - 1, 1);
  const months: string[] = [];
  let current = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (current >= startDate) {
    months.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    );
    current.setMonth(current.getMonth() - 1);
  }
  return months;
  }

export function addMonthsToId(id: string, diff: number): string {
  const [yStr, mStr] = id.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  if (isNaN(y) || isNaN(m)) return id;
  const d = new Date(y, m, 1);
  d.setMonth(d.getMonth() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthId(id: string): string {
  return addMonthsToId(id, 1);
}

export function prevMonthId(id: string): string {
  return addMonthsToId(id, -1);
}