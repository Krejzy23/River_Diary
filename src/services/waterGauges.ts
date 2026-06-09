import {
  RouteCoordinate,
  WaterCondition,
  WaterConditionStatus,
} from "../types/trip";
import { getDistanceKm } from "../utils/geo";
import { getWaterConditionStatusLabel } from "../utils/waterCondition";

const CHMI_NOW_METADATA_URL =
  "https://opendata.chmi.cz/hydrology/now/metadata/meta1.json";
const CHMI_NOW_DATA_URL = "https://opendata.chmi.cz/hydrology/now/data/";
const CHMI_RECENT_DATA_URL = "https://opendata.chmi.cz/hydrology/recent/data/";
const CHMI_HISTORICAL_DAILY_DATA_URL =
  "https://opendata.chmi.cz/hydrology/historical/data/daily/";
const CHMI_SOURCE = "ČHMÚ open data";
const DEFAULT_MAX_DISTANCE_KM = 15;
const SAME_STREAM_MAX_DISTANCE_KM = 35;
const MAX_CANDIDATES = 3;

type WaterGaugeStation = {
  dryFlowM3s?: number;
  dryLevelCm?: number;
  floodFlowM3s?: number;
  floodLevelCm?: number;
  gaugeId: string;
  highFlowM3s?: number;
  highLevelCm?: number;
  latitude: number;
  longitude: number;
  stationName: string;
  streamName: string;
};

export type WaterGaugeCandidate = {
  distanceKm: number;
  flowM3s?: number;
  gaugeId: string;
  latitude: number;
  levelCm?: number;
  longitude: number;
  measuredAt?: string;
  source: string;
  sourceUrl: string;
  stationName: string;
  status: WaterConditionStatus;
  statusLabel: string;
  streamName: string;
};

type TableResponse = {
  data?: {
    data?: {
      header?: string;
      values?: unknown[][];
    };
  };
};

type MeasurementSnapshot = {
  flowM3s?: number;
  levelCm?: number;
  measuredAt?: string;
  sourceUrl?: string;
};

type CurrentMeasurementResponse = {
  objList?: Array<{
    objID?: string;
    tsList?: Array<{
      tsConID?: string;
      tsData?: Array<{ dt?: string; value?: number | null }>;
      unit?: string;
    }>;
  }>;
};

type HistoricalDailyMeasurementResponse = {
  objID?: string;
  tsList?: Array<{
    tsConID?: string;
    tsData?: {
      data?: {
        header?: string;
        values?: unknown[][];
      };
      type?: string;
    };
    unit?: string;
  }>;
};

let stationCache: WaterGaugeStation[] | null = null;
let stationPromise: Promise<WaterGaugeStation[]> | null = null;

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error("ČHMÚ vrátilo HTTP " + response.status + ".");
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isSameStream(stationStream: string, riverName?: string) {
  const normalizedRiver = normalizeName(riverName ?? "");
  const normalizedStream = normalizeName(stationStream);

  return Boolean(
    normalizedRiver &&
    normalizedStream &&
    (normalizedRiver.includes(normalizedStream) ||
      normalizedStream.includes(normalizedRiver)),
  );
}

function createStationRecord(header: string[], row: unknown[]) {
  return header.reduce<Record<string, unknown>>((record, key, index) => {
    record[key] = row[index];
    return record;
  }, {});
}

function createStationFromRecord(
  record: Record<string, unknown>,
): WaterGaugeStation | null {
  const gaugeId = readString(record.objID);
  const stationName = readString(record.STATION_NAME);
  const streamName = readString(record.STREAM_NAME);
  const latitude = readNumber(record.GEOGR1);
  const longitude = readNumber(record.GEOGR2);

  if (
    !gaugeId ||
    !stationName ||
    !streamName ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return null;
  }

  return {
    dryFlowM3s: readNumber(record.DRYQ),
    dryLevelCm: readNumber(record.DRYH),
    floodFlowM3s: readNumber(record.SPA3Q),
    floodLevelCm: readNumber(record.SPA3H),
    gaugeId,
    highFlowM3s: readNumber(record.SPA1Q),
    highLevelCm: readNumber(record.SPA1H),
    latitude,
    longitude,
    stationName,
    streamName,
  };
}

function parseStations(response: TableResponse): WaterGaugeStation[] {
  const header =
    response.data?.data?.header?.split(",").map((key) => key.trim()) ?? [];
  const values = response.data?.data?.values ?? [];

  return values
    .map((row) => createStationFromRecord(createStationRecord(header, row)))
    .filter((station): station is WaterGaugeStation => station !== null);
}

async function fetchStations() {
  if (stationCache) {
    return stationCache;
  }

  stationPromise ??= fetchJson<TableResponse>(CHMI_NOW_METADATA_URL)
    .then((response) => {
      stationCache = parseStations(response);
      return stationCache;
    })
    .catch((error) => {
      stationPromise = null;
      throw error;
    });

  return stationPromise;
}

