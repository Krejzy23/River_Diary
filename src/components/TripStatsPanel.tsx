import { BarChart3, Gauge, MapPinned, Route, Sailboat, Trophy, Users } from "lucide-react-native";
import { ReactNode } from "react";
import { Text, View } from "react-native";

import { RiverTrip } from "../types/trip";
import { createTripStats } from "../utils/stats";

type TripStatsPanelProps = {
  trips: RiverTrip[];
};

type StatTileProps = {
  accent?: "river" | "reed" | "sun" | "ink";
  icon: ReactNode;
  label: string;
  value: string;
};

const accentClasses = {
  ink: "bg-ink-900",
  reed: "bg-reed-700",
  river: "bg-river-700",
  sun: "bg-sun-100",
};

function StatTile({ accent = "river", icon, label, value }: StatTileProps) {

  return (
    <View className="min-h-[92px] flex-1 gap-2 rounded-lg border border-river-100 bg-white p-3 shadow-sm shadow-ink-900/5">
      <View className="flex-row items-center gap-2">
        <View className={"h-8 w-8 items-center justify-center rounded-lg " + accentClasses[accent]}>
          {icon}
        </View>
        <Text className="flex-1 text-[11px] font-extrabold uppercase text-ink-500">{label}</Text>
      </View>
      <Text numberOfLines={2} className="text-lg font-black leading-6 text-ink-900">
        {value}
      </Text>
    </View>
  );
}

export function TripStatsPanel({ trips }: TripStatsPanelProps) {
  const currentYear = new Date().getFullYear();
  const stats = createTripStats(trips, currentYear);

  if (trips.length === 0) {
    return (
      <View className="gap-2 rounded-lg border border-dashed border-river-200 bg-white p-4">
        <Text className="text-lg font-black text-ink-900">Statistiky čekají na první sjezd</Text>
        <Text className="text-sm font-semibold leading-5 text-ink-600">
          Jakmile uložíš pár výletů, objeví se tu řeky, lodě a roční kilometry.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-ink-900">
          <BarChart3 color="#FFFFFF" size={18} strokeWidth={2.5} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-black text-ink-900">Statistiky</Text>
          <Text className="text-sm font-semibold text-ink-600">Rychlé skóre z uložených sjezdů</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <StatTile
          accent="river"
          icon={<Route color="#FFFFFF" size={17} strokeWidth={2.5} />}
          label={currentYear + " km"}
          value={stats.yearlyDistanceKm.toFixed(1)}
        />
        <StatTile
          accent="reed"
          icon={<MapPinned color="#FFFFFF" size={17} strokeWidth={2.5} />}
          label="Mapy"
          value={stats.mappedTrips + "/" + stats.totalTrips}
        />
        <StatTile
          accent="sun"
          icon={<Gauge color="#946200" size={17} strokeWidth={2.5} />}
          label="Průměr"
          value={stats.averageDistanceKm.toFixed(1) + " km"}
        />
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-4 shadow-sm shadow-ink-900/5">
        <View className="flex-row gap-2">
          <StatTile
            accent="ink"
            icon={<Trophy color="#FFFFFF" size={17} strokeWidth={2.5} />}
            label="Top řeka"
            value={stats.mostFrequentRiver?.label ?? "-"}
          />
          <StatTile
            accent="river"
            icon={<Sailboat color="#FFFFFF" size={17} strokeWidth={2.5} />}
            label="Loď"
            value={stats.mostFrequentBoat?.label ?? "-"}
          />
        </View>
        <View className="flex-row gap-2">
          <StatTile
            accent="reed"
            icon={<Users color="#FFFFFF" size={17} strokeWidth={2.5} />}
            label="Parťák"
            value={stats.mostFrequentCrewMember?.label ?? "-"}
          />
          <StatTile
            accent="sun"
            icon={<Gauge color="#946200" size={17} strokeWidth={2.5} />}
            label="Max obtížnost"
            value={stats.topDifficulty ?? "-"}
          />
        </View>
      </View>

    </View>
  );
}
