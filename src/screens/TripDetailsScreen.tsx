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
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatTripRange,
} from "../utils/date";
import { formatRouteDistance } from "../utils/geo";
import {
  formatWaterConditionSummary,
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
  tone?: "default" | "danger";
};

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[66px] flex-1 rounded-lg border border-river-100 bg-white/95 px-3 py-2.5">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>
      <Text numberOfLines={1} className="mt-1 text-lg font-black text-ink-900">
        {value}
      </Text>
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
    <View className="flex-row items-center gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
        {icon}
      </View>
      <Text className="text-lg font-black text-ink-900">{title}</Text>
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
  const content = (
    <>
      {icon}
      <Text className="text-sm font-black text-white">{label}</Text>
    </>
  );

  if (tone === "danger") {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-rose-700 px-3 disabled:opacity-50"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 disabled:opacity-50"
    >
      {content}
    </Pressable>
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
            navigation.navigate("MainTabs");
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
            <View className="rounded-lg bg-ink-900 p-4">
              <View className="flex-row items-start gap-3">
                <View className="h-[52px] w-[52px] items-center justify-center rounded-lg bg-river-700">
                  <Waves color="#FFFFFF" height={42} width={42} />
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
                    className="mt-1 text-[31px] font-black leading-[36px] text-white"
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

              <View className="mt-4 rounded-lg bg-white/10 p-3">
                <Text className="text-[11px] font-black uppercase text-river-100">
                  Datum sjezdu
                </Text>
                <Text className="mt-1 text-[15px] font-black leading-[21px] text-white">
                  {formatTripRange(trip.startedAt, trip.endedAt)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <MetricTile
                label="Kilometry"
                value={trip.distanceKm.toFixed(1)}
              />
              <MetricTile label="Loď" value={trip.boatType} />
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
                icon={<Pencil color="#FFFFFF" size={18} strokeWidth={2.5} />}
                label="Upravit"
                onPress={() =>
                  navigation.navigate("EditTrip", { tripId: trip.id })
                }
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

        {hasWaterSnapshot ? (
          <SectionCard>
            <SectionTitle
              icon={<Droplets color="#FFFFFF" size={18} strokeWidth={2.5} />}
              title="Podmínky na vodě"
            />

            <DetailRow
              body={formatWaterGaugeName(trip.waterCondition)}
              icon={<Gauge color="#1D6E86" size={21} strokeWidth={2.5} />}
              label="Vodočet"
            />

            <DetailRow
              body={formatWaterConditionSummary(trip.waterCondition)}
              icon={<Droplets color="#1D6E86" size={21} strokeWidth={2.5} />}
              label="Stav / průtok"
            />

            <View className="flex-row gap-2">
              {trip.waterCondition?.measuredAt ? (
                <DetailRow
                  body={formatDateTime(trip.waterCondition.measuredAt)}
                  icon={
                    <CalendarDays color="#1D6E86" size={21} strokeWidth={2.5} />
                  }
                  label="Čas měření"
                />
              ) : null}
              <DetailRow
                body={
                  trip.waterCondition?.distanceKm !== undefined
                    ? trip.waterCondition.distanceKm.toFixed(1) + " km od trasy"
                    : "Podle uloženého výběru"
                }
                icon={<MapPin color="#1D6E86" size={21} strokeWidth={2.5} />}
                label="Poloha"
              />
            </View>

            {trip.waterCondition?.note ? (
              <View className="rounded-lg bg-sun-100 p-3">
                <Text className="text-[11px] font-extrabold uppercase text-sun-800">
                  Poznámka k vodě
                </Text>
                <Text className="mt-1 text-[15px] font-bold leading-[22px] text-sun-800">
                  {trip.waterCondition.note}
                </Text>
              </View>
            ) : null}

            <Text className="text-xs font-semibold leading-[18px] text-ink-500">
              Data jsou orientační snapshot z ČHMÚ open data pro uložený výlet.
            </Text>
          </SectionCard>
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
            body={trip.crew.join(", ")}
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
