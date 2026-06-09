import {
  Droplets,
  Gauge,
  MapPinned,
  RefreshCw,
  Route,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTrips } from "../context/TripsContext";
import {
  BoatType,
  RiverTrip,
  RiverTripInput,
  RouteCoordinate,
  TripDifficulty,
  WaterCondition,
  boatTypeOptions,
  maxRouteCoordinateCount,
} from "../types/trip";
import {
  findWaterGaugesForRoute,
  WaterGaugeCandidate,
  waterGaugeCandidateToCondition,
} from "../services/waterGauges";
import { getPaddlingDifficultyForGaugeId } from "../services/riverFlows";
import { formatRouteDistance } from "../utils/geo";
import {
  formatWaterConditionSummary,
  formatWaterGaugeName,
  hasWaterCondition,
} from "../utils/waterCondition";
import { DateTimeField } from "./DateTimeField";
import { Field } from "./Field";
import { TripRouteEditor } from "./TripRouteEditor";

type TripFormState = {
  boatType: BoatType;
  crew: string;
  endedAt: Date;
  startedAt: Date;
  difficulty: TripDifficulty;
  distanceKm: string;
  from: string;
  notes: string;
  river: string;
  routeCoordinates?: RouteCoordinate[];
  to: string;
  waterCondition?: WaterCondition;
};

type TripFormProps = {
  initialTrip?: RiverTrip;
  onSaved?: (trip: RiverTrip) => void;
  submitLabel?: string;
};

function createDateAtHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
}

function addHours(value: Date, hours: number) {
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return date;
}

const createInitialForm = (): TripFormState => ({
  boatType: boatTypeOptions[0],
  crew: "",
  difficulty: "WWI",
  distanceKm: "",
  endedAt: createDateAtHour(15),
  from: "",
  notes: "",
  river: "",
  routeCoordinates: undefined,
  startedAt: createDateAtHour(9),
  to: "",
  waterCondition: undefined,
});

function createFormFromTrip(trip: RiverTrip): TripFormState {
  return {
    boatType: trip.boatType,
    crew: trip.crew.join(", "),
    difficulty: trip.difficulty,
    distanceKm: String(trip.distanceKm),
    endedAt: new Date(trip.endedAt),
    from: trip.from,
    notes: trip.notes ?? "",
    river: trip.river,
    routeCoordinates: trip.routeCoordinates,
    startedAt: new Date(trip.startedAt),
    to: trip.to,
    waterCondition: trip.waterCondition,
  };
}

