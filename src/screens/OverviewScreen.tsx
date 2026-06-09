import { NavigationProp, useNavigation } from "@react-navigation/native";
import { Anchor, MapPin, Sailboat } from "lucide-react-native";
import { Text, View } from "react-native";

import Rope from "../../assets/svg/rope.svg";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import { TripCard } from "../components/TripCard";
import { TripStatsPanel } from "../components/TripStatsPanel";
import { isFirebaseConfigured } from "../config/firebase";
import { useTrips } from "../context/TripsContext";
import { RootStackParamList } from "../types/navigation";
import HeaderBoat from "../../assets/svg/boat.svg"

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[58px] flex-1 rounded-lg border border-river-100 bg-river-50 px-2.5 py-2">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>
      <Text numberOfLines={1} className="mt-1 text-base font-black text-ink-900">
        {value}
      </Text>
    </View>
  );
}

export function OverviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { totalDistance, trips } = useTrips();
  const latestTrips = trips.slice(0, 3);
  const latestTrip = trips[0];

  return (
    <Screen patternOpacity={0.08}>
      <View className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10">
        <View className="absolute inset-0 opacity-95" pointerEvents="none">
          <Rope height="100%" preserveAspectRatio="none" width="100%" />
        </View>

        <View className="relative z-10 gap-3">
          <View className="min-h-[118px] flex-row items-start gap-3 rounded-lg bg-ink-900 px-3.5 py-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-[30px] font-black leading-[35px] text-white">
                River Diary
              </Text>
              <Text className="text-sm font-bold leading-5 text-river-100">
                Vodácký deník pro trasy, posádky, lodě a kilometry.
              </Text>
            </View>
            <View style={{ transform: [{ scaleX: -1 }] }} className="-mr-4">
              <HeaderBoat width={180} height={100} />
            </View>
          </View>

          <View className="flex-row gap-2">
            <OverviewMetric label="Výlety" value={String(trips.length)} />
            <OverviewMetric label="Kilometry" value={totalDistance.toFixed(1)} />
            <OverviewMetric label="Režim" value={isFirebaseConfigured ? "Cloud" : "Local"} />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
            <Sailboat color="#946200" size={18} strokeWidth={2.4} />
            <Text numberOfLines={2} className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800">
              {latestTrip
                ? "Poslední sjezd: " + latestTrip.river + ", " + latestTrip.distanceKm.toFixed(1) + " km na " + latestTrip.boatType + "."
                : "Zapiš první sjezd a deník začne počítat tvoje vodácké kilometry."}
            </Text>
          </View>
        </View>
      </View>

      <TripStatsPanel trips={trips} />

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
              <MapPin color="#FFFFFF" size={18} strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-xl font-black text-ink-900">Poslední záznamy</Text>
              <Text className="text-sm font-semibold text-ink-600">Rychlý přehled posledních sjezdů</Text>
            </View>
          </View>
        </View>

        {latestTrips.length === 0 ? (
          <EmptyState
            body="Jakmile uložíš první sjezd, objeví se tady rychlý náhled."
            title="Zatím žádný záznam"
          />
        ) : (
          latestTrips.map((trip) => (
            <TripCard
              key={trip.id}
              onPress={() =>
                navigation.navigate("TripDetails", {
                  tripId: trip.id,
                })
              }
              trip={trip}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
