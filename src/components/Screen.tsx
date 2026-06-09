import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnchorPatternBackground } from "./AnchorPatternBackground";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  patternOpacity?: number;
};

export function Screen({
  children,
  scroll = true,
  patternOpacity = 0.045,
}: ScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <AnchorPatternBackground opacity={patternOpacity} />

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.contentLayer}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.contentLayer, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#F3FAFB",
    flex: 1,
    position: "relative",
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    gap: 24,
    paddingBottom: 112,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
