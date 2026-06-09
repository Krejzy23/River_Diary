import { CalendarDays, Clock3 } from "lucide-react-native";
import { ComponentType, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { formatDate, formatTime } from "../utils/date";

type DateTimeFieldProps = {
  label: string;
  minimumDate?: Date;
  onChange: (value: Date) => void;
  value: Date;
};

type PickerEvent = {
  type?: string;
};

type NativeDateTimePickerProps = {
  display: "compact" | "default";
  minimumDate?: Date;
  mode: "date" | "time";
  onChange: (event: PickerEvent, selectedDate?: Date) => void;
  value: Date;
};

declare function require(moduleName: string): {
  default: ComponentType<NativeDateTimePickerProps>;
};

const NativeDateTimePicker = require("@react-native-community/datetimepicker").default;

export function DateTimeField({ label, minimumDate, onChange, value }: DateTimeFieldProps) {
  const [activeMode, setActiveMode] = useState<"date" | "time" | null>(null);

  const handleChange = (event: PickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setActiveMode(null);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    onChange(selectedDate);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink-700">{label}</Text>
      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 flex-row items-center gap-2 rounded-lg border border-river-100 bg-river-50 px-3 py-3"
          onPress={() => setActiveMode("date")}
        >
          <CalendarDays color="#1D6E86" size={18} strokeWidth={2.5} />
          <View>
            <Text className="text-xs font-semibold uppercase text-ink-500">Datum</Text>
            <Text className="text-sm font-bold text-ink-900">{formatDate(value)}</Text>
          </View>
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center gap-2 rounded-lg border border-river-100 bg-river-50 px-3 py-3"
          onPress={() => setActiveMode("time")}
        >
          <Clock3 color="#1D6E86" size={18} strokeWidth={2.5} />
          <View>
            <Text className="text-xs font-semibold uppercase text-ink-500">Cas</Text>
            <Text className="text-sm font-bold text-ink-900">{formatTime(value)}</Text>
          </View>
        </Pressable>
      </View>

      {activeMode ? (
        <NativeDateTimePicker
          display={Platform.OS === "ios" ? "compact" : "default"}
          minimumDate={minimumDate}
          mode={activeMode}
          onChange={handleChange}
          value={value}
        />
      ) : null}
    </View>
  );
}