function getPointToSegmentDistanceKm(
  point: RouteCoordinate,
  start: RouteCoordinate,
  end: RouteCoordinate,
) {
  const averageLatitude =
    ((point.latitude + start.latitude + end.latitude) / 3) * (Math.PI / 180);
  const kmPerLatitudeDegree = 111.32;
  const kmPerLongitudeDegree = Math.max(
    Math.cos(averageLatitude) * kmPerLatitudeDegree,
    0.0001,
  );
  const pointX = point.longitude * kmPerLongitudeDegree;
  const pointY = point.latitude * kmPerLatitudeDegree;
  const startX = start.longitude * kmPerLongitudeDegree;
  const startY = start.latitude * kmPerLatitudeDegree;
  const endX = end.longitude * kmPerLongitudeDegree;
  const endY = end.latitude * kmPerLatitudeDegree;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const segmentLengthSq = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSq === 0) {
    return getDistanceKm(point, start);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
        segmentLengthSq,
    ),
  );
  const projectedX = startX + t * deltaX;
  const projectedY = startY + t * deltaY;

  return Math.sqrt((pointX - projectedX) ** 2 + (pointY - projectedY) ** 2);
}

function getDistanceToRouteKm(
  station: WaterGaugeStation,
  coordinates: RouteCoordinate[],
) {
  const point = { latitude: station.latitude, longitude: station.longitude };

  if (coordinates.length < 2) {
    return coordinates[0]
      ? getDistanceKm(point, coordinates[0])
      : Number.POSITIVE_INFINITY;
  }

  return coordinates.slice(1).reduce((closestDistance, coordinate, index) => {
    const segmentDistance = getPointToSegmentDistanceKm(
      point,
      coordinates[index],
      coordinate,
    );
    return Math.min(closestDistance, segmentDistance);
  }, Number.POSITIVE_INFINITY);
}

function formatChmiDatePrefix(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return String(year) + month + day;
}

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function shouldUseCurrentData(measuredFor: Date) {
  return getLocalDayStart(measuredFor) >= getLocalDayStart(new Date());
}

function getCurrentMeasurementUrl(
  station: WaterGaugeStation,
  measuredFor: Date,
) {
  if (shouldUseCurrentData(measuredFor)) {
    return CHMI_NOW_DATA_URL + station.gaugeId + ".json";
  }

  return (
    CHMI_RECENT_DATA_URL +
    formatChmiDatePrefix(measuredFor) +
    "_" +
    station.gaugeId +
    ".json"
  );
}

function getHistoricalDailyMeasurementUrl(
  station: WaterGaugeStation,
  measuredFor: Date,
) {
  return (
    CHMI_HISTORICAL_DAILY_DATA_URL +
    "H_" +
    station.gaugeId +
    "_DQ_" +
    measuredFor.getFullYear() +
    ".json"
  );
}

function getClosestCurrentMeasurement(
  response: CurrentMeasurementResponse,
  tsConID: "H" | "Q",
  measuredFor: Date,
) {
  const series = response.objList?.[0]?.tsList?.find(
    (item) => item.tsConID === tsConID,
  );
  const values = (series?.tsData ?? []).filter(
    (item) =>
      typeof item.value === "number" &&
      Number.isFinite(item.value) &&
      typeof item.dt === "string",
  );

  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((closest, item) => {
    const closestDistance = Math.abs(
      new Date(closest.dt ?? "").getTime() - measuredFor.getTime(),
    );
    const itemDistance = Math.abs(
      new Date(item.dt ?? "").getTime() - measuredFor.getTime(),
    );

    return itemDistance < closestDistance ? item : closest;
  });
}

function getHistoricalDailyMeasurement(
  response: HistoricalDailyMeasurementResponse,
  tsConID: "HD" | "QD",
  measuredFor: Date,
) {
  const series = response.tsList?.find((item) => item.tsConID === tsConID);
  const values = series?.tsData?.data?.values ?? [];
  const targetDateKey = formatChmiDatePrefix(measuredFor);

  const row = values.find((item) => {
    const measuredAt = readString(item[0]);

    return measuredAt
      ? formatChmiDatePrefix(new Date(measuredAt)) === targetDateKey
      : false;
  });

  if (!row) {
    return undefined;
  }

  const measuredAt = readString(row[0]);
  const value = readNumber(row[1]);

  return measuredAt && value !== undefined ? { measuredAt, value } : undefined;
}

async function fetchCurrentMeasurementsForDate(
  station: WaterGaugeStation,
  measuredFor: Date,
): Promise<MeasurementSnapshot> {
  const sourceUrl = getCurrentMeasurementUrl(station, measuredFor);
  const response = await fetchJson<CurrentMeasurementResponse>(sourceUrl);
  const level = getClosestCurrentMeasurement(response, "H", measuredFor);
  const flow = getClosestCurrentMeasurement(response, "Q", measuredFor);

  return {
    flowM3s: flow?.value ?? undefined,
    levelCm: level?.value ?? undefined,
    measuredAt: level?.dt ?? flow?.dt,
    sourceUrl,
  };
}

