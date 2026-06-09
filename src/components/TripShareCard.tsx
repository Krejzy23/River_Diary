import {
  CalendarDays,
  Clock3,
  Droplets,
  Gauge,
  MapPinned,
  Sailboat,
  Users,
} from "lucide-react-native";
import { ReactNode, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import Rope from "../../assets/svg/rope.svg";
import Waves from "../../assets/svg/vawes.svg";
import { RiverTrip, RouteCoordinate } from "../types/trip";
import { formatDuration, formatTripRange } from "../utils/date";
import { formatRouteDistance } from "../utils/geo";
import {
  formatWaterConditionSummary,
  formatWaterGaugeName,
  hasWaterCondition,
} from "../utils/waterCondition";

type TripShareCardProps = {
  mapSnapshotUri?: string | null;
  trip: RiverTrip;
};

const CARD_WIDTH = 360;
const ROUTE_WIDTH = 284;
const ROUTE_HEIGHT = 112;

function ShareStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-lg border border-river-100 bg-white/90 px-3 py-2.5">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[10px] font-black uppercase text-ink-500">
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className="mt-1.5 text-[15px] font-black text-ink-900"
      >
        {value}
      </Text>
    </View>
  );
}

function ShareInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-2 rounded-lg bg-river-50 px-3 py-2.5">
      <View className="mt-0.5">{icon}</View>
      <View className="min-w-0 flex-1">
        <Text className="text-[10px] font-black uppercase text-ink-500">
          {label}
        </Text>
        <Text
          numberOfLines={2}
          className="mt-0.5 text-[13px] font-extrabold leading-[18px] text-ink-900"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function createRoutePath(coordinates: RouteCoordinate[]) {
  if (coordinates.length < 2) {
    return "M24 76 C64 24 108 106 150 54 C194 0 232 95 260 36";
  }

  const latitudes = coordinates.map((coordinate) => coordinate.latitude);
  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const lonRange = Math.max(maxLon - minLon, 0.0001);
  const padding = 18;
  const width = ROUTE_WIDTH - padding * 2;
  const height = ROUTE_HEIGHT - padding * 2;

  return coordinates
    .map((coordinate, index) => {
      const x = padding + ((coordinate.longitude - minLon) / lonRange) * width;
      const y =
        padding + (1 - (coordinate.latitude - minLat) / latRange) * height;
      return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    })
    .join(" ");
}

function getRoutePoint(coordinates: RouteCoordinate[], index: number) {
  if (coordinates.length < 2) {
    return null;
  }

  const latitudes = coordinates.map((coordinate) => coordinate.latitude);
  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const lonRange = Math.max(maxLon - minLon, 0.0001);
  const padding = 18;
  const width = ROUTE_WIDTH - padding * 2;
  const height = ROUTE_HEIGHT - padding * 2;
  const coordinate = coordinates[index];

  return {
    x: padding + ((coordinate.longitude - minLon) / lonRange) * width,
    y: padding + (1 - (coordinate.latitude - minLat) / latRange) * height,
  };
}

