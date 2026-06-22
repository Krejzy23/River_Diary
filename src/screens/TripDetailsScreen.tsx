import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Anchor,
  CalendarDays,
  Clock3,
  Droplets,
  Gauge,
  MapPin,
  Pencil,
  Sailboat,
  Share2,
  Trash2,
  Users,
} from "lucide-react-native";
import { ReactNode, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { captureRef } from "react-native-view-shot";

import Rope from "../../assets/svg/rope.svg";
import Waves from "../../assets/svg/vawes.svg";
import { AnchorPatternBackground } from "../components/AnchorPatternBackground";
import { EmptyState } from "../components/EmptyState";
import {
  TripRoutePreview,
  TripRoutePreviewHandle,
} from "../components/TripRoutePreview";
import { TripShareCard } from "../components/TripShareCard";
import { useTrips } from "../context/TripsContext";
import { shareTripGpx, shareTripImage } from "../services/tripSharing";
import { RootStackParamList } from "../types/navigation";
import type { WaterCondition, WaterConditionStatus } from "../types/trip";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatTripRange,
} from "../utils/date";
import { formatRouteDistance } from "../utils/geo";
import {
  formatWaterConditionSummary,
  getWaterConditionStatusLabel,
  formatWaterGaugeName,
  hasWaterCondition,
} from "../utils/waterCondition";

type TripDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TripDetails"
>;

type ActionButtonProps = {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  tone?: "default" | "danger" | "secondary";
};

function MetricTile({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-[74px] flex-1 rounded-lg border border-river-100 bg-white/95 px-3 py-2.5">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>
      <Text numberOfLines={1} className="mt-1 text-lg font-black text-ink-900">
        {value}
      </Text>
      {detail ? (
        <Text numberOfLines={1} className="mt-0.5 text-xs font-black uppercase text-river-800">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <View className="gap-3 rounded-lg border border-river-100 bg-white p-3.5 shadow-sm shadow-ink-900/10">
      {children}
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
        {icon}
      </View>
      <Text numberOfLines={1} className="min-w-0 flex-1 text-lg font-black text-ink-900">
        {title}
      </Text>
    </View>
  );
}

function DetailRow({
  body,
  icon,
  label,
}: {
  body: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <View className="flex-1 flex-row items-start gap-2.5 rounded-lg bg-river-50 p-3">
      <View className="mt-0.5">{icon}</View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-[11px] font-extrabold uppercase text-ink-500">
          {label}
        </Text>
        <Text className="text-[15px] font-extrabold leading-[21px] text-ink-900">
          {body}
        </Text>
      </View>
    </View>
  );
}

function EndpointTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[76px] flex-1 rounded-lg border border-river-100 bg-river-50 px-3 py-2.5">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>
      <Text className="mt-1 text-[16px] font-black leading-[21px] text-ink-900">
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onPress,
  tone = "default",
}: ActionButtonProps) {
  const labelClass = tone === "secondary" ? "text-ink-900" : "text-white";
  const className =
    tone === "danger"
      ? "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-rose-700 px-3 disabled:opacity-50"
      : tone === "secondary"
        ? "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-river-100 bg-white px-3 disabled:opacity-50"
        : "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 disabled:opacity-50";

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={className}
    >
      {icon}
      <Text className={"text-sm font-black " + labelClass}>{label}</Text>
    </Pressable>
  );
}

function waterConditionTone(status?: WaterConditionStatus) {
  if (status === "dry" || status === "low") {
    return {
      badge: "bg-sun-100",
      border: "border-sun-100",
      feature: "border-sun-100 bg-sun-100",
      icon: "#946200",
      label: "text-sun-800",
      panel: "border-sun-100 bg-white",
      rail: "bg-sun-500",
    };
  }

  if (status === "good") {
    return {
      badge: "bg-reed-100",
      border: "border-reed-100",
      feature: "border-reed-100 bg-reed-100",
      icon: "#2D6A4F",
      label: "text-reed-700",
      panel: "border-reed-100 bg-white",
      rail: "bg-reed-600",
    };
  }

  if (status === "high" || status === "flood") {
    return {
      badge: "bg-rose-100",
      border: "border-rose-100",
      feature: "border-rose-100 bg-rose-100",
      icon: "#BE123C",
      label: "text-rose-800",
      panel: "border-rose-100 bg-white",
      rail: "bg-rose-600",
    };
  }

  return {
    badge: "bg-river-100",
    border: "border-river-100",
    feature: "border-river-100 bg-river-50",
    icon: "#1D6E86",
    label: "text-ink-600",
    panel: "border-river-100 bg-white",
    rail: "bg-ink-400",
  };
}

