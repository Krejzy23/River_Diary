import "./global.css";

import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Gauge,
  History,
  Home,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import PlusWheel from "./assets/svg/wheels.svg";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TripsProvider } from "./src/context/TripsContext";
import { AddTripScreen } from "./src/screens/AddTripScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { EditTripScreen } from "./src/screens/EditTripScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { OverviewScreen } from "./src/screens/OverviewScreen";
import { RiverFlowDetailsScreen } from "./src/screens/RiverFlowDetailsScreen";
import { RiverFlowsScreen } from "./src/screens/RiverFlowsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TripDetailsScreen } from "./src/screens/TripDetailsScreen";
import { MainTabParamList, RootStackParamList } from "./src/types/navigation";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F3FAFB",
    border: "#D6EDEA",
    card: "#FFFFFF",
    primary: "#1D6E86",
    text: "#102A43",
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1D6E86",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D6EDEA",
          height: 82,
          paddingBottom: 18,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Overview: Home,
            Flows: Gauge,
            AddTrip: Plus,
            History: History,
            Settings: SettingsIcon,
          };

          const Icon = icons[route.name];

          return (
            <Icon
              color={route.name === "AddTrip" && focused ? "#FFFFFF" : color}
              size={route.name === "AddTrip" ? 30 : size}
              strokeWidth={2.4}
            />
          );
        },
      })}
    >
      <Tab.Screen
        component={OverviewScreen}
        name="Overview"
        options={{ title: "Přehled" }}
      />

      <Tab.Screen
        component={RiverFlowsScreen}
        name="Flows"
        options={{ title: "Průtoky" }}
      />

      <Tab.Screen
        component={AddTripScreen}
        name="AddTrip"
        options={{
          title: "Přidat",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <View
              className="-mt-6 h-16 w-16 items-center justify-center rounded-full border-4 border-white shadow-lg shadow-ink-900/20"
              style={{ backgroundColor: focused ? "#ba210d" : "#218099" }}
            >
              <PlusWheel width={80} height={80} />
              <View className="absolute">
                <Plus color="#D6EDEA" size={28} strokeWidth={3} />
              </View>
            </View>
          ),
        }}
      />

      <Tab.Screen
        component={HistoryScreen}
        name="History"
        options={{ title: "Historie" }}
      />

      <Tab.Screen
        component={SettingsScreen}
        name="Settings"
        options={{ title: "Nastavení" }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: "#F3FAFB",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#1D6E86" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <TripsProvider ownerId={user.uid}>
      <NavigationContainer theme={navigationTheme}>
        <RootStack.Navigator
          screenOptions={{
            contentStyle: { backgroundColor: "#F3FAFB" },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#F3FAFB" },
            headerTintColor: "#102A43",
            headerTitleStyle: { fontWeight: "800" },
          }}
        >
          <RootStack.Screen
            component={MainTabs}
            name="MainTabs"
            options={{ headerShown: false }}
          />

          <RootStack.Screen
            component={EditTripScreen}
            name="EditTrip"
            options={{ title: "Upravit výlet" }}
          />

          <RootStack.Screen
            component={TripDetailsScreen}
            name="TripDetails"
            options={{ title: "Detail výletu" }}
          />

          <RootStack.Screen
            component={RiverFlowDetailsScreen}
            name="RiverFlowDetails"
            options={({ route }) => ({ title: route.params.river })}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </TripsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppContent />
    </AuthProvider>
  );
}
