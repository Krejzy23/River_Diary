import { MapPinned } from "lucide-react-native";
import {
  ComponentType,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";

import { openTopoMapStyle } from "../config/mapStyle";
import { RouteCoordinate } from "../types/trip";
import {
  formatRouteDistance,
  getRouteBounds,
  getRouteCenter,
  toLngLat,
} from "../utils/geo";

type MapLibreModule = {
  Camera: ComponentType<any>;
  GeoJSONSource: ComponentType<any>;
  Layer: ComponentType<any>;
  Map: ComponentType<any>;
};

type TripRoutePreviewProps = {
  coordinates?: RouteCoordinate[];
};

export type TripRoutePreviewHandle = {
  createSnapshot: () => Promise<string | null>;
  isSnapshotReady: () => boolean;
};

type MapSnapshotRef = {
  createStaticMapImage?: (options: {
    output: "base64" | "file";
  }) => Promise<string>;
};

const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];

function loadMapLibre(): MapLibreModule | null {
  try {
    return require("@maplibre/maplibre-react-native") as MapLibreModule;
  } catch {
    return null;
  }
}

function createLineData(coordinates: RouteCoordinate[]) {
  return {
    type: "FeatureCollection",
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates.map(toLngLat),
              },
            },
          ]
        : [],
  };
}

function createPointData(coordinates: RouteCoordinate[]) {
  return {
    type: "FeatureCollection",
    features: coordinates.map((coordinate, index) => ({
      type: "Feature",
      properties: {
        kind:
          index === 0
            ? "start"
            : index === coordinates.length - 1
              ? "finish"
              : "waypoint",
      },
      geometry: {
        type: "Point",
        coordinates: toLngLat(coordinate),
      },
    })),
  };
}

export const TripRoutePreview = forwardRef<
  TripRoutePreviewHandle,
  TripRoutePreviewProps
>(function TripRoutePreview({ coordinates }, ref) {
  const safeCoordinates = coordinates ?? [];
  const mapLibre = useMemo(loadMapLibre, []);
  const mapRef = useRef<MapSnapshotRef | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const lineData = useMemo(
    () => createLineData(safeCoordinates),
    [safeCoordinates],
  );
  const pointData = useMemo(
    () => createPointData(safeCoordinates),
    [safeCoordinates],
  );
  const bounds = getRouteBounds(safeCoordinates);
  const center = getRouteCenter(safeCoordinates, DEFAULT_CENTER);
  const Map = mapLibre?.Map;
  const Camera = mapLibre?.Camera;
  const GeoJSONSource = mapLibre?.GeoJSONSource;
  const Layer = mapLibre?.Layer;

  useEffect(() => {
    setIsMapReady(false);
  }, [safeCoordinates]);

  useImperativeHandle(
    ref,
    () => ({
      createSnapshot: async () => {
        if (
          !isMapReady ||
          safeCoordinates.length < 2 ||
          !mapRef.current?.createStaticMapImage
        ) {
          return null;
        }

        try {
          return await mapRef.current.createStaticMapImage({ output: "file" });
        } catch {
          return null;
        }
      },
      isSnapshotReady: () => isMapReady,
    }),
    [isMapReady, safeCoordinates.length],
  );

  return (
    <View className="overflow-hidden rounded-lg border border-river-100 bg-white">
      <View className="flex-row items-center justify-between gap-3 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
            <MapPinned color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-lg font-black text-ink-900">Mapa trasy</Text>
            <Text className="text-sm font-semibold text-ink-600">
              {safeCoordinates.length >= 2
                ? safeCoordinates.length +
                  " bodů - " +
                  formatRouteDistance(safeCoordinates) +
                  " km"
                : "Trasa zatím není zakreslená"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mapShell}>
        {safeCoordinates.length >= 2 &&
        Map &&
        Camera &&
        GeoJSONSource &&
        Layer ? (
          <Map
            ref={mapRef}
            attribution
            compass={false}
            mapStyle={openTopoMapStyle}
            onDidFinishRenderingMapFully={() => setIsMapReady(true)}
            scaleBar={false}
            style={styles.map}
            touchPitch={false}
            touchRotate={false}
          >
            <Camera
              initialViewState={
                bounds
                  ? {
                      bounds,
                      padding: { bottom: 48, left: 32, right: 32, top: 48 },
                    }
                  : { center, zoom: 11 }
              }
            />
            <GeoJSONSource
              data={lineData as never}
              id="trip-preview-line-source"
            >
              <Layer
                id="trip-preview-line-outline"
                type="line"
                paint={{
                  "line-color": "#083344",
                  "line-opacity": 0.62,
                  "line-width": 8,
                  "line-cap": "round",
                  "line-join": "round",
                }}
              />
              <Layer
                id="trip-preview-line-main"
                type="line"
                paint={{
                  "line-color": "#0EA5C6",
                  "line-opacity": 0.98,
                  "line-width": 4,
                  "line-cap": "round",
                  "line-join": "round",
                }}
              />
            </GeoJSONSource>
            <GeoJSONSource
              data={pointData as never}
              id="trip-preview-point-source"
            >
              <Layer
                id="trip-preview-points"
                type="circle"
                paint={{
                  "circle-color": [
                    "match",
                    ["get", "kind"],
                    "start",
                    "#2D6A4F",
                    "finish",
                    "#BE123C",
                    "#F5B942",
                  ],
                  "circle-radius": [
                    "match",
                    ["get", "kind"],
                    "waypoint",
                    1.4,
                    6,
                  ],
                  "circle-stroke-color": "#FFFFFF",
                  "circle-stroke-width": [
                    "match",
                    ["get", "kind"],
                    "waypoint",
                    0.8,
                    3,
                  ],
                }}
              />
            </GeoJSONSource>
          </Map>
        ) : (
          <View className="flex-1 items-center justify-center bg-river-50 px-5">
            <Text className="text-center text-sm font-bold leading-5 text-ink-600">
              {safeCoordinates.length >= 2
                ? "MapLibre bude vidět po novém Android dev buildu."
                : "V editaci nebo novém výletu můžeš trasu nakreslit tapáním do mapy."}
            </Text>
          </View>
        )}

        {safeCoordinates.length >= 2 ? (
          <View className="absolute bottom-3 left-3 flex-row gap-2 rounded-lg bg-white/95 px-3 py-2">
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-full bg-reed-700" />
              <Text className="text-xs font-black text-ink-900">Start</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#BE123C" }}
              />
              <Text className="text-xs font-black text-ink-900">Cíl</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  mapShell: {
    backgroundColor: "#D6EDEA",
    height: 230,
    position: "relative",
  },
  map: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
