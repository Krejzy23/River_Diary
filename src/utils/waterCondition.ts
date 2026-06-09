import { WaterCondition, WaterConditionStatus } from "../types/trip";

const statusLabels: Record<WaterConditionStatus, string> = {
  dry: "sucho",
  flood: "povodňová voda",
  good: "dobrá voda",
  high: "vyšší voda",
  low: "nízká voda",
  unknown: "neznámý stav",
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readStatus(value: unknown): WaterConditionStatus | undefined {
  return value === "dry" ||
    value === "flood" ||
    value === "good" ||
    value === "high" ||
    value === "low" ||
    value === "unknown"
    ? value
    : undefined;
}

export function getWaterConditionStatusLabel(
  status?: WaterConditionStatus,
  fallback?: string,
) {
  if (fallback?.trim()) {
    return fallback.trim();
  }

  return statusLabels[status ?? "unknown"];
}

export function hasWaterCondition(condition?: WaterCondition) {
  return Boolean(
    condition?.stationName ||
    condition?.streamName ||
    typeof condition?.levelCm === "number" ||
    typeof condition?.flowM3s === "number" ||
    condition?.note,
  );
}

export function normalizeWaterCondition(
  value: unknown,
): WaterCondition | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<WaterCondition>;
  const condition: WaterCondition = {
    distanceKm: readNumber(candidate.distanceKm),
    flowM3s: readNumber(candidate.flowM3s),
    gaugeId: readString(candidate.gaugeId),
    latitude: readNumber(candidate.latitude),
    levelCm: readNumber(candidate.levelCm),
    longitude: readNumber(candidate.longitude),
    measuredAt: readString(candidate.measuredAt),
    note: readString(candidate.note),
    source: readString(candidate.source),
    sourceUrl: readString(candidate.sourceUrl),
    stationName: readString(candidate.stationName),
    status: readStatus(candidate.status),
    statusLabel: readString(candidate.statusLabel),
    streamName: readString(candidate.streamName),
    updatedAt: readString(candidate.updatedAt),
  };

  return hasWaterCondition(condition) ? condition : undefined;
}

export function formatWaterConditionSummary(condition?: WaterCondition) {
  if (!condition) {
    return "Bez záznamu";
  }

  const parts = [
    condition.levelCm !== undefined
      ? condition.levelCm.toFixed(0) + " cm"
      : undefined,
    condition.flowM3s !== undefined
      ? condition.flowM3s.toFixed(2) + " m³/s"
      : undefined,
    getWaterConditionStatusLabel(condition.status, condition.statusLabel),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "Bez měření";
}

export function formatWaterGaugeName(condition?: WaterCondition) {
  if (!condition) {
    return "Vodočet nevybraný";
  }

  return (
    [condition.streamName, condition.stationName].filter(Boolean).join(" - ") ||
    "Vodočet nevybraný"
  );
}
