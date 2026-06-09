import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Droplets,
  Gauge,
  ListFilter,
  MapPin,
  RefreshCw,
  Waves,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import Rope from "../../assets/svg/rope.svg";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import {
  fetchPopularRiverFlows,
  RiverFlowOverview,
  RiverFlowSnapshot,
} from "../services/riverFlows";
import { RootStackParamList } from "../types/navigation";
import { formatDateTime } from "../utils/date";

function alertTone(tone: RiverFlowSnapshot["alert"]["tone"]) {
  if (tone === "danger") {
    return {
      badge: "bg-rose-100",
      label: "text-rose-800",
      rail: "bg-rose-500",
    };
  }

  if (tone === "warning") {
    return { badge: "bg-sun-100", label: "text-sun-800", rail: "bg-sun-500" };
  }

  if (tone === "good") {
    return {
      badge: "bg-reed-100",
      label: "text-reed-700",
      rail: "bg-reed-600",
    };
  }

  if (tone === "strong") {
    return {
      badge: "bg-river-100",
      label: "text-river-800",
      rail: "bg-river-700",
    };
  }

  return { badge: "bg-river-50", label: "text-ink-600", rail: "bg-ink-400" };
}

function overviewTone(flow: RiverFlowOverview) {
  if (
    flow.navigableSections.some((section) => section.alert.tone === "strong")
  ) {
    return alertTone("strong");
  }

  if (flow.navigableSections.some((section) => section.alert.tone === "good")) {
    return alertTone("good");
  }

  if (flow.navigableSections.length > 0) {
    return alertTone("warning");
  }

  if (flow.sections.some((section) => section.alert.tone === "unknown")) {
    return alertTone("unknown");
  }

  return alertTone("danger");
}

function getNavigableSummary(flow: RiverFlowOverview) {
  if (flow.navigableSections.length === 0) {
    return flow.sections.some((section) => section.levelCm === undefined)
      ? "Sjízdnost některých úseků nejde ověřit."
      : "Zatím bez jistého sjízdného úseku.";
  }

  return flow.navigableSections
    .map((section) => section.part.replace(" tok", ""))
    .join(", ");
}

function getBestSectionLabel(flow: RiverFlowOverview) {
  const strong = flow.navigableSections.find(
    (section) => section.alert.tone === "strong",
  );
  const good = flow.navigableSections.find(
    (section) => section.alert.tone === "good",
  );
  const navigable = strong ?? good ?? flow.navigableSections[0];

  return navigable
    ? navigable.alert.label +
        ": " +
        navigable.paddlingSectionName +
        " · " +
        navigable.difficulty
    : "Detail ukáže profily, limity a grafy";
}

function getFlowNavigabilityLabel(flow: RiverFlowOverview) {
  return flow.navigableSections.length + "/" + flow.sections.length + " sjízdné";
}