async function fetchHistoricalDailyMeasurementsForDate(
  station: WaterGaugeStation,
  measuredFor: Date,
): Promise<MeasurementSnapshot> {
  const sourceUrl = getHistoricalDailyMeasurementUrl(station, measuredFor);
  const response =
    await fetchJson<HistoricalDailyMeasurementResponse>(sourceUrl);
  const level = getHistoricalDailyMeasurement(response, "HD", measuredFor);
  const flow = getHistoricalDailyMeasurement(response, "QD", measuredFor);

  return {
    flowM3s: flow?.value,
    levelCm: level?.value,
    measuredAt: level?.measuredAt ?? flow?.measuredAt,
    sourceUrl,
  };
}

async function fetchMeasurementsForDate(
  station: WaterGaugeStation,
  measuredFor: Date,
): Promise<MeasurementSnapshot> {
  if (shouldUseCurrentData(measuredFor)) {
    return fetchCurrentMeasurementsForDate(station, measuredFor);
  }

  try {
    return await fetchCurrentMeasurementsForDate(station, measuredFor);
  } catch {
    return fetchHistoricalDailyMeasurementsForDate(station, measuredFor);
  }
}

function resolveWaterStatus(
  station: WaterGaugeStation,
  levelCm?: number,
  flowM3s?: number,
): WaterConditionStatus {
  if (levelCm !== undefined) {
    if (station.floodLevelCm !== undefined && levelCm >= station.floodLevelCm) {
      return "flood";
    }

    if (station.highLevelCm !== undefined && levelCm >= station.highLevelCm) {
      return "high";
    }

    if (station.dryLevelCm !== undefined && levelCm <= station.dryLevelCm) {
      return "dry";
    }

    if (
      station.dryLevelCm !== undefined &&
      levelCm <= station.dryLevelCm * 1.15
    ) {
      return "low";
    }

    return "good";
  }

  if (flowM3s !== undefined) {
    if (station.floodFlowM3s !== undefined && flowM3s >= station.floodFlowM3s) {
      return "flood";
    }

    if (station.highFlowM3s !== undefined && flowM3s >= station.highFlowM3s) {
      return "high";
    }

    if (station.dryFlowM3s !== undefined && flowM3s <= station.dryFlowM3s) {
      return "dry";
    }

    if (
      station.dryFlowM3s !== undefined &&
      flowM3s <= station.dryFlowM3s * 1.15
    ) {
      return "low";
    }

    return "good";
  }

  return "unknown";
}

export function waterGaugeCandidateToCondition(
  candidate: WaterGaugeCandidate,
): WaterCondition {
  return {
    distanceKm: candidate.distanceKm,
    flowM3s: candidate.flowM3s,
    gaugeId: candidate.gaugeId,
    latitude: candidate.latitude,
    levelCm: candidate.levelCm,
    longitude: candidate.longitude,
    measuredAt: candidate.measuredAt,
    source: candidate.source,
    sourceUrl: candidate.sourceUrl,
    stationName: candidate.stationName,
    status: candidate.status,
    statusLabel: candidate.statusLabel,
    streamName: candidate.streamName,
    updatedAt: new Date().toISOString(),
  };
}

export async function findWaterGaugesForRoute({
  coordinates,
  measuredFor,
  riverName,
}: {
  coordinates: RouteCoordinate[];
  measuredFor?: Date;
  riverName?: string;
}) {
  if (coordinates.length < 2) {
    return [];
  }

  const targetDate = measuredFor ?? new Date();
  const stations = await fetchStations();
  const closestStations = stations
    .map((station) => {
      const distanceKm = getDistanceToRouteKm(station, coordinates);
      const sameStream = isSameStream(station.streamName, riverName);
      return {
        distanceKm,
        matchScore: distanceKm - (sameStream ? 8 : 0),
        sameStream,
        station,
      };
    })
    .filter(
      (item) =>
        item.distanceKm <=
        (item.sameStream
          ? SAME_STREAM_MAX_DISTANCE_KM
          : DEFAULT_MAX_DISTANCE_KM),
    )
    .sort((a, b) => a.matchScore - b.matchScore)
    .slice(0, MAX_CANDIDATES);

  const candidates = await Promise.all(
    closestStations.map(async ({ distanceKm, station }) => {
      const measurement = await fetchMeasurementsForDate(
        station,
        targetDate,
      ).catch(() => ({
        flowM3s: undefined,
        levelCm: undefined,
        measuredAt: undefined,
        sourceUrl: undefined,
      }));
      const status = resolveWaterStatus(
        station,
        measurement.levelCm,
        measurement.flowM3s,
      );

      return {
        distanceKm,
        flowM3s: measurement.flowM3s,
        gaugeId: station.gaugeId,
        latitude: station.latitude,
        levelCm: measurement.levelCm,
        longitude: station.longitude,
        measuredAt: measurement.measuredAt,
        source: CHMI_SOURCE,
        sourceUrl: measurement.sourceUrl ?? CHMI_NOW_METADATA_URL,
        stationName: station.stationName,
        status,
        statusLabel: getWaterConditionStatusLabel(status),
        streamName: station.streamName,
      } satisfies WaterGaugeCandidate;
    }),
  );

  return candidates;
}
