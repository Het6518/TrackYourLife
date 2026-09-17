export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "2-digit",
  }).format(date);
}

export function shortDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "2-digit",
  }).format(date);
}

export function monthName(index) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2026, index, 1));
}

export function dayToIso(date) {
  return date.toISOString().slice(0, 10);
}

export function scoreLevel(score) {
  if (!score) return 0;
  return Math.max(1, Math.min(10, Number(score)));
}

export function scoreTone(score) {
  if (!score) return "empty";
  if (score <= 2) return "terrible";
  if (score <= 4) return "bad";
  if (score <= 6) return "okay";
  if (score <= 8) return "good";
  return "great";
}

export function buildYearMonths(year) {
  return Array.from({ length: 12 }, (_, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const cells = [];
    const leading = first.getDay();

    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= last.getDate(); day += 1) {
      cells.push(dayToIso(new Date(year, month, day)));
    }
    return { month, cells };
  });
}

export function averageScore(days) {
  if (!days.length) return "0.0";
  return (days.reduce((sum, day) => sum + Number(day.score), 0) / days.length).toFixed(1);
}

export function bestStreak(days) {
  const dates = new Set(days.map((day) => day.date));
  let best = 0;
  let current = 0;
  const sorted = [...dates].sort();
  let previous = null;

  sorted.forEach((iso) => {
    const date = new Date(`${iso}T00:00:00`);
    if (previous) {
      const diff = (date - previous) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    previous = date;
  });

  return best;
}
