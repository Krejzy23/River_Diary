import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MapPin, Sailboat } from "lucide-react-native";

import Rope from "../../assets/svg/rope.svg";
import { TripForm } from "../components/TripForm";
import { RootStackParamList } from "../types/navigation";
import HeaderPaddles from "../../assets/svg/paddles.svg";

export function AddTripScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-river-50"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 px-5 pb-8 pt-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10">
          <View className="absolute inset-0 opacity-95" pointerEvents="none">
            <Rope height="100%" preserveAspectRatio="none" width="100%" />
          </View>

          <View className="relative z-10 gap-3">
            <View className="min-h-[128px] flex-row items-start gap-3 rounded-lg bg-ink-900 px-3.5 py-4">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-[30px] font-black leading-[35px] text-white">
                  Nový sjezd
                </Text>
                <Text className="text-sm font-bold leading-5 text-river-100">
                  Zapiš řeku, trasu, posádku, loď a čas sjezdu do deníku.
                </Text>
              </View>
              <View className="flex">
                <HeaderPaddles width={80} height={80} />
              </View>
            </View>

            <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
              <Sailboat color="#946200" size={18} strokeWidth={2.4} />
              <Text className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800">
                Každý záznam se po uložení propíše do přehledu, historie a
                Cloudu.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
            <MapPin color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-xl font-black text-ink-900">
              Detaily sjezdu
            </Text>
            <Text className="text-sm font-semibold text-ink-600">
              Vyplň základní údaje o plavbě
            </Text>
          </View>
        </View>

        <TripForm
          onSaved={(trip) =>
            navigation.navigate("TripDetails", {
              tripId: trip.id,
            })
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
