import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Anchor, KeyRound, Mail, Sailboat } from "lucide-react-native";

import Rope from "../../assets/svg/rope.svg";
import { AnchorPatternBackground } from "../components/AnchorPatternBackground";
import { isFirebaseConfigured } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

type AuthMode = "signIn" | "register";

const keyboardAvoidingBehavior = Platform.OS === "ios" ? "padding" : "height";
const keyboardDismissMode = Platform.OS === "ios" ? "interactive" : "on-drag";

export function AuthScreen() {
  const { error, register, resetPassword, signIn } = useAuth();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [notice, setNotice] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit() {
    setIsSubmitting(true);
    setNotice(null);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await signIn(email, password);
      }
    } catch {
      // Error state is handled by AuthProvider.
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setNotice("Nejdřív zadej e-mail pro obnovu hesla.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await resetPassword(email);
      setNotice("Poslal jsem e-mail pro obnovu hesla.");
    } catch {
      // Error state is handled by AuthProvider.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <AnchorPatternBackground opacity={0.08} />
      <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={keyboardDismissMode}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            <View className="gap-5">
              <View className="relative overflow-hidden rounded-lg border border-river-100 bg-white px-3 py-2.5 shadow-sm shadow-ink-900/10">
                <View className="absolute inset-0 opacity-10" pointerEvents="none">
                  <Rope height="100%" preserveAspectRatio="none" width="100%" />
                </View>

                <View className="relative z-10 gap-3">
                  <View className="min-h-[150px] gap-4 rounded-lg bg-ink-900 px-4 py-5">
                    <View className="h-14 w-14 items-center justify-center rounded-lg bg-river-700">
                      <Anchor color="#FFFFFF" size={32} strokeWidth={2.7} />
                    </View>

                    <View className="gap-1">
                      <Text className="text-[34px] font-black leading-[39px] text-white">
                        River Diary
                      </Text>
                      <Text className="text-sm font-bold leading-5 text-river-100">
                        Přihlas se a měj svoje sjezdy, posádky a kilometry bezpečně uložené.
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
                    <Sailboat color="#946200" size={18} strokeWidth={2.4} />
                    <Text className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800">
                      Jeden účet, jeden vodácký deník. Záznamy se ukládají do Firebase.
                    </Text>
                  </View>
                </View>
              </View>

              <View className="gap-4 rounded-lg border border-river-100 bg-white p-4 shadow-sm shadow-ink-900/10">
                <View className="flex-row rounded-lg bg-river-50 p-1">
                  <Pressable
                    className={!isRegister ? "flex-1 items-center rounded-lg bg-white py-2.5" : "flex-1 items-center rounded-lg py-2.5"}
                    onPress={() => setMode("signIn")}
                  >
                    <Text className={!isRegister ? "text-sm font-black text-river-700" : "text-sm font-black text-ink-500"}>
                      Login
                    </Text>
                  </Pressable>

                  <Pressable
                    className={isRegister ? "flex-1 items-center rounded-lg bg-white py-2.5" : "flex-1 items-center rounded-lg py-2.5"}
                    onPress={() => setMode("register")}
                  >
                    <Text className={isRegister ? "text-sm font-black text-river-700" : "text-sm font-black text-ink-500"}>
                      Registrace
                    </Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  <Text className="text-[13px] font-extrabold text-ink-700">E-mail</Text>
                  <View className="flex-row items-center gap-2 rounded-lg border border-river-100 bg-river-50 px-3">
                    <Mail color="#1D6E86" size={18} strokeWidth={2.4} />
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="email"
                      className="min-h-[48px] flex-1 text-base font-semibold text-ink-900"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      placeholder="email@example.com"
                      placeholderTextColor="#94A3B8"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      value={email}
                    />
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-[13px] font-extrabold text-ink-700">Heslo</Text>
                  <View className="flex-row items-center gap-2 rounded-lg border border-river-100 bg-river-50 px-3">
                    <KeyRound color="#1D6E86" size={18} strokeWidth={2.4} />
                    <TextInput
                      ref={passwordInputRef}
                      autoCapitalize="none"
                      className="min-h-[48px] flex-1 text-base font-semibold text-ink-900"
                      onChangeText={setPassword}
                      onSubmitEditing={() => void handleSubmit()}
                      placeholder="alespoň 6 znaků"
                      placeholderTextColor="#94A3B8"
                      returnKeyType="done"
                      secureTextEntry
                      textContentType="password"
                      value={password}
                    />
                  </View>
                </View>

                {!isFirebaseConfigured ? (
                  <Text className="rounded-lg bg-sun-100 p-3 text-[13px] font-bold leading-[18px] text-sun-800">
                    Firebase není nakonfigurovaný. Zkontroluj .env a restartuj Expo.
                  </Text>
                ) : null}
                {error ? (
                  <Text className="rounded-lg bg-rose-100 p-3 text-[13px] font-bold leading-[18px] text-rose-700">
                    {error}
                  </Text>
                ) : null}
                {notice ? (
                  <Text className="rounded-lg bg-emerald-100 p-3 text-[13px] font-bold leading-[18px] text-emerald-800">
                    {notice}
                  </Text>
                ) : null}

                <Pressable
                  className={isSubmitting || !isFirebaseConfigured ? "min-h-[52px] items-center justify-center rounded-lg bg-ink-600 px-5 py-3.5" : "min-h-[52px] items-center justify-center rounded-lg bg-ink-900 px-5 py-3.5"}
                  disabled={isSubmitting || !isFirebaseConfigured}
                  onPress={handleSubmit}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-black text-white">
                      {isRegister ? "Vytvořit účet" : "Přihlásit"}
                    </Text>
                  )}
                </Pressable>

                <Pressable disabled={isSubmitting || !isFirebaseConfigured} onPress={handleResetPassword}>
                  <Text className="text-center text-sm font-black text-river-700">
                    Zapomenuté heslo
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#F3FAFB",
    flex: 1,
    position: "relative",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
});
