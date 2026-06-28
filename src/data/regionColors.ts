export type RegionColor = {
  main: string;
  soft: string;
  ink: string;
  sparkle: string;
};

export const regionColors: Record<string, RegionColor> = {
  "hokkaido-tohoku": {
    main: "#55c7f7",
    soft: "#dff7ff",
    ink: "#126782",
    sparkle: "#8ee8ff"
  },
  kanto: {
    main: "#ff85b3",
    soft: "#ffe6f0",
    ink: "#a72863",
    sparkle: "#ffc1dc"
  },
  chubu: {
    main: "#8bd450",
    soft: "#ecffd9",
    ink: "#3d7a18",
    sparkle: "#cafb77"
  },
  kinki: {
    main: "#b28cff",
    soft: "#f1e9ff",
    ink: "#6140b7",
    sparkle: "#d9c2ff"
  },
  "chugoku-shikoku": {
    main: "#ffb84d",
    soft: "#fff1d6",
    ink: "#9a5a00",
    sparkle: "#ffd580"
  },
  "kyushu-okinawa": {
    main: "#ff7a66",
    soft: "#ffe7e2",
    ink: "#a93626",
    sparkle: "#ffb0a4"
  }
};

export const neutralPuzzleColor: RegionColor = {
  main: "#c8bfa0",
  soft: "#f5f0e8",
  ink: "#4a3f28",
  sparkle: "#ddd5b8"
};

export function getRegionColor(regionId: string): RegionColor {
  return (
    regionColors[regionId] ?? {
      main: "#52d1c5",
      soft: "#e5fbf7",
      ink: "#16645f",
      sparkle: "#a5f3e8"
    }
  );
}
