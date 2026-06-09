const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("cs-CZ", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: Date | string) {
  return timeFormatter.format(new Date(value));
}

export function formatTripRange(startedAt: string, endedAt: string) {
  const started = new Date(startedAt);
  const ended = new Date(endedAt);
  const sameDay = started.toDateString() === ended.toDateString();

  if (sameDay) {
    return `${formatDate(started)} ${formatTime(started)} - ${formatTime(ended)}`;
  }

  return `${formatDateTime(started)} -> ${formatDateTime(ended)}`;
}

export function formatDuration(startedAt: string, endedAt: string) {
  const durationMinutes = Math.max(
    0,
    Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000),
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}
