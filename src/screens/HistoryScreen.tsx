import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  CalendarDays,
  Filter,
  Route,
  Sailboat,
  Search,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import Books from "../../assets/svg/book.svg";
import Rope from "../../assets/svg/rope.svg";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import { TripCard } from "../components/TripCard";
import { useTrips } from "../context/TripsContext";
import { RootStackParamList } from "../types/navigation";
import { BoatType, TripDifficulty } from "../types/trip";
import { formatTripRange } from "../utils/date";

type FilterChipProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[58px] flex-1 rounded-lg border border-river-100 bg-river-50 px-2.5 py-2">
      <Text className="text-[11px] font-extrabold uppercase text-ink-500">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        className="mt-1 text-base font-black text-ink-900"
      >
        {value}
      </Text>
    </View>
  );
}

function FilterChip({ active, label, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        "min-h-10 items-center justify-center rounded-lg border px-3 py-2 " +
        (active ? "border-ink-900 bg-ink-900" : "border-river-100 bg-white")
      }
    >
      <Text
        className={
          "text-sm font-black " + (active ? "text-white" : "text-ink-700")
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function HistoryScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { totalDistance, trips } = useTrips();
  const [boatFilter, setBoatFilter] = useState<BoatType | null>(null);
  const [difficultyFilter, setDifficultyFilter] =
    useState<TripDifficulty | null>(null);
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const latestTrip = trips[0];
  const averageDistance = trips.length > 0 ? totalDistance / trips.length : 0;

  const years = useMemo(() => {
    return Array.from(
      new Set(trips.map((trip) => new Date(trip.startedAt).getFullYear())),
    )
      .filter((year) => Number.isFinite(year))
      .sort((left, right) => right - left);
  }, [trips]);

  const boatOptions = useMemo(() => {
    return Array.from(new Set(trips.map((trip) => trip.boatType))).sort();
  }, [trips]);

  const difficultyOptions = useMemo(() => {
    return Array.from(new Set(trips.map((trip) => trip.difficulty))).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return trips.filter((trip) => {
      if (yearFilter && new Date(trip.startedAt).getFullYear() !== yearFilter) {
        return false;
      }

      if (boatFilter && trip.boatType !== boatFilter) {
        return false;
      }

      if (difficultyFilter && trip.difficulty !== difficultyFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = normalizeSearch(
        [
          trip.river,
          trip.from,
          trip.to,
          trip.boatType,
          trip.difficulty,
          trip.notes ?? "",
          ...trip.crew,
        ].join(" "),
      );

      return searchable.includes(normalizedQuery);
    });
  }, [boatFilter, difficultyFilter, query, trips, yearFilter]);

  const filteredDistance = filteredTrips.reduce(
    (sum, trip) => sum + trip.distanceKm,
    0,
  );
  const hasActiveFilters = Boolean(
    query.trim() || yearFilter || boatFilter || difficultyFilter,
  );

  const clearFilters = () => {
    setBoatFilter(null);
    setDifficultyFilter(null);
    setQuery("");
    setYearFilter(null);
  };

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
                Historie
              </Text>
              <Text className="text-sm font-bold leading-5 text-river-100">
                Archiv všech sjezdů, kilometrů a posádek na jednom místě.
              </Text>
            </View>
            <Books width={100} height={100} />
          </View>

          <View className="flex-row gap-2">
            <HistoryMetric label="Záznamy" value={String(trips.length)} />
            <HistoryMetric label="Kilometry" value={totalDistance.toFixed(1)} />
            <HistoryMetric label="Průměr" value={averageDistance.toFixed(1)} />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
            <Sailboat color="#946200" size={18} strokeWidth={2.4} />
            <Text
              numberOfLines={2}
              className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800"
            >
              {latestTrip
                ? "Poslední uložený sjezd: " +
                  latestTrip.river +
                  " - " +
                  formatTripRange(latestTrip.startedAt, latestTrip.endedAt) +
                  "."
                : "Až uložíš první výlet, historie se začne plnit vodáckými zářezy."}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-3.5 shadow-sm shadow-ink-900/10">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
              <Filter color="#FFFFFF" size={18} strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-lg font-black text-ink-900">Filtry</Text>
              <Text className="text-sm font-semibold text-ink-600">
                {filteredTrips.length} z {trips.length} sjezdů -{" "}
                {filteredDistance.toFixed(1)} km
              </Text>
            </View>
          </View>

          {hasActiveFilters ? (
            <Pressable
              accessibilityRole="button"
              onPress={clearFilters}
              className="h-10 w-10 items-center justify-center rounded-lg bg-sun-100"
            >
              <X color="#946200" size={18} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>

        <View className="min-h-12 flex-row items-center gap-2 rounded-lg border border-river-100 bg-river-50 px-3">
          <Search color="#1D6E86" size={18} strokeWidth={2.5} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="min-h-12 flex-1 text-base font-bold text-ink-900"
            onChangeText={setQuery}
            placeholder="Hledat řeku, trasu, posádku..."
            placeholderTextColor="#536271"
            value={query}
          />
        </View>

        {years.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <CalendarDays color="#1D6E86" size={17} strokeWidth={2.4} />
              <Text className="text-[11px] font-black uppercase text-ink-500">
                Rok
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                active={!yearFilter}
                label="Vše"
                onPress={() => setYearFilter(null)}
              />
              {years.map((year) => (
                <FilterChip
                  key={year}
                  active={yearFilter === year}
                  label={String(year)}
                  onPress={() =>
                    setYearFilter(yearFilter === year ? null : year)
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {boatOptions.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Sailboat color="#1D6E86" size={17} strokeWidth={2.4} />
              <Text className="text-[11px] font-black uppercase text-ink-500">
                Loď
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                active={!boatFilter}
                label="Vše"
                onPress={() => setBoatFilter(null)}
              />
              {boatOptions.map((boat) => (
                <FilterChip
                  key={boat}
                  active={boatFilter === boat}
                  label={boat}
                  onPress={() =>
                    setBoatFilter(boatFilter === boat ? null : boat)
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {difficultyOptions.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Route color="#1D6E86" size={17} strokeWidth={2.4} />
              <Text className="text-[11px] font-black uppercase text-ink-500">
                Obtížnost
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                active={!difficultyFilter}
                label="Vše"
                onPress={() => setDifficultyFilter(null)}
              />
              {difficultyOptions.map((difficulty) => (
                <FilterChip
                  key={difficulty}
                  active={difficultyFilter === difficulty}
                  label={difficulty}
                  onPress={() =>
                    setDifficultyFilter(
                      difficultyFilter === difficulty ? null : difficulty,
                    )
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
            <Route color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-black text-ink-900">
              Všechny sjezdy
            </Text>
            <Text className="text-sm font-semibold text-ink-600">
              {hasActiveFilters
                ? "Výsledky podle aktivních filtrů"
                : "Seřazeno od nejnovějšího záznamu"}
            </Text>
          </View>
        </View>

        {trips.length === 0 ? (
          <EmptyState
            body="Záznamy z přehledu se sem propíšou automaticky."
            title="Historie je zatím prázdná"
          />
        ) : filteredTrips.length === 0 ? (
          <EmptyState
            body="Zkus změnit hledání nebo vymazat aktivní filtry."
            title="Nic neodpovídá filtrům"
          />
        ) : (
          filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              onPress={() =>
                navigation.navigate("TripDetails", { tripId: trip.id })
              }
              trip={trip}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
