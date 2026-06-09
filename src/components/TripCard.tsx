import {
  Anchor,
  CalendarDays,
  ChevronRight,
  Sailboat,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Rope from "../../assets/svg/rope.svg";
import Waves from "../../assets/svg/vawes.svg";
import { RiverTrip } from "../types/trip";
import { formatTripRange } from "../utils/date";

type TripCardProps = {
  onPress?: () => void;
  trip: RiverTrip;
};

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[54px] flex-1 rounded-lg border border-river-100 bg-river-50 px-2.5 py-2">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>

      <Text className="mt-0.5 text-sm font-black text-ink-900">{value}</Text>
    </View>
  );
}

export function TripCard({ onPress, trip }: TripCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10"
      style={({ pressed }) => [pressed ? styles.cardPressed : null]}
    >
      <View pointerEvents="none" style={styles.frameLayer}>
        <Rope height="100%" preserveAspectRatio="none" width="100%" />
      </View>

      <View className="relative z-10 gap-3">
        <View className="min-h-[68px] flex-row items-center gap-3 rounded-lg bg-ink-900 px-3.5 py-3">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-river-700">
            <Waves color="#FFFFFF" width={30} height={30} />
          </View>

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={1}
              className="text-xl font-black leading-[25px] text-white"
            >
              {trip.river}
            </Text>

            <Text
              numberOfLines={1}
              className="mt-0.5 text-[13px] font-bold leading-[18px] text-river-100"
            >
              {trip.from}
              {" -> "}
              {trip.to}
            </Text>
          </View>

          {onPress ? (
            <View className="h-[34px] w-[34px] items-center justify-center rounded-lg bg-white/10">
              <ChevronRight color="#FFFFFF" size={20} strokeWidth={2.6} />
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-2">
          <MetaChip label="Km" value={trip.distanceKm.toFixed(1)} />
          <MetaChip label="Loď" value={trip.boatType} />
          <MetaChip label="Obtížnost" value={trip.difficulty} />
        </View>

        <View className="flex-row items-center gap-2 px-0.5">
          <CalendarDays color="#1D6E86" size={17} strokeWidth={2.4} />
          <Text
            numberOfLines={1}
            className="flex-1 text-sm font-bold text-ink-700"
          >
            {formatTripRange(trip.startedAt, trip.endedAt)}
          </Text>
        </View>

        <View className="flex-row items-center gap-2 px-0.5">
          <Users color="#1D6E86" size={17} strokeWidth={2.4} />
          <Text
            numberOfLines={1}
            className="flex-1 text-sm font-bold text-ink-700"
          >
            {trip.crew.join(", ")}
          </Text>
        </View>

        {trip.notes ? (
          <View className="flex-row items-start gap-2 rounded-lg bg-sun-100 p-2.5">
            <Sailboat color="#946200" size={16} strokeWidth={2.3} />

            <Text
              numberOfLines={2}
              className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800"
            >
              {trip.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.86,
  },
  frameLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 1,
  },
});
