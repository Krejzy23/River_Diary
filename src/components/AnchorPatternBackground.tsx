import { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Svg, { G, Path } from "react-native-svg";

const TILE_WIDTH = 80;
const TILE_HEIGHT = 80;

const ANCHOR_PATH =
  "M14 16H9v-2h5V9.87a4 4 0 1 1 2 0V14h5v2h-5v15.95A10 10 0 0 0 23.66 27l-3.46-2 8.2-2.2-2.9 5a12 12 0 0 1-21 0l-2.89-5 8.2 2.2-3.47 2A10 10 0 0 0 14 31.95V16zm40 40h-5v-2h5v-4.13a4 4 0 1 1 2 0V54h5v2h-5v15.95A10 10 0 0 0 63.66 67l-3.47-2 8.2-2.2-2.88 5a12 12 0 0 1-21.02 0l-2.88-5 8.2 2.2-3.47 2A10 10 0 0 0 54 71.95V56zm-39 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm40-40a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM15 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm40 40a2 2 0 1 0 0-4 2 2 0 0 0 0 4z";

type AnchorPatternBackgroundProps = {
  opacity?: number;
  color?: string;
};

export function AnchorPatternBackground({
  opacity = 0.06,
  color = "#102A43",
}: AnchorPatternBackgroundProps) {
  const { height, width } = useWindowDimensions();

  const tiles = useMemo(() => {
    const columns = Math.ceil(width / TILE_WIDTH) + 1;
    const rows = Math.ceil(height / TILE_HEIGHT) + 1;

    return Array.from({ length: rows * columns }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      return {
        key: `${row}-${column}`,
        x: column * TILE_WIDTH,
        y: row * TILE_HEIGHT,
      };
    });
  }, [height, width]);

  return (
    <Svg height={height} pointerEvents="none" style={styles.background} width={width}>
      {tiles.map((tile) => (
        <G key={tile.key} x={tile.x} y={tile.y}>
          <Path d={ANCHOR_PATH} fill={color} fillOpacity={opacity} />
        </G>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
