import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import { TripForm } from "../components/TripForm";
import { useTrips } from "../context/TripsContext";
import { RootStackParamList } from "../types/navigation";

type EditTripScreenProps = NativeStackScreenProps<RootStackParamList, "EditTrip">;

export function EditTripScreen({ navigation, route }: EditTripScreenProps) {
  const { getTripById } = useTrips();
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

  return (
    <Screen patternOpacity={0.08}>
      <View className="gap-2">
        <Text className="text-3xl font-bold text-ink-900">Upravit výlet</Text>
        <Text className="text-base text-ink-600">
          Změň údaje o trase, posádce nebo typu lodi.
        </Text>
      </View>

      <TripForm
        initialTrip={trip}
        onSaved={(updatedTrip) => {
          navigation.replace("TripDetails", { tripId: updatedTrip.id });
        }}
        submitLabel="Ulozit zmeny"
      />
    </Screen>
  );
}