function formatWaterLevel(value?: number) {
  return value === undefined ? "-" : value.toFixed(0);
}

function formatWaterFlowValue(value?: number) {
  if (value === undefined) {
    return "-";
  }

  if (value >= 100) {
    return value.toFixed(0);
  }

  if (value >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}

function WaterConditionPanel({ condition }: { condition: WaterCondition }) {
  const tone = waterConditionTone(condition.status);
  const statusLabel = getWaterConditionStatusLabel(
    condition.status,
    condition.statusLabel,
  );

  return (
    <View className={"overflow-hidden rounded-lg border shadow-sm shadow-ink-900/10 " + tone.panel}>
      <View className={"h-1.5 " + tone.rail} />
      <View className="gap-3 p-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <SectionTitle
            icon={<Droplets color="#FFFFFF" size={18} strokeWidth={2.5} />}
            title="Podmínky na vodě"
          />
          <View className={"rounded-lg px-3 py-2 " + tone.badge}>
            <Text className={"text-xs font-black uppercase " + tone.label}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className={"min-h-[92px] flex-1 rounded-lg border px-3 py-3 " + tone.feature}>
            <Text className={"text-[11px] font-black uppercase " + tone.label}>
              Hladina
            </Text>
            <View className="mt-1 flex-row items-end gap-1">
              <Text className={"text-[32px] font-black leading-[36px] " + tone.label}>
                {formatWaterLevel(condition.levelCm)}
              </Text>
              <Text className={"pb-1 text-sm font-black " + tone.label}>cm</Text>
            </View>
          </View>

          <View className="min-h-[92px] flex-1 rounded-lg border border-river-100 bg-river-50 px-3 py-3">
            <Text className="text-[11px] font-black uppercase text-ink-500">
              Průtok
            </Text>
            <View className="mt-1 flex-row items-end gap-1">
              <Text className="text-[32px] font-black leading-[36px] text-ink-900">
                {formatWaterFlowValue(condition.flowM3s)}
              </Text>
              <Text className="pb-1 text-sm font-black text-ink-500">m³/s</Text>
            </View>
          </View>
        </View>

        <View className="gap-2 rounded-lg bg-river-50 p-3">
          <DetailRow
            body={formatWaterGaugeName(condition)}
            icon={<Gauge color="#1D6E86" size={21} strokeWidth={2.5} />}
            label="Vodočet"
          />

          <View className="flex-row gap-2">
            {condition.measuredAt ? (
              <DetailRow
                body={formatDateTime(condition.measuredAt)}
                icon={<CalendarDays color="#1D6E86" size={21} strokeWidth={2.5} />}
                label="Čas měření"
              />
            ) : null}
            <DetailRow
              body={
                condition.distanceKm !== undefined
                  ? condition.distanceKm.toFixed(1) + " km od trasy"
                  : "Podle uloženého výběru"
              }
              icon={<MapPin color="#1D6E86" size={21} strokeWidth={2.5} />}
              label="Poloha"
            />
          </View>
        </View>

        {condition.note ? (
          <View className={"rounded-lg px-3 py-2.5 " + tone.badge}>
            <Text className={"text-sm font-black leading-5 " + tone.label}>
              {condition.note}
            </Text>
          </View>
        ) : null}

        <Text className="text-xs font-semibold leading-[18px] text-ink-500">
          Data jsou orientační snapshot z ČHMÚ open data pro uložený výlet.
        </Text>
      </View>
    </View>
  );
}

export function TripDetailsScreen({
  navigation,
  route,
}: TripDetailsScreenProps) {
  const { deleteTrip, getTripById, isSaving } = useTrips();
  const [isSharing, setIsSharing] = useState(false);
  const [shareMapSnapshotUri, setShareMapSnapshotUri] = useState<string | null>(
    null,
  );
  const routePreviewRef = useRef<TripRoutePreviewHandle>(null);
  const shareCardRef = useRef<View>(null);
  const trip = getTripById(route.params.tripId);

  if (!trip) {
    return (
      <View className="flex-1 bg-river-50 px-5 pt-6">
        <EmptyState
          body="Zaznam mohl byt smazan, nebo jeste neni nacteny z backendu."
          title="Vylet nenalezen"
        />
      </View>
    );
  }

  const hasRoute = (trip.routeCoordinates?.length ?? 0) >= 2;
  const hasWaterSnapshot = hasWaterCondition(trip.waterCondition);
  const mappedDistance = hasRoute
    ? formatRouteDistance(trip.routeCoordinates ?? [])
    : null;
  const waterTone = waterConditionTone(trip.waterCondition?.status);
  const waterStatusLabel = hasWaterSnapshot
    ? getWaterConditionStatusLabel(
        trip.waterCondition?.status,
        trip.waterCondition?.statusLabel,
      )
    : "Bez vody";
  const crewLabel =
    trip.crew.length === 1 ? "1 osoba" : trip.crew.length + " osob";

  const shareImageCard = async () => {
    if (!shareCardRef.current) {
      Alert.alert("Sdílení selhalo", "Kartu výletu se nepodařilo připravit.");
      return;
    }

    setIsSharing(true);

    try {
      const nextMapSnapshotUri = hasRoute
        ? await routePreviewRef.current?.createSnapshot()
        : null;
      setShareMapSnapshotUri(nextMapSnapshotUri ?? null);

      await new Promise((resolve) =>
        setTimeout(resolve, nextMapSnapshotUri ? 120 : 40),
      );

      const imageUri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await shareTripImage(imageUri);
    } catch {
      Alert.alert(
        "Sdílení selhalo",
        "Obrázek výletu se nepodařilo vytvořit nebo sdílet. Zkus to prosím znovu.",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const shareGpx = async () => {
    setIsSharing(true);

    try {
      await shareTripGpx(trip);
    } catch {
      Alert.alert(
        "Sdílení GPX selhalo",
        "GPX trasu se nepodařilo vytvořit nebo sdílet.",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = () => {
    if (!hasRoute) {
      void shareImageCard();
      return;
    }

    Alert.alert("Sdílet výlet", "Co chceš poslat dál?", [
      { text: "Zrušit", style: "cancel" },
      { text: "Karta", onPress: () => void shareImageCard() },
      { text: "GPX trasa", onPress: () => void shareGpx() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Smazat výlet", "Opravdu chceš tenhle výlet smazat?", [
      { text: "Zrusit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTrip(trip.id);
            navigation.navigate("Zpět");
          } catch {
            Alert.alert(
              "Smazani selhalo",
              "Vylet se nepodarilo smazat. Zkus to prosim znovu.",
            );
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-river-50">
      <AnchorPatternBackground opacity={0.055} />

      <ScrollView
        className="z-10 flex-1"
        contentContainerClassName="gap-4 px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10">
          <View pointerEvents="none" style={styles.frameLayer}>
            <Rope height="100%" preserveAspectRatio="none" width="100%" />
          </View>

          <View className="relative z-10 gap-3">
            <View className="overflow-hidden rounded-lg bg-ink-900">
              <View className={"h-1.5 " + waterTone.rail} />
              <View className="gap-3 p-4">
                <View className="flex-row items-start gap-3">
                  <View className="h-[56px] w-[56px] items-center justify-center rounded-lg bg-river-700">
                    <Waves color="#FFFFFF" height={44} width={44} />
                  </View>

                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-2">
                      <Anchor color="#D6EDEA" size={15} strokeWidth={2.5} />
                      <Text className="text-[11px] font-black uppercase text-river-100">
                        Detail sjezdu
                      </Text>
                    </View>
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-[32px] font-black leading-[37px] text-white"
                    >
                      {trip.river}
                    </Text>
                    <View className="mt-2 flex-row items-start gap-2">
                      <MapPin color="#D6EDEA" size={17} strokeWidth={2.5} />
                      <Text className="min-w-0 flex-1 text-[15px] font-bold leading-[21px] text-river-100">
                        {trip.from} -&gt; {trip.to}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-col flex-wrap gap-2">
                  <View className="min-w-[136px] flex-1 rounded-lg bg-white/10 px-3 py-2">
                    <Text className="text-[11px] font-black uppercase text-river-100">
                      Datum sjezdu
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 text-sm font-black text-white">
                      {formatTripRange(trip.startedAt, trip.endedAt)}
                    </Text>
                  </View>
                  <View className={"min-w-[150px] flex-1 rounded-lg px-3 py-2 " + waterTone.badge}>
                    <Text numberOfLines={1} className={"text-[11px] font-black uppercase " + waterTone.label}>
                      {waterStatusLabel}
                    </Text>
                    <Text numberOfLines={1} className={"mt-0.5 text-sm font-black " + waterTone.label}>
                      {hasWaterSnapshot
                        ? formatWaterConditionSummary(trip.waterCondition)
                        : "Bez uloženého měření"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2">
              <MetricTile
                detail={mappedDistance ? mappedDistance + " mapa" : "deník"}
                label="Kilometry"
                value={trip.distanceKm.toFixed(1) + " km"}
              />
              <MetricTile detail={crewLabel} label="Loď" value={trip.boatType} />
              <MetricTile label="Obtížnost" value={trip.difficulty} />
            </View>

            <View className="flex-row gap-2">
              <ActionButton
                disabled={isSharing}
                icon={<Share2 color="#FFFFFF" size={18} strokeWidth={2.5} />}
                label={isSharing ? "Chystám" : "Sdílet"}
                onPress={handleShare}
              />
              <ActionButton
                icon={<Pencil color="#10202A" size={18} strokeWidth={2.5} />}
                label="Upravit"
                onPress={() =>
                  navigation.navigate("EditTrip", { tripId: trip.id })
                }
                tone="secondary"
              />
              <ActionButton
                disabled={isSaving}
                icon={<Trash2 color="#FFFFFF" size={18} strokeWidth={2.5} />}
                label="Smazat"
                onPress={handleDelete}
                tone="danger"
              />
            </View>
          </View>
        </View>

        <TripRoutePreview
          ref={routePreviewRef}
          coordinates={trip.routeCoordinates}
        />

        <SectionCard>
          <SectionTitle
            icon={<MapPin color="#FFFFFF" size={18} strokeWidth={2.5} />}
            title="Průběh sjezdu"
          />

          <View className="flex-row items-center gap-2">
            <EndpointTile label="Start" value={trip.from} />
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-sun-100">
              <Text className="text-lg font-black text-sun-800">-&gt;</Text>
            </View>
            <EndpointTile label="Cíl" value={trip.to} />
          </View>

          <DetailRow
            body={
              mappedDistance
                ? trip.distanceKm.toFixed(1) +
                  " km v deníku, " +
                  mappedDistance +
                  " km podle mapy"
                : trip.distanceKm.toFixed(1) + " km v deníku"
            }
            icon={<MapPin color="#1D6E86" size={21} strokeWidth={2.5} />}
            label="Kilometráž"
          />

          <View className="flex-row gap-2">
            <DetailRow
              body={formatDate(trip.startedAt)}
              icon={
                <CalendarDays color="#1D6E86" size={21} strokeWidth={2.5} />
              }
              label="Start"
            />
            <DetailRow
              body={formatDate(trip.endedAt)}
              icon={
                <CalendarDays color="#1D6E86" size={21} strokeWidth={2.5} />
              }
              label="Konec"
            />
          </View>

          <DetailRow
            body={formatDuration(trip.startedAt, trip.endedAt)}
            icon={<Clock3 color="#1D6E86" size={21} strokeWidth={2.5} />}
            label="Doba na vodě"
          />
        </SectionCard>

        {hasWaterSnapshot && trip.waterCondition ? (
          <WaterConditionPanel condition={trip.waterCondition} />
        ) : null}

        <SectionCard>
          <SectionTitle
            icon={<Sailboat color="#FFFFFF" size={18} strokeWidth={2.5} />}
            title="Posádka a vybavení"
          />

          <View className="flex-row gap-2">
            <DetailRow
              body={trip.boatType}
              icon={<Sailboat color="#1D6E86" size={21} strokeWidth={2.5} />}
              label="Typ lodi"
            />
            <DetailRow
              body={trip.difficulty}
              icon={<Anchor color="#1D6E86" size={21} strokeWidth={2.5} />}
              label="Obtížnost"
            />
          </View>

          <DetailRow
            body={trip.crew.length > 0 ? trip.crew.join(", ") : "Bez posádky"}
            icon={<Users color="#1D6E86" size={21} strokeWidth={2.5} />}
            label="Posádka"
          />
        </SectionCard>

        <View className="gap-2 rounded-lg border border-sun-200 bg-sun-100 p-3.5 shadow-sm shadow-ink-900/10">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-sun-200">
              <Sailboat color="#946200" size={18} strokeWidth={2.4} />
            </View>
            <Text className="text-lg font-black text-sun-800">Poznámka</Text>
          </View>

          <Text className="text-[15px] font-bold leading-[22px] text-sun-800">
            {trip.notes || "Bez poznámky."}
          </Text>
        </View>
      </ScrollView>

      <View pointerEvents="none" style={styles.shareCardHost}>
        <View ref={shareCardRef} collapsable={false}>
          <TripShareCard mapSnapshotUri={shareMapSnapshotUri} trip={trip} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frameLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 1,
  },
  shareCardHost: {
    left: -10000,
    position: "absolute",
    top: 0,
  },
});
