import { Text, View } from "react-native";

type EmptyStateProps = {
  body: string;
  title: string;
};

export function EmptyState({ body, title }: EmptyStateProps) {
  return (
    <View className="gap-1 rounded-lg border border-dashed border-river-200 bg-white px-4 py-5">
      <Text className="font-bold text-ink-900">{title}</Text>
      <Text className="text-sm text-ink-600">{body}</Text>
    </View>
  );
}
