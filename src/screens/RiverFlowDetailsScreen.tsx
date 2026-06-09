import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { Droplets, Gauge, MapPin, RefreshCw, Waves } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import Rope from "../../assets/svg/rope.svg";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import {
  createPaddlingGuide,
  fetchRiverFlowSections,
  fetchRiverFlowSeries,
  NavigabilityAlert,
  NavigabilityTone,
  RiverFlowSeriesPoint,
  RiverFlowSnapshot,
} from "../services/riverFlows";
import { RootStackParamList } from "../types/navigation";
import { WaterConditionStatus } from "../types/trip";
import { formatDate, formatDateTime } from "../utils/date";

type RiverFlowDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "RiverFlowDetails"
>;

function formatFlow(value?: number) {
  if (value === undefined) {
    return "-";
  }

  if (value >= 100) {
    return value.toFixed(0);
  }

  if (value >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}

function formatLevel(value?: number) {
  return value === undefined ? "-" : value.toFixed(0);
}

function statusTone(status: WaterConditionStatus) {
  if (status === "dry" || status === "low") {
    return {
      badge: "bg-sun-100",
      label: "text-sun-800",
      rail: "bg-sun-500",
    };
  }

  if (status === "high" || status === "flood") {
    return {
      badge: "bg-rose-100",
      label: "text-rose-800",
      rail: "bg-rose-600",
    };
  }

  if (status === "good") {
    return {
      badge: "bg-reed-100",
      label: "text-reed-700",
      rail: "bg-reed-600",
    };
  }

  return {
    badge: "bg-river-100",
    label: "text-ink-600",
    rail: "bg-ink-400",
  };
}

function alertTone(tone: NavigabilityTone) {
  if (tone === "danger") {
    return {
      badge: "bg-rose-100",
      label: "text-rose-800",
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-sun-100",
      label: "text-sun-800",
    };
  }

  if (tone === "good") {
    return {
      badge: "bg-reed-100",
      label: "text-reed-700",
    };
  }

  if (tone === "strong") {
    return {
      badge: "bg-river-100",
      label: "text-river-800",
    };
  }

  return {
    badge: "bg-river-50",
    label: "text-ink-600",
  };
}

function DetailMetric({ label, value }: { label: string; value: string }) {
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

const CHART_WIDTH = 380;
const CHART_HEIGHT = 184;
const CHART_PADDING_X = 46;
const CHART_PADDING_Y = 16;
const FALLBACK_CHART_THRESHOLDS = [30, 40, 45, 50];

function getChartThresholds(section?: RiverFlowSnapshot) {
  if (!section) {
    return FALLBACK_CHART_THRESHOLDS;
  }

  return [
    section.paddlingLimits.minLevelCm,
    section.paddlingLimits.goodFromCm,
    section.paddlingLimits.goodToCm,
    section.paddlingLimits.tooHighCm,
  ];
}

function createChartScale(
  points: RiverFlowSeriesPoint[],
  thresholds: number[],
) {
  const values = points
    .map((point) => point.levelCm)
    .filter((value): value is number => value !== undefined);
  const allValues = [...values, ...thresholds];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = Math.max(maxValue - minValue, 1);
  const paddedMin = Math.max(0, minValue - range * 0.12);
  const paddedMax = maxValue + range * 0.12;

  return {
    max: paddedMax,
    min: paddedMin,
    values,
  };
}

function createLevelPath(
  points: RiverFlowSeriesPoint[],
  min: number,
  max: number
) {
  const levelPoints = points.filter(
    (point): point is RiverFlowSeriesPoint & { levelCm: number } =>
      point.levelCm !== undefined
  );

  if (levelPoints.length === 0) {
    return "";
  }

  const drawableWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const drawableHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  const range = Math.max(max - min, 1);

  return levelPoints
    .map((point, index) => {
      const x =
        CHART_PADDING_X +
        (levelPoints.length === 1
          ? drawableWidth / 2
          : (index / (levelPoints.length - 1)) * drawableWidth);
      const y =
        CHART_PADDING_Y + (1 - (point.levelCm - min) / range) * drawableHeight;

      return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    })
    .join(" ");
}

function getThresholdY(value: number, min: number, max: number) {
  const drawableHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  const range = Math.max(max - min, 1);

  return CHART_PADDING_Y + (1 - (value - min) / range) * drawableHeight;
}

function getLevelAxisTicks(min: number, max: number) {
  return [max, (min + max) / 2, min];
}

function getDateTickIndexes(points: RiverFlowSeriesPoint[]) {
  const levelPoints = points.filter((point) => point.levelCm !== undefined);

  if (levelPoints.length === 0) {
    return [];
  }

  if (levelPoints.length <= 3) {
    return levelPoints.map((_, index) => index);
  }

  return [0, Math.floor((levelPoints.length - 1) / 2), levelPoints.length - 1];
}

function formatChartDate(value: string) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return day + "." + month + ".";
}

function getTrendLabel(points: RiverFlowSeriesPoint[]) {
  const levels = points
    .filter(
      (point): point is RiverFlowSeriesPoint & { levelCm: number } =>
        point.levelCm !== undefined
    )
    .slice(-8);

  if (levels.length < 2) {
    return "trend neznámý";
  }

  const difference = levels[levels.length - 1].levelCm - levels[0].levelCm;

  if (Math.abs(difference) < 1) {
    return "stabilní";
  }

  return difference > 0 ? "stoupá" : "klesá";
}

function formatPointDate(value?: string) {
  return value ? formatDate(value) : "-";
}

function LevelTrendChart({
  isLoading,
  points,
  section,
}: {
  isLoading: boolean;
  points: RiverFlowSeriesPoint[];
  section?: RiverFlowSnapshot;
}) {
  const thresholds = getChartThresholds(section);
  const scale = createChartScale(points, thresholds);
  const path = createLevelPath(points, scale.min, scale.max);
  const levelPoints = points.filter(
    (point): point is RiverFlowSeriesPoint & { levelCm: number } =>
      point.levelCm !== undefined
  );
  const latestPoint = [...levelPoints].reverse()[0];
  const firstPoint = levelPoints[0];
  const dateTickIndexes = getDateTickIndexes(points);
  const levelAxisTicks = getLevelAxisTicks(scale.min, scale.max);
  const trend = getTrendLabel(points);

  return (
    <View className="gap-3 rounded-lg border border-river-100 bg-white p-3.5 shadow-sm shadow-ink-900/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-black text-ink-900">
            Denní vývoj hladiny
          </Text>
          <Text className="text-sm font-semibold leading-5 text-ink-600">
            {section
              ? section.paddlingSectionName + " - vodočet " + section.stationName
              : "Vyber úsek toku"}
          </Text>
        </View>
        <View className="rounded-lg bg-river-50 px-3 py-2">
          <Text className="text-xs font-black uppercase text-river-800">
            {trend}
          </Text>
        </View>
      </View>

      <View className="overflow-hidden rounded-lg border border-river-100 bg-river-50">
        <Svg
          height={CHART_HEIGHT}
          width="100%"
          viewBox={"0 0 " + CHART_WIDTH + " " + CHART_HEIGHT}
        >
          <Rect
            x="0"
            y="0"
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            fill="#F3FAFB"
          />
          {levelAxisTicks.map((tick) => {
            const y = getThresholdY(tick, scale.min, scale.max);

            return (
              <SvgText
                key={"axis-" + tick.toFixed(1)}
                x={CHART_PADDING_X - 20}
                y={y + 3}
                fill="#536271"
                fontSize="10"
                fontWeight="600"
                textAnchor="end"
              >
                {tick.toFixed(0)}{" "}cm
              </SvgText>
            );
          })}
          {dateTickIndexes.map((tickIndex) => {
            const levelPoint = levelPoints[tickIndex];
            const drawableWidth = CHART_WIDTH - CHART_PADDING_X * 2;
            const x =
              CHART_PADDING_X +
              (levelPoints.length === 1
                ? drawableWidth / 2
                : (tickIndex / (levelPoints.length - 1)) * drawableWidth);

            return (
              <Line
                key={levelPoint.measuredAt}
                x1={x}
                x2={x}
                y1={CHART_PADDING_Y}
                y2={CHART_HEIGHT - CHART_PADDING_Y}
                stroke="#94A3B8"
                strokeOpacity={0.28}
                strokeWidth={1}
              />
            );
          })}
          {thresholds.map((threshold, index) => {
            const y = getThresholdY(threshold, scale.min, scale.max);

            return (
              <Line
                key={String(index) + "-" + threshold}
                x1={CHART_PADDING_X}
                x2={CHART_WIDTH - CHART_PADDING_X}
                y1={y}
                y2={y}
                stroke={
                  index === 3
                    ? "#BE123C"
                    : index === 2
                    ? "#1D6E86"
                    : index === 1
                      ? "#2D6A4F"
                      : "#F5B83B"
                }
                strokeDasharray="4 5"
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
            );
          })}
          {path ? (
            <>
              <Path
                d={path}
                fill="none"
                opacity={0.22}
                stroke="#083344"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={8}
              />
              <Path
                d={path}
                fill="none"
                stroke="#0EA5C6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
              />
            </>
          ) : null}
          {latestPoint?.levelCm !== undefined ? (
            <Circle
              cx={CHART_WIDTH - CHART_PADDING_X}
              cy={getThresholdY(latestPoint.levelCm, scale.min, scale.max)}
              fill="#FFFFFF"
              r={5}
              stroke="#0EA5C6"
              strokeWidth={3}
            />
          ) : null}
          {dateTickIndexes.map((tickIndex) => {
            const levelPoint = levelPoints[tickIndex];
            const drawableWidth = CHART_WIDTH - CHART_PADDING_X * 2;
            const x =
              CHART_PADDING_X +
              (levelPoints.length === 1
                ? drawableWidth / 2
                : (tickIndex / (levelPoints.length - 1)) * drawableWidth);

            return (
              <SvgText
                key={levelPoint.measuredAt + "-label"}
                x={x}
                y={CHART_HEIGHT - 4}
                fill="#536271"
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                {formatChartDate(levelPoint.measuredAt)}
              </SvgText>
            );
          })}
        </Svg>

        {isLoading ? (
          <View className="absolute inset-0 items-center justify-center bg-white/70">
            <ActivityIndicator color="#1D6E86" />
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <DetailMetric
          label="Minimum"
          value={
            section
              ? formatLevel(section.paddlingLimits.minLevelCm) + " cm"
              : "-"
          }
        />
        <DetailMetric
          label="Dobrá od"
          value={
            section
              ? formatLevel(section.paddlingLimits.goodFromCm) + " cm"
              : "-"
          }
        />
        <DetailMetric label="Dny" value={String(points.length)} />
      </View>

      <View className="flex-row gap-2">
        <DetailMetric
          label="Od"
          value={formatPointDate(firstPoint?.measuredAt)}
        />
        <DetailMetric
          label="Do"
          value={formatPointDate(latestPoint?.measuredAt)}
        />
        <DetailMetric
          label="Aktuálně"
          value={
            latestPoint?.levelCm !== undefined
              ? latestPoint.levelCm.toFixed(0) + " cm"
              : "-"
          }
        />
      </View>
    </View>
  );
}

function GuideRow({ description, label, tone }: NavigabilityAlert) {
  const colors = alertTone(tone);

  return (
    <View className="flex-row items-start gap-2 rounded-lg bg-river-50 px-3 py-2.5">
      <View className={"rounded-lg px-2.5 py-1 " + colors.badge}>
        <Text className={"text-xs font-black " + colors.label}>{label}</Text>
      </View>
      <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-ink-700">
        {description}
      </Text>
    </View>
  );
}

function SectionCard({ section }: { section: RiverFlowSnapshot }) {
  const waterTone = statusTone(section.status);
  const boatTone = alertTone(section.alert.tone);

  return (
    <View className="overflow-hidden rounded-lg border border-river-100 bg-white shadow-sm shadow-ink-900/10">
      <View className={"h-1.5 " + waterTone.rail} />
      <View className="gap-3 p-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-black text-ink-900">
              {section.paddlingSectionName}
            </Text>
            <Text className="mt-0.5 text-sm font-bold leading-5 text-ink-600">
              {section.sectionDescription}
            </Text>
          </View>
          <View className={"rounded-lg px-3 py-2 " + boatTone.badge}>
            <Text className={"text-xs font-black uppercase " + boatTone.label}>
              {section.alert.label}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <DetailMetric
            label="Minimum"
            value={formatLevel(section.paddlingLimits.minLevelCm) + " cm"}
          />
          <DetailMetric
            label="Dobrá voda"
            value={
              formatLevel(section.paddlingLimits.goodFromCm) +
              "-" +
              formatLevel(section.paddlingLimits.goodToCm)
            }
          />
          <DetailMetric
            label="Horní limit"
            value={formatLevel(section.paddlingLimits.tooHighCm) + " cm"}
          />
        </View>


        <View className="flex-row gap-2">
          <View className="flex-1 rounded-lg bg-ink-900 px-3 py-3">
            <Text className="text-[11px] font-black uppercase text-river-100">
              Průtok
            </Text>
            <View className="mt-1 flex-row items-end gap-1">
              <Text className="text-[30px] font-black leading-[34px] text-white">
                {formatFlow(section.flowM3s)}
              </Text>
              <Text className="pb-1 text-sm font-black text-river-100">
                m³/s
              </Text>
            </View>
          </View>


          <View className="w-[102px] rounded-lg bg-river-50 px-3 py-3">
            <Text className="text-[11px] font-black uppercase text-ink-500">
              Hladina
            </Text>
            <View className="mt-1 flex-row items-end gap-1">
              <Text className="text-[26px] font-black leading-[31px] text-ink-900">
                {formatLevel(section.levelCm)}
              </Text>
              <Text className="pb-1 text-xs font-black text-ink-500">cm</Text>
            </View>
          </View>
        <DetailMetric label="Obtížnost" value={section.difficulty} />
        </View>

        <View className="gap-2 rounded-lg bg-river-50 p-3">
          <View className="flex-row items-start gap-2">
            <Gauge color="#1D6E86" size={18} strokeWidth={2.5} />
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-extrabold uppercase text-ink-500">
                Vodočet
              </Text>
              <Text className="mt-0.5 text-sm font-black leading-5 text-ink-900">
                {section.stationName} ({section.gaugeId})
              </Text>
              <Text className="mt-0.5 text-sm font-semibold leading-5 text-ink-600">
                Vodácký úsek: {section.paddlingSectionName}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2">
            <MapPin color="#1D6E86" size={18} strokeWidth={2.5} />
            <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-ink-700">
              {section.measuredAt
                ? "Měření: " + formatDateTime(section.measuredAt)
                : "Aktuální měření není dostupné."}
            </Text>
          </View>
        </View>

        <View className={"rounded-lg px-3 py-2.5 " + boatTone.badge}>
          <Text className={"text-sm font-black " + boatTone.label}>
            {section.alert.description}
          </Text>
        </View>

        <View className="rounded-lg bg-river-50 px-3 py-2.5">
          <Text className="text-[11px] font-extrabold uppercase text-ink-500">
            Kalibrace
          </Text>
          <Text className="mt-1 text-sm font-semibold leading-5 text-ink-700">
            {section.paddlingLimits.note}
          </Text>
          <Text className="mt-1 text-xs font-black uppercase text-river-800">
            {section.paddlingLimits.sourceLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function RiverFlowDetailsScreen({ route }: RiverFlowDetailsScreenProps) {
  const { river } = route.params;
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<RiverFlowSnapshot[]>([]);
  const [selectedPart, setSelectedPart] = useState("Střední tok");
  const [series, setSeries] = useState<RiverFlowSeriesPoint[]>([]);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);

  const loadSections = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextSections = await fetchRiverFlowSections(river);
      setSections(nextSections);
    } catch {
      setErrorMessage("Úseky řeky se nepodařilo načíst.");
    } finally {
      setIsLoading(false);
    }
  }, [river]);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  const selectedSection =
    sections.find((section) => section.part === selectedPart) ?? sections[0];
  const selectedGuide = selectedSection
    ? createPaddlingGuide(selectedSection.paddlingLimits)
    : [];

  useEffect(() => {
    if (!selectedSection) {
      setSeries([]);
      return;
    }

    setIsSeriesLoading(true);
    void fetchRiverFlowSeries(selectedSection.gaugeId)
      .then(setSeries)
      .catch(() => setSeries([]))
      .finally(() => setIsSeriesLoading(false));
  }, [selectedSection?.gaugeId]);

  const latestMeasurement = sections.find(
    (section) => section.measuredAt
  )?.measuredAt;
  const goodSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          section.alert.tone === "good" || section.alert.tone === "strong"
      ).length,
    [sections]
  );

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
                {river}
              </Text>
              <Text className="text-sm font-bold leading-5 text-river-100">
                Úseky toku, vodočty a orientační sjízdnost podle lokálních
                limitů.
              </Text>
            </View>
            <View className="h-[74px] w-[74px] items-center justify-center rounded-lg bg-river-700">
              <Waves color="#FFFFFF" size={42} strokeWidth={2.3} />
            </View>
          </View>

          <View className="flex-row gap-2">
            <DetailMetric label="Úseky" value={String(sections.length)} />
            <DetailMetric label="Sjízdné" value={String(goodSections)} />
            <DetailMetric
              label="Měření"
              value={
                latestMeasurement ? formatDateTime(latestMeasurement) : "-"
              }
            />
          </View>
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-3.5 shadow-sm shadow-ink-900/10">
        <View className="flex-row flex-wrap gap-2">
          {sections.map((section) => {
            const selected = selectedSection?.part === section.part;

            return (
              <Pressable
                accessibilityRole="button"
                className={
                  selected
                    ? "rounded-lg border border-ink-900 bg-ink-900 px-3 py-2"
                    : "rounded-lg border border-river-100 bg-river-50 px-3 py-2"
                }
                key={section.part}
                onPress={() => setSelectedPart(section.part)}
              >
                <Text
                  className={
                    selected
                      ? "text-sm font-black text-white"
                      : "text-sm font-black text-ink-700"
                  }
                >
                  {section.part}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <LevelTrendChart
        isLoading={isSeriesLoading}
        points={series}
        section={selectedSection}
      />

      <View className="gap-3 rounded-lg border border-river-100 bg-white p-3.5 shadow-sm shadow-ink-900/10">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-black text-ink-900">
              Vodácký alert
            </Text>
            <Text className="text-sm font-semibold leading-5 text-ink-600">
              Limity pro vybraný úsek. Čísla jsou startovní kalibrace a půjdou
              doladit podle reálné zkušenosti.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-lg bg-ink-900"
            disabled={isLoading}
            onPress={() => void loadSections()}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <RefreshCw color="#FFFFFF" size={19} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>

        <View className="gap-2">
          {selectedGuide.map((guide) => (
            <GuideRow {...guide} key={guide.label} />
          ))}
        </View>
      </View>

      {errorMessage ? (
        <EmptyState
          body="Zkontroluj připojení a zkus obnovit data."
          title={errorMessage}
        />
      ) : null}

      <View className="gap-3">
        {sections.map((section) => (
          <SectionCard key={section.gaugeId} section={section} />
        ))}
      </View>
    </Screen>
  );
}