function FlowMetric({ label, value }: { label: string; value: string }) {
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

function RiverSelector({
  flows,
  isOpen,
  onSelect,
  onToggle,
  selectedRiver,
  totalNavigableSections,
  totalSections,
}: {
  flows: RiverFlowOverview[];
  isOpen: boolean;
  onSelect: (river: string | null) => void;
  onToggle: () => void;
  selectedRiver: string | null;
  totalNavigableSections: number;
  totalSections: number;
}) {
  const selectedFlow = flows.find((flow) => flow.river === selectedRiver);
  const selectedLabel = selectedFlow?.river ?? "Všechny řeky";
  const selectedSummary = selectedFlow
    ? getFlowNavigabilityLabel(selectedFlow)
    : totalNavigableSections + "/" + totalSections + " sjízdné";
  const ChevronIcon = isOpen ? ChevronUp : ChevronDown;

  return (
    <View className="overflow-hidden rounded-lg border border-river-100 bg-white shadow-sm shadow-ink-900/10">
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center gap-3 p-3.5"
        onPress={onToggle}
      >
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-river-700">
          <ListFilter color="#FFFFFF" size={19} strokeWidth={2.5} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-extrabold uppercase text-ink-500">
            Vyber řeku
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-lg font-black text-ink-900">
            {selectedLabel}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-xs font-black uppercase text-river-800">
            {selectedSummary}
          </Text>
          <ChevronIcon color="#1D6E86" size={20} strokeWidth={2.6} />
        </View>
      </Pressable>

      {isOpen ? (
        <View className="border-t border-river-100 bg-river-50 p-2">
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                className={
                  selectedRiver === null
                    ? "flex-row items-center justify-between gap-3 rounded-lg bg-ink-900 px-3 py-2.5"
                    : "flex-row items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5"
                }
                onPress={() => onSelect(null)}
              >
                <Text
                  className={
                    selectedRiver === null
                      ? "text-base font-black text-white"
                      : "text-base font-black text-ink-900"
                  }
                >
                  Všechny řeky
                </Text>
                <Text
                  className={
                    selectedRiver === null
                      ? "text-xs font-black uppercase text-river-100"
                      : "text-xs font-black uppercase text-river-800"
                  }
                >
                  {totalNavigableSections}/{totalSections} sjízdné
                </Text>
              </Pressable>

              {flows.map((flow) => {
                const selected = selectedRiver === flow.river;

                return (
                  <Pressable
                    accessibilityRole="button"
                    className={
                      selected
                        ? "flex-row items-center justify-between gap-3 rounded-lg bg-ink-900 px-3 py-2.5"
                        : "flex-row items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5"
                    }
                    key={flow.river}
                    onPress={() => onSelect(flow.river)}
                  >
                    <Text
                      numberOfLines={1}
                      className={
                        selected
                          ? "min-w-0 flex-1 text-base font-black text-white"
                          : "min-w-0 flex-1 text-base font-black text-ink-900"
                      }
                    >
                      {flow.river}
                    </Text>
                    <Text
                      className={
                        selected
                          ? "text-xs font-black uppercase text-river-100"
                          : "text-xs font-black uppercase text-river-800"
                      }
                    >
                      {getFlowNavigabilityLabel(flow)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function SectionChip({ section }: { section: RiverFlowSnapshot }) {
  const tone = alertTone(section.alert.tone);

  return (
    <View className={"rounded-full px-2.5 py-1.5 " + tone.badge}>
      <Text className={"text-[11px] font-black uppercase " + tone.label}>
        {section.part.replace(" tok", "")}
      </Text>
    </View>
  );
}

function FlowCard({
  flow,
  onPress,
}: {
  flow: RiverFlowOverview;
  onPress: () => void;
}) {
  const tone = overviewTone(flow);
  const navigableCount = flow.navigableSections.length;
  const sectionCount = flow.sections.length;

  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-lg border border-river-100 bg-white shadow-sm shadow-ink-900/10"
      onPress={onPress}
    >
      <View className={"h-1.5 " + tone.rail} />
      <View className="gap-3 p-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-black text-ink-900">
              {flow.river}
            </Text>
            <View className="mt-1 flex-row items-start gap-1.5">
              <MapPin color="#536271" size={15} strokeWidth={2.5} />
              <Text
                numberOfLines={2}
                className="flex-1 text-sm font-bold leading-5 text-ink-600"
              >
                {flow.riverDescription}
              </Text>
            </View>
          </View>

          <View className={"rounded-lg px-3 py-2 " + tone.badge}>
            <Text className={"text-xs font-black uppercase " + tone.label}>
              {navigableCount}/{sectionCount} sjízdné
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {flow.sections.map((section) => (
            <SectionChip key={section.gaugeId} section={section} />
          ))}
        </View>

        <View className="gap-2 rounded-lg bg-river-50 px-3 py-2.5">
          <View className="flex-row items-center gap-2">
            <Waves color="#1D6E86" size={17} strokeWidth={2.5} />
            <Text className="text-[11px] font-extrabold uppercase text-ink-500">
              Sjízdné úseky
            </Text>
          </View>
          <Text className="text-sm font-black leading-5 text-ink-900">
            {getNavigableSummary(flow)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3 rounded-lg border border-river-100 px-3 py-2.5">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Gauge color="#1D6E86" size={17} strokeWidth={2.5} />
            <Text
              numberOfLines={1}
              className="flex-1 text-sm font-black text-ink-900"
            >
              {getBestSectionLabel(flow)}
            </Text>
          </View>
          <ChevronRight color="#1D6E86" size={19} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

export function RiverFlowsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [flows, setFlows] = useState<RiverFlowOverview[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRiverSelectorOpen, setIsRiverSelectorOpen] = useState(false);
  const [selectedRiver, setSelectedRiver] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextFlows = await fetchPopularRiverFlows();
      setFlows(nextFlows);
    } catch {
      setErrorMessage("Aktuální průtoky se nepodařilo načíst.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlows();
  }, [loadFlows]);

  useEffect(() => {
    if (
      selectedRiver &&
      flows.length > 0 &&
      !flows.some((flow) => flow.river === selectedRiver)
    ) {
      setSelectedRiver(null);
    }
  }, [flows, selectedRiver]);

  const profileCount = useMemo(
    () => flows.reduce((sum, flow) => sum + flow.sections.length, 0),
    [flows],
  );
  const navigableRiverCount = useMemo(
    () => flows.filter((flow) => flow.navigableSections.length > 0).length,
    [flows],
  );
  const navigableSectionCount = useMemo(
    () => flows.reduce((sum, flow) => sum + flow.navigableSections.length, 0),
    [flows],
  );
  const displayedFlows = useMemo(
    () =>
      selectedRiver
        ? flows.filter((flow) => flow.river === selectedRiver)
        : flows,
    [flows, selectedRiver],
  );
  const latestMeasurement = flows
    .map((flow) => flow.latestMeasuredAt)
    .filter((value): value is string => Boolean(value))
    .sort(
      (left, right) => new Date(right).getTime() - new Date(left).getTime(),
    )[0];

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
                Průtoky
              </Text>
              <Text className="text-sm font-bold leading-5 text-river-100">
                Přehled řek podle sledovaných úseků, vodočtů a vodáckých
                limitů.
              </Text>
            </View>
            <View className="h-[74px] w-[74px] items-center justify-center rounded-lg bg-river-700">
              <Waves color="#FFFFFF" size={42} strokeWidth={2.3} />
            </View>
          </View>

          <View className="flex-row gap-2">
            <FlowMetric label="Řeky" value={String(flows.length)} />
            <FlowMetric label="Profily" value={String(profileCount)} />
            <FlowMetric
              label="Sjízdné úseky"
              value={String(navigableSectionCount)}
            />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-sun-100 p-2.5">
            <Droplets color="#946200" size={18} strokeWidth={2.4} />
            <Text
              numberOfLines={2}
              className="flex-1 text-[13px] font-bold leading-[18px] text-sun-800"
            >
              {latestMeasurement
                ? "Poslední aktualizace: " +
                  formatDateTime(latestMeasurement) +
                  ". Sjízdnost je orientační podle úsekových limitů."
                : "Data jsou z aktuálních ČHMÚ vodočtů a mohou být operativní."}
            </Text>
          </View>
        </View>
      </View>

      <RiverSelector
        flows={flows}
        isOpen={isRiverSelectorOpen}
        onSelect={(river) => {
          setSelectedRiver(river);
          setIsRiverSelectorOpen(false);
        }}
        onToggle={() => setIsRiverSelectorOpen((current) => !current)}
        selectedRiver={selectedRiver}
        totalNavigableSections={navigableSectionCount}
        totalSections={profileCount}
      />

      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-black text-ink-900">
            {selectedRiver ?? "Řeky v sezóně"}
          </Text>
          <Text className="text-sm font-semibold text-ink-600">
            {selectedRiver && displayedFlows[0]
              ? getFlowNavigabilityLabel(displayedFlows[0]) +
                " podle aktuálních limitů"
              : navigableRiverCount +
                " řek má aspoň jeden orientačně sjízdný úsek"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-lg bg-ink-900"
          disabled={isLoading}
          onPress={() => void loadFlows()}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <RefreshCw color="#FFFFFF" size={19} strokeWidth={2.5} />
          )}
        </Pressable>
      </View>

      {errorMessage ? (
        <EmptyState
          body="Zkontroluj připojení a zkus obnovit data."
          title={errorMessage}
        />
      ) : null}

      <View className="gap-3">
        {displayedFlows.map((flow) => (
          <FlowCard
            flow={flow}
            key={flow.river}
            onPress={() =>
              navigation.navigate("RiverFlowDetails", { river: flow.river })
            }
          />
        ))}
      </View>
    </Screen>
  );
}
