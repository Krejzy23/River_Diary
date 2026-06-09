import { Text, TextInput, TextInputProps, View } from "react-native";

type FieldProps = TextInputProps & {
  className?: string;
  label: string;
};

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink-700">{label}</Text>
      <TextInput
        className={`rounded-lg border border-river-100 bg-white px-4 py-3 text-base text-ink-900 ${className}`}
        placeholderTextColor="#7B8794"
        {...props}
      />
    </View>
  );
}
