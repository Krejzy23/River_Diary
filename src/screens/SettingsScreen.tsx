import {
  CheckCircle2,
  CircleAlert,
  Cloud,
  Database,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";

import Rope from "../../assets/svg/rope.svg";
import Settings from "../../assets/svg/settings.svg"
import { Screen } from "../components/Screen";
import { firebaseConfigStatus, isFirebaseConfigured } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { TRIPS_COLLECTION_NAME } from "../services/trips";

type SettingsRowProps = {
  label: string;
  value: string;
};

function SettingsRow({ label, value }: SettingsRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-river-100 py-3">
      <Text className="flex-1 text-sm font-semibold text-ink-700">{label}</Text>
      <Text numberOfLines={1} className="max-w-[58%] text-right text-sm font-black text-ink-900">
        {value}
      </Text>
    </View>
  );
}

function EnvStatusRow({ configured, label }: { configured: boolean; label: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-lg bg-river-50 px-3 py-2.5">
      <Text className="flex-1 text-sm font-bold text-ink-700">{label}</Text>
      <View
        className={
          configured
            ? "rounded-full bg-reed-100 px-2.5 py-1"
            : "rounded-full bg-sun-100 px-2.5 py-1"
        }
      >
        <Text className={configured ? "text-xs font-black text-reed-700" : "text-xs font-black text-sun-800"}>
          {configured ? "OK" : "Chybí"}
        </Text>
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const { signOut, user } = useAuth();
  const configRows = [
    ["API key", firebaseConfigStatus.apiKey],
    ["Auth domain", firebaseConfigStatus.authDomain],
    ["Project ID", firebaseConfigStatus.projectId],
    ["Storage bucket", firebaseConfigStatus.storageBucket],
    ["Messaging sender ID", firebaseConfigStatus.messagingSenderId],
    ["App ID", firebaseConfigStatus.appId],
  ] as const;

  return (
    <Screen patternOpacity={0.1}>
      <View className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10">
        <View className="absolute inset-0 opacity-95" pointerEvents="none">
          <Rope height="100%" preserveAspectRatio="none" width="100%" />
        </View>

        <View className="relative z-10 gap-3">
          <View className="min-h-[118px] flex-row items-start gap-3 rounded-lg bg-ink-900 px-3.5 py-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-[30px] font-black leading-[35px] text-white">Nastavení</Text>
              <Text className="text-sm font-bold leading-5 text-river-100">
                Účet, Firebase připojení a technické údaje deníku.
              </Text>
            </View>
            <Settings width={100} height={100} />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
            {isFirebaseConfigured ? (
              <CheckCircle2 color="#2D6A4F" size={19} strokeWidth={2.5} />
            ) : (
              <CircleAlert color="#946200" size={19} strokeWidth={2.5} />
            )}
            <Text numberOfLines={2} className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800">
              {isFirebaseConfigured
                ? "Firebase je připravený a nové výlety se ukládají do Firestore."
                : "Firebase zatím není kompletní, appka poběží jen v lokálním režimu."}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-4 shadow-sm shadow-ink-900/10">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-700">
            <UserRound color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-xl font-black text-ink-900">Účet a aplikace</Text>
            <Text className="text-sm font-semibold text-ink-600">Aktuální stav deníku</Text>
          </View>
        </View>

        <View className="rounded-lg bg-river-50 px-3">
          <SettingsRow label="Uživatel" value={user?.email ?? "Neznámý"} />
          <SettingsRow label="Backend režim" value={isFirebaseConfigured ? "Cloud" : "Local"} />
          <SettingsRow label="Firestore kolekce" value={TRIPS_COLLECTION_NAME} />
          <SettingsRow label="Expo SDK" value="56" />
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-4 shadow-sm shadow-ink-900/10">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-ink-900">
            <Database color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-xl font-black text-ink-900">Firebase env</Text>
            <Text className="text-sm font-semibold text-ink-600">Kontrola veřejných Expo proměnných</Text>
          </View>
        </View>

        <View className="gap-2">
          {configRows.map(([label, configured]) => (
            <EnvStatusRow configured={configured} key={label} label={label} />
          ))}
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-4 shadow-sm shadow-ink-900/10">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-sun-100">
            <KeyRound color="#946200" size={18} strokeWidth={2.5} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-black text-ink-900">Přihlášení</Text>
            <Text numberOfLines={1} className="text-sm font-semibold text-ink-600">
              {user?.email ?? "Bez aktivního uživatele"}
            </Text>
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-river-50">
            <Cloud color={isFirebaseConfigured ? "#2D6A4F" : "#946200"} size={18} strokeWidth={2.5} />
          </View>
        </View>

        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 py-4"
          onPress={() => {
            Alert.alert("Odhlásit", "Opravdu se chceš odhlásit?", [
              { text: "Zrušit", style: "cancel" },
              { text: "Odhlásit", style: "destructive", onPress: () => void signOut() },
            ]);
          }}
        >
          <LogOut color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text className="text-base font-black text-white">Odhlásit</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
