export const openTopoMapStyle = {
  version: 8,
  sources: {
    openTopoMap: {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)",
    },
  },
  layers: [
    {
      id: "openTopoMap",
      type: "raster",
      source: "openTopoMap",
      paint: {
        "raster-saturation": -0.08,
        "raster-contrast": 0.06,
      },
    },
  ],
} as const;
