import { RouteCoordinate } from "../types/trip";
import { calculateRouteDistanceKm } from "./geo";

function decodeXmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(["'])(.*?)\2/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(tag))) {
    attributes[match[1]] = decodeXmlEntities(match[3]);
  }

  return attributes;
}

function toCoordinate(attributes: Record<string, string>): RouteCoordinate | null {
  const latitude = Number(attributes.lat);
  const longitude = Number(attributes.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function parsePoints(gpx: string, tagName: "trkpt" | "rtept" | "wpt") {
  const points: RouteCoordinate[] = [];
  const pointPattern = new RegExp("<" + tagName + "\\b[^>]*>", "gi");
  let match: RegExpExecArray | null;

  while ((match = pointPattern.exec(gpx))) {
    const coordinate = toCoordinate(parseAttributes(match[0]));

    if (coordinate) {
      points.push(coordinate);
    }
  }

  return points;
}

export function parseGpxCoordinates(gpx: string) {
  const trackPoints = parsePoints(gpx, "trkpt");

  if (trackPoints.length > 0) {
    return trackPoints;
  }

  const routePoints = parsePoints(gpx, "rtept");

  if (routePoints.length > 0) {
    return routePoints;
  }

  return parsePoints(gpx, "wpt");
}

export function createGpxDocument(coordinates: RouteCoordinate[], name = "River Diary route") {
  const safeName = escapeXml(name.trim() || "River Diary route");
  const now = new Date().toISOString();
  const distanceKm = calculateRouteDistanceKm(coordinates).toFixed(2);
  const points = coordinates
    .map(
      (coordinate) =>
        '      <trkpt lat="' +
        coordinate.latitude.toFixed(7) +
        '" lon="' +
        coordinate.longitude.toFixed(7) +
        '" />',
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="River Diary" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <metadata>',
    '    <name>' + safeName + '</name>',
    '    <desc>' + distanceKm + ' km, exported from River Diary</desc>',
    '    <time>' + now + '</time>',
    '  </metadata>',
    '  <trk>',
    '    <name>' + safeName + '</name>',
    '    <trkseg>',
    points,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join("\n");
}

export function createGpxFileName(name = "river-diary-route") {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return (slug || "river-diary-route") + ".gpx";
}
