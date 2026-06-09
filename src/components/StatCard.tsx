import { Text, View } from "react-native";

type StatCardProps = {
  label: string;
  tone?: "default" | "river" | "reed";
  value: string;
};

export function StatCard({ label, tone = "default", value }: StatCardProps) {
  const valueColor = {
    default: "text-ink-900",
    reed: "text-reed-700",
    river: "text-river-700",
  }[tone];

  return (
    <View className="flex-1 rounded-lg bg-white px-4 py-3">
      <Text className="text-xs font-semibold uppercase text-ink-500">{label}</Text>
      <Text className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
}
