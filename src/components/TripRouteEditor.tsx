import { Download, RotateCcw, Save, Share2, Trash2, Undo2, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ComponentType, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { openTopoMapStyle } from "../config/mapStyle";
import { maxRouteCoordinateCount, RouteCoordinate } from "../types/trip";
import { formatRouteDistance, getRouteBounds, getRouteCenter, toLngLat } from "../utils/geo";
import { createGpxDocument, createGpxFileName, parseGpxCoordinates } from "../utils/gpx";

type MapLibreModule = {
  Camera: ComponentType<any>;
  GeoJSONSource: ComponentType<any>;
  Layer: ComponentType<any>;
  Map: ComponentType<any>;
};

type TripRouteEditorProps = {
  exportName?: string;
  initialCoordinates?: RouteCoordinate[];
  onCancel: () => void;
  onSave: (coordinates: RouteCoordinate[]) => void;
  visible: boolean;
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
        kind: index === 0 ? "start" : index === coordinates.length - 1 ? "finish" : "waypoint",
      },
      geometry: {
        type: "Point",
        coordinates: toLngLat(coordinate),
      },
    })),
  };
}

export function TripRouteEditor({ exportName, initialCoordinates, onCancel, onSave, visible }: TripRouteEditorProps) {
  const [draftCoordinates, setDraftCoordinates] = useState<RouteCoordinate[]>(initialCoordinates ?? []);
  const mapLibre = useMemo(loadMapLibre, []);

  useEffect(() => {
    if (visible) {
      setDraftCoordinates(initialCoordinates ?? []);
    }
  }, [initialCoordinates, visible]);

  const lineData = useMemo(() => createLineData(draftCoordinates), [draftCoordinates]);
  const pointData = useMemo(() => createPointData(draftCoordinates), [draftCoordinates]);
  const bounds = getRouteBounds(draftCoordinates);
  const center = getRouteCenter(draftCoordinates, DEFAULT_CENTER);
  const routeDistance = formatRouteDistance(draftCoordinates);

  const handleUndo = () => {
    setDraftCoordinates((current) => current.slice(0, -1));
  };

  const handleClear = () => {
    setDraftCoordinates([]);
  };

  const handleSave = () => {
    onSave(draftCoordinates);
  };

  const handleMapPress = (event: { nativeEvent?: { lngLat?: [number, number] } }) => {
    const lngLat = event.nativeEvent?.lngLat;

    if (!lngLat) {
      return;
    }

    if (draftCoordinates.length >= maxRouteCoordinateCount) {
      Alert.alert(
        "Limit trasy",
        "Trasa může mít nejvýš " +
          maxRouteCoordinateCount +
          " bodů, aby šla uložit do Firebase.",
      );
      return;
    }

    setDraftCoordinates((current) => [
      ...current,
      {
        latitude: lngLat[1],
        longitude: lngLat[0],
      },
    ]);
  };

  const applyImportedCoordinates = (coordinates: RouteCoordinate[], mode: "append" | "replace") => {
    setDraftCoordinates((current) => {
      const nextCoordinates = mode === "append" ? [...current, ...coordinates] : coordinates;
      return nextCoordinates.slice(0, maxRouteCoordinateCount);
    });
  };

  const handleImportGpx = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ["application/gpx+xml", "application/xml", "text/xml", "*/*"],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const importedCoordinates = parseGpxCoordinates(fileContent);

      if (importedCoordinates.length < 2) {
        Alert.alert("GPX bez trasy", "Soubor neobsahuje dostatek bodů pro trasu.");
        return;
      }

      const limitedCoordinates = importedCoordinates.slice(0, maxRouteCoordinateCount);
      const limitMessage =
        importedCoordinates.length > maxRouteCoordinateCount
          ? " Importuji prvních " + maxRouteCoordinateCount + " bodů, aby šla trasa bezpečně uložit do databáze."
          : "";

      if (draftCoordinates.length > 0) {
        Alert.alert(
          "Import GPX",
          "Soubor obsahuje " + importedCoordinates.length + " bodů." + limitMessage,
          [
            { text: "Zrušit", style: "cancel" },
            { text: "Přidat", onPress: () => applyImportedCoordinates(limitedCoordinates, "append") },
            { text: "Nahradit", style: "destructive", onPress: () => applyImportedCoordinates(limitedCoordinates, "replace") },
          ],
        );
        return;
      }

      applyImportedCoordinates(limitedCoordinates, "replace");

      if (limitMessage) {
        Alert.alert("GPX zkráceno", limitMessage.trim());
      }
    } catch {
      Alert.alert("Import selhal", "GPX soubor se nepodařilo načíst.");
    }
  };

  const handleExportGpx = async () => {
    if (draftCoordinates.length < 2) {
      Alert.alert("Není co exportovat", "Pro export GPX potřebuješ aspoň start a cíl.");
      return;
    }

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Export není dostupný", "Sdílení souborů není na tomhle zařízení dostupné.");
        return;
      }

      const exportDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

      if (!exportDirectory) {
        Alert.alert("Export selhal", "Aplikace nemá dostupný adresář pro dočasný GPX soubor.");
        return;
      }

      const fileName = createGpxFileName(exportName);
      const fileUri = exportDirectory + fileName;
      const gpx = createGpxDocument(draftCoordinates, exportName);

      await FileSystem.writeAsStringAsync(fileUri, gpx, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Exportovat GPX trasu",
        mimeType: "application/gpx+xml",
        UTI: "public.xml",
      });
    } catch {
      Alert.alert("Export selhal", "GPX soubor se nepodařilo vytvořit nebo sdílet.");
    }
  };

  const Map = mapLibre?.Map;
  const Camera = mapLibre?.Camera;
  const GeoJSONSource = mapLibre?.GeoJSONSource;
  const Layer = mapLibre?.Layer;

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onCancel}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
        <View className="flex-row items-center justify-between gap-3 border-b border-river-100 bg-white px-4 py-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-black text-ink-900">Nakreslit trasu</Text>
            <Text className="text-sm font-semibold text-ink-600">
              {draftCoordinates.length} bodů - {routeDistance} km
            </Text>
          </View>
          <Pressable className="h-10 w-10 items-center justify-center rounded-lg bg-river-50" onPress={onCancel}>
            <X color="#102A43" size={20} strokeWidth={2.6} />
          </Pressable>
        </View>

        <View style={styles.mapArea}>
          {Map && Camera && GeoJSONSource && Layer ? (
            <Map
              attribution
              compass
              mapStyle={openTopoMapStyle}
              onPress={handleMapPress}
              scaleBar
              style={styles.map}
              touchPitch={false}
              touchRotate={false}
            >
              <Camera
                initialViewState={
                  bounds
                    ? { bounds, padding: { bottom: 70, left: 40, right: 40, top: 70 } }
                    : { center, zoom: draftCoordinates.length > 0 ? 11 : 6 }
                }
              />

              <GeoJSONSource data={lineData as never} id="trip-route-line-source">
                <Layer
                  id="trip-route-line-outline"
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
                  id="trip-route-line-main"
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

              <GeoJSONSource data={pointData as never} id="trip-route-point-source">
                <Layer
                  id="trip-route-points"
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
            <View className="items-center justify-center gap-3 px-6" style={styles.placeholder}>
              <View className="rounded-lg bg-white p-5">
                <Text className="text-center text-lg font-black text-ink-900">MapLibre čeká na nový build</Text>
                <Text className="mt-2 text-center text-sm font-semibold leading-5 text-ink-600">
                  Knihovna je nainstalovaná, ale protože je native, musíš znovu sestavit dev build pro Android.
                </Text>
              </View>
            </View>
          )}

          {draftCoordinates.length >= 2 ? (
            <View className="absolute left-3 top-3 flex-row gap-2 rounded-lg bg-white/95 px-3 py-2">
              <View className="flex-row items-center gap-1.5">
                <View className="h-3 w-3 rounded-full bg-reed-700" />
                <Text className="text-xs font-black text-ink-900">Start</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: "#BE123C" }} />
                <Text className="text-xs font-black text-ink-900">Cíl</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="gap-3 border-t border-river-100 bg-white px-4 py-3">
          <Text className="text-center text-xs font-bold uppercase text-ink-500">
            Tapni do mapy pro přidání bodu. První bod je start, poslední cíl.
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-river-700"
              onPress={handleImportGpx}
            >
              <Download color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text className="font-black text-white">Import GPX</Text>
            </Pressable>
            <Pressable
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900"
              onPress={handleExportGpx}
            >
              <Share2 color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text className="font-black text-white">Export GPX</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-river-50"
              disabled={draftCoordinates.length === 0}
              onPress={handleUndo}
            >
              <Undo2 color="#102A43" size={18} strokeWidth={2.5} />
              <Text className="font-black text-ink-900">Zpět</Text>
            </Pressable>
            <Pressable
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-sun-100"
              disabled={draftCoordinates.length === 0}
              onPress={handleClear}
            >
              <Trash2 color="#946200" size={18} strokeWidth={2.5} />
              <Text className="font-black text-sun-800">Vymazat</Text>
            </Pressable>
          </View>
          <Pressable
            className="h-13 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 py-4"
            onPress={handleSave}
          >
            {draftCoordinates.length > 0 ? (
              <Save color="#FFFFFF" size={18} strokeWidth={2.5} />
            ) : (
              <RotateCcw color="#FFFFFF" size={18} strokeWidth={2.5} />
            )}
            <Text className="text-base font-black text-white">
              {draftCoordinates.length > 0 ? "Uložit trasu" : "Uložit bez trasy"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#F3FAFB",
    flex: 1,
  },
  mapArea: {
    backgroundColor: "#D6EDEA",
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  map: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  placeholder: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