export function TripForm({ initialTrip, onSaved, submitLabel }: TripFormProps) {
  const { isSaving, message, saveTrip, updateTrip } = useTrips();
  const [routeEditorVisible, setRouteEditorVisible] = useState(false);
  const [waterGaugeCandidates, setWaterGaugeCandidates] = useState<
    WaterGaugeCandidate[]
  >([]);
  const [isLoadingWaterGauges, setIsLoadingWaterGauges] = useState(false);
  const [waterGaugeMessage, setWaterGaugeMessage] = useState("");
  const [form, setForm] = useState<TripFormState>(() =>
    initialTrip ? createFormFromTrip(initialTrip) : createInitialForm(),
  );

  const routePointCount = form.routeCoordinates?.length ?? 0;
  const routeDistance = useMemo(
    () =>
      form.routeCoordinates
        ? formatRouteDistance(form.routeCoordinates)
        : "0.0",
    [form.routeCoordinates],
  );

  const updateForm = <Key extends keyof TripFormState>(
    key: Key,
    value: TripFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateStartedAt = (startedAt: Date) => {
    setForm((current) => ({
      ...current,
      endedAt:
        current.endedAt <= startedAt ? addHours(startedAt, 4) : current.endedAt,
      startedAt,
    }));
  };

  const updateEndedAt = (endedAt: Date) => {
    setForm((current) => ({ ...current, endedAt }));
  };

  const handleRouteSave = (coordinates: RouteCoordinate[]) => {
    setForm((current) => {
      const routeCoordinates = coordinates.length > 0 ? coordinates : undefined;
      const measuredDistance = routeCoordinates
        ? formatRouteDistance(routeCoordinates)
        : "";

      return {
        ...current,
        distanceKm: current.distanceKm.trim()
          ? current.distanceKm
          : measuredDistance,
        routeCoordinates,
        waterCondition: undefined,
      };
    });
    setWaterGaugeCandidates([]);
    setWaterGaugeMessage("");
    setRouteEditorVisible(false);
  };

  const applyRouteDistance = () => {
    if (!form.routeCoordinates || form.routeCoordinates.length < 2) {
      return;
    }

    updateForm("distanceKm", routeDistance);
  };

  const selectWaterGaugeCandidate = (candidate: WaterGaugeCandidate) => {
    const note = form.waterCondition?.note;
    const difficulty = getPaddlingDifficultyForGaugeId(candidate.gaugeId);

    setForm((current) => ({
      ...current,
      difficulty: difficulty ?? current.difficulty,
      waterCondition: {
        ...waterGaugeCandidateToCondition(candidate),
        note,
      },
    }));
  };

  const updateWaterConditionNote = (note: string) => {
    setForm((current) => ({
      ...current,
      waterCondition: {
        ...(current.waterCondition ?? {
          source: "Ručně",
          status: "unknown",
          statusLabel: "ručně",
        }),
        note,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const clearWaterCondition = () => {
    setForm((current) => ({ ...current, waterCondition: undefined }));
    setWaterGaugeCandidates([]);
    setWaterGaugeMessage("");
  };

  const handleSuggestWaterGauges = async () => {
    if (!form.routeCoordinates || form.routeCoordinates.length < 2) {
      Alert.alert(
        "Chybí trasa",
        "Nejdřív zakresli nebo importuj mapovou trasu.",
      );
      return;
    }

    setIsLoadingWaterGauges(true);
    setWaterGaugeMessage("Hledám nejbližší vodočty k datu sjezdu...");

    try {
      const candidates = await findWaterGaugesForRoute({
        coordinates: form.routeCoordinates,
        measuredFor: form.startedAt,
        riverName: form.river,
      });

      setWaterGaugeCandidates(candidates);

      if (candidates.length === 0) {
        setWaterGaugeMessage(
          "V okolí trasy se nepodařilo najít vhodný vodočet.",
        );
        return;
      }

      selectWaterGaugeCandidate(candidates[0]);
      setWaterGaugeMessage(
        "Vybral jsem nejbližší vodočet. Když nesedí, zkus jiný návrh níže.",
      );
    } catch {
      setWaterGaugeMessage(
        "Vodočty se nepodařilo načíst. Zkus to prosím znovu.",
      );
    } finally {
      setIsLoadingWaterGauges(false);
    }
  };

  const buildTripPayload = (): RiverTripInput | null => {
    const distanceKm = Number(form.distanceKm.replace(",", "."));
    const crew = form.crew
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);

    if (!form.river.trim() || !form.from.trim() || !form.to.trim()) {
      Alert.alert("Chybí trasa", "Doplň řeku, start a cíl sjezdu.");
      return null;
    }

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      Alert.alert(
        "Chybí kilometráž",
        "Zadej kladnou délku trasy v kilometrech.",
      );
      return null;
    }

    if (crew.length === 0) {
      Alert.alert("Chybí posádka", "Přidej aspoň jednoho člena posádky.");
      return null;
    }

    if (form.endedAt <= form.startedAt) {
      Alert.alert(
        "Chybí konec sjezdu",
        "Konec sjezdu musí být později než začátek.",
      );
      return null;
    }

    if ((form.routeCoordinates?.length ?? 0) > maxRouteCoordinateCount) {
      Alert.alert(
        "Trasa je moc dlouhá",
        "Trasa může mít nejvýš " +
          maxRouteCoordinateCount +
          " bodů, aby šla uložit do Firebase.",
      );
      return null;
    }

    return {
      boatType: form.boatType,
      crew,
      endedAt: form.endedAt.toISOString(),
      difficulty: form.difficulty,
      distanceKm,
      from: form.from.trim(),
      notes: form.notes.trim() || undefined,
      river: form.river.trim(),
      routeCoordinates: form.routeCoordinates,
      startedAt: form.startedAt.toISOString(),
      waterCondition: hasWaterCondition(form.waterCondition)
        ? form.waterCondition
        : undefined,
      to: form.to.trim(),
    };
  };

  const handleSave = async () => {
    const payload = buildTripPayload();

    if (!payload) {
      return;
    }

    try {
      const savedTrip = initialTrip
        ? await updateTrip(initialTrip.id, payload)
        : await saveTrip(payload);

      if (!initialTrip) {
        setForm(createInitialForm());
      }

      onSaved?.(savedTrip);
    } catch {
      Alert.alert(
        initialTrip ? "Úprava selhala" : "Uložení selhalo",
        initialTrip
          ? "Změny se nepodařilo uložit. Zkus to prosím znovu."
          : "Záznam se nepodařilo uložit. Zkus to prosím znovu.",
      );
    }
  };

  return (
    <View className="gap-4 rounded-lg bg-white p-4 shadow-sm shadow-ink-900/5">
      <View className="gap-3">
        <Field
          autoCapitalize="words"
          label="Řeka"
          onChangeText={(value) => updateForm("river", value)}
          placeholder="Sázava"
          value={form.river}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field
              autoCapitalize="words"
              label="Odkud"
              onChangeText={(value) => updateForm("from", value)}
              placeholder="Týn nad Sázavou"
              value={form.from}
            />
          </View>
          <View className="flex-1">
            <Field
              autoCapitalize="words"
              label="Kam"
              onChangeText={(value) => updateForm("to", value)}
              placeholder="Pikovice"
              value={form.to}
            />
          </View>
        </View>
        <Field
          keyboardType="decimal-pad"
          label="Kilometráž"
          onChangeText={(value) => updateForm("distanceKm", value)}
          placeholder="18.5"
          value={form.distanceKm}
        />

        <View className="gap-3 rounded-lg border border-river-100 bg-river-50 p-3">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
              <MapPinned color="#FFFFFF" size={18} strokeWidth={2.5} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-black text-ink-900">
                Mapová trasa
              </Text>
              <Text className="text-sm font-semibold text-ink-600">
                {routePointCount >= 2
                  ? routePointCount + " bodů - " + routeDistance + " km"
                  : routePointCount === 1
                    ? "1 bod - přidej ještě cíl"
                    : "Volitelně zakresli trasu tapáním do mapy"}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-3"
              onPress={() => setRouteEditorVisible(true)}
            >
              <Route color="#FFFFFF" size={17} strokeWidth={2.5} />
              <Text className="font-black text-white">
                {routePointCount > 0 ? "Upravit trasu" : "Nakreslit"}
              </Text>
            </Pressable>
            {routePointCount >= 2 ? (
              <Pressable
                className="h-11 flex-1 items-center justify-center rounded-lg bg-sun-100 px-3"
                onPress={applyRouteDistance}
              >
                <Text className="font-black text-sun-800">Použít km</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="gap-3 rounded-lg border border-river-100 bg-white p-3">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
              <Droplets color="#FFFFFF" size={18} strokeWidth={2.5} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-black text-ink-900">
                Podmínky na vodě
              </Text>
              <Text className="text-sm font-semibold text-ink-600">
                Vodočet podle trasy a data začátku sjezdu
              </Text>
            </View>
          </View>

          {hasWaterCondition(form.waterCondition) ? (
            <View className="gap-2 rounded-lg bg-river-50 p-3">
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-extrabold uppercase text-ink-500">
                    Vybraný vodočet
                  </Text>
                  <Text className="mt-1 text-[15px] font-black leading-[20px] text-ink-900">
                    {formatWaterGaugeName(form.waterCondition)}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-river-800">
                    {formatWaterConditionSummary(form.waterCondition)}
                  </Text>
                  {form.waterCondition?.distanceKm !== undefined ? (
                    <Text className="mt-1 text-xs font-semibold text-ink-500">
                      cca {form.waterCondition.distanceKm.toFixed(1)} km od
                      trasy
                    </Text>
                  ) : null}
                  <View className="mt-2 self-start rounded-lg bg-white px-2.5 py-1">
                    <Text className="text-xs font-black text-river-800">
                      Obtížnost: {form.difficulty}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel="Odebrat vodočet"
                  accessibilityRole="button"
                  className="h-9 w-9 items-center justify-center rounded-lg bg-white"
                  onPress={clearWaterCondition}
                >
                  <Text className="text-lg font-black text-ink-500">×</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <Pressable
              className={
                isLoadingWaterGauges || routePointCount < 2
                  ? "h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-400 px-3"
                  : "h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-3"
              }
              disabled={isLoadingWaterGauges || routePointCount < 2}
              onPress={handleSuggestWaterGauges}
            >
              <RefreshCw color="#FFFFFF" size={17} strokeWidth={2.5} />
              <Text className="font-black text-white">
                {isLoadingWaterGauges ? "Načítám" : "Najít vodočet"}
              </Text>
            </Pressable>
          </View>

          {waterGaugeCandidates.length > 0 ? (
            <View className="gap-2">
              <Text className="text-xs font-extrabold uppercase text-ink-500">
                Návrhy
              </Text>
              {waterGaugeCandidates.map((candidate) => {
                const selected =
                  form.waterCondition?.gaugeId === candidate.gaugeId;

                return (
                  <Pressable
                    className={
                      selected
                        ? "rounded-lg border border-river-500 bg-river-600 px-3 py-2"
                        : "rounded-lg border border-river-100 bg-river-50 px-3 py-2"
                    }
                    key={candidate.gaugeId}
                    onPress={() => selectWaterGaugeCandidate(candidate)}
                  >
                    <View className="flex-row items-start gap-2">
                      <Gauge
                        color={selected ? "#FFFFFF" : "#1D6E86"}
                        size={16}
                        strokeWidth={2.5}
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          className={
                            selected
                              ? "font-black text-white"
                              : "font-black text-ink-900"
                          }
                        >
                          {candidate.streamName} - {candidate.stationName}
                        </Text>
                        <Text
                          className={
                            selected
                              ? "mt-0.5 text-xs font-bold text-river-100"
                              : "mt-0.5 text-xs font-bold text-ink-600"
                          }
                        >
                          {formatWaterConditionSummary(candidate)} -{" "}
                          {candidate.distanceKm.toFixed(1)} km od trasy
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {waterGaugeMessage ? (
            <Text className="text-sm font-semibold text-ink-600">
              {waterGaugeMessage}
            </Text>
          ) : null}

          <Field
            label="Poznámka ke stavu vody"
            onChangeText={updateWaterConditionNote}
            placeholder="Např. dobré vlnky, málo vody v peřejích..."
            value={form.waterCondition?.note ?? ""}
          />
        </View>

        <DateTimeField
          label="Začátek sjezdu"
          onChange={updateStartedAt}
          value={form.startedAt}
        />
        <DateTimeField
          label="Konec sjezdu"
          minimumDate={form.startedAt}
          onChange={updateEndedAt}
          value={form.endedAt}
        />
        <Field
          autoCapitalize="words"
          label="Posádka"
          onChangeText={(value) => updateForm("crew", value)}
          placeholder="Dogin, Kulhis, Kolčo"
          value={form.crew}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-ink-700">Typ lodi</Text>
        <View className="flex-row flex-wrap gap-2">
          {boatTypeOptions.map((boatType) => {
            const selected = form.boatType === boatType;

            return (
              <Pressable
                className={
                  selected
                    ? "rounded-lg border border-river-200 bg-river-600 px-4 py-2"
                    : "rounded-lg border border-river-100 bg-river-50 px-4 py-2"
                }
                key={boatType}
                onPress={() => updateForm("boatType", boatType)}
              >
                <Text
                  className={
                    selected
                      ? "font-semibold text-white"
                      : "font-semibold text-ink-700"
                  }
                >
                  {boatType}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field
        className="min-h-24"
        label="Poznámka"
        multiline
        onChangeText={(value) => updateForm("notes", value)}
        placeholder="Stav vody, loď, hezké místo na pauzu..."
        textAlignVertical="top"
        value={form.notes}
      />

      <Pressable
        className={
          isSaving
            ? "items-center rounded-lg bg-ink-400 px-5 py-4"
            : "items-center rounded-lg bg-ink-900 px-5 py-4"
        }
        disabled={isSaving}
        onPress={handleSave}
      >
        <Text className="text-base font-bold text-white">
          {isSaving ? "Ukládám..." : (submitLabel ?? "Uložit výlet")}
        </Text>
      </Pressable>
      <Text className="text-sm text-ink-600">{message}</Text>

      <TripRouteEditor
        exportName={
          [form.river, form.from, form.to].filter(Boolean).join("-") ||
          "river-diary-route"
        }
        initialCoordinates={form.routeCoordinates}
        onCancel={() => setRouteEditorVisible(false)}
        onSave={handleRouteSave}
        visible={routeEditorVisible}
      />
    </View>
  );
}