export function TripShareCard({ mapSnapshotUri, trip }: TripShareCardProps) {
  const coordinates = trip.routeCoordinates ?? [];
  const hasRoute = coordinates.length >= 2;
  const routePath = useMemo(() => createRoutePath(coordinates), [coordinates]);
  const startPoint = getRoutePoint(coordinates, 0);
  const finishPoint = getRoutePoint(coordinates, coordinates.length - 1);
  const routeDistance = hasRoute
    ? formatRouteDistance(coordinates)
    : trip.distanceKm.toFixed(1);
  const hasWaterSnapshot = hasWaterCondition(trip.waterCondition);

  return (
    <View
      style={styles.card}
      className="overflow-hidden rounded-lg border border-river-100 bg-white"
    >
      <View className="absolute inset-0 opacity-95" pointerEvents="none">
        <Rope height="100%" preserveAspectRatio="none" width="100%" />
      </View>

      <View className="relative z-10 p-3">
        <View className="rounded-lg bg-ink-900 px-4 py-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-river-700">
              <Waves color="#FFFFFF" height={40} width={40} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-black uppercase text-river-100">
                River Diary
              </Text>
              <Text
                numberOfLines={1}
                className="mt-1 text-[29px] font-black leading-[34px] text-white"
              >
                {trip.river}
              </Text>
              <Text
                numberOfLines={2}
                className="mt-1 text-[14px] font-bold leading-[19px] text-river-100"
              >
                {trip.from} - {trip.to}
              </Text>
            </View>
            <View className="rounded-lg bg-sun-100 px-3 py-2">
              <Text className="text-[13px] font-black text-sun-800">
                {trip.difficulty}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 rounded-lg border border-river-100 bg-river-50 p-3">
          <View className="flex-row items-end justify-between gap-3">
            <View>
              <Text className="text-[11px] font-black uppercase text-ink-500">
                Kilometráž
              </Text>
              <View className="mt-1 flex-row items-end gap-1">
                <Text className="text-[52px] font-black leading-[56px] text-ink-900">
                  {trip.distanceKm.toFixed(1)}
                </Text>
                <Text className="pb-2 text-[18px] font-black text-ink-600">
                  km
                </Text>
              </View>
            </View>
            <View className="items-end pb-2">
              <Text className="text-[11px] font-black uppercase text-ink-500">
                Trasa v mapě
              </Text>
              <Text className="mt-1 text-[18px] font-black text-river-800">
                {hasRoute ? routeDistance + " km" : "bez mapy"}
              </Text>
            </View>
          </View>

          <View className="mt-2 items-center overflow-hidden rounded-lg bg-white">
            <View style={styles.routeMapShell}>
              {mapSnapshotUri ? (
                <>
                  <Image
                    resizeMode="cover"
                    source={{ uri: mapSnapshotUri }}
                    style={styles.routeMapImage}
                  />
                  <View style={styles.routeMapWash} />
                </>
              ) : (
                <Svg
                  height={ROUTE_HEIGHT}
                  style={styles.routeOverlay}
                  width={ROUTE_WIDTH}
                  viewBox={"0 0 " + ROUTE_WIDTH + " " + ROUTE_HEIGHT}
                >
                  <Path
                    d="M0 92 C62 52 78 124 140 75 C199 28 223 69 284 28"
                    fill="none"
                    opacity={0.2}
                    stroke="#94A3B8"
                    strokeLinecap="round"
                    strokeWidth={14}
                  />
                  <Path
                    d={routePath}
                    fill="none"
                    stroke="#083344"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={9}
                    opacity={0.35}
                  />
                  <Path
                    d={routePath}
                    fill="none"
                    stroke="#0EA5C6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={5}
                  />
                  {startPoint ? (
                    <Circle
                      cx={startPoint.x}
                      cy={startPoint.y}
                      fill="#2D6A4F"
                      r={6}
                      stroke="#FFFFFF"
                      strokeWidth={3}
                    />
                  ) : null}
                  {finishPoint ? (
                    <Circle
                      cx={finishPoint.x}
                      cy={finishPoint.y}
                      fill="#BE123C"
                      r={6}
                      stroke="#FFFFFF"
                      strokeWidth={3}
                    />
                  ) : null}
                </Svg>
              )}
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row gap-2">
          <ShareStat
            icon={<Sailboat color="#1D6E86" size={16} strokeWidth={2.6} />}
            label="Loď"
            value={trip.boatType}
          />
          <ShareStat
            icon={<Clock3 color="#1D6E86" size={16} strokeWidth={2.6} />}
            label="Doba"
            value={formatDuration(trip.startedAt, trip.endedAt)}
          />
        </View>

        <View className="mt-2 flex-row gap-2">
          <ShareStat
            icon={<Gauge color="#1D6E86" size={16} strokeWidth={2.6} />}
            label="Obtížnost"
            value={trip.difficulty}
          />
          <ShareStat
            icon={<MapPinned color="#1D6E86" size={16} strokeWidth={2.6} />}
            label="Body"
            value={hasRoute ? String(coordinates.length) : "-"}
          />
        </View>

        <View className="mt-3 gap-2 rounded-lg border border-river-100 bg-white p-3">
          <ShareInfo
            icon={<CalendarDays color="#1D6E86" size={17} strokeWidth={2.5} />}
            label="Datum sjezdu"
            value={formatTripRange(trip.startedAt, trip.endedAt)}
          />
          <ShareInfo
            icon={<Users color="#1D6E86" size={17} strokeWidth={2.5} />}
            label="Posádka"
            value={trip.crew.join(", ")}
          />
          {hasWaterSnapshot ? (
            <ShareInfo
              icon={<Droplets color="#1D6E86" size={17} strokeWidth={2.5} />}
              label="Vodní stav"
              value={
                formatWaterGaugeName(trip.waterCondition) +
                " - " +
                formatWaterConditionSummary(trip.waterCondition)
              }
            />
          ) : null}
        </View>

        {trip.notes?.trim() ? (
          <View className="mt-3 rounded-lg border border-sun-200 bg-sun-100 px-3 py-2.5">
            <Text className="text-[10px] font-black uppercase text-sun-800">
              Poznámka
            </Text>
            <Text
              numberOfLines={3}
              className="mt-1 text-[13px] font-extrabold leading-[18px] text-sun-800"
            >
              {trip.notes.trim()}
            </Text>
          </View>
        ) : null}

        <View className="mt-3 items-center rounded-lg bg-ink-900 px-3 py-2.5">
          <Text className="text-[10px] font-black uppercase text-river-100">
            Vodácký deník - River Diary
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  routeMapShell: {
    backgroundColor: "#FFFFFF",
    height: ROUTE_HEIGHT,
    overflow: "hidden",
    position: "relative",
    width: ROUTE_WIDTH,
  },
  routeMapImage: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  routeMapWash: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  routeOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
