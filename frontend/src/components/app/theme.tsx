import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  typography: {
    fontFamily: "Source Sans Pro, sans-serif",
    body1: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body1Written: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
      fontFamily: "LibreCaslonText, serif",
    },
    body1Monospace: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.6,
      fontFamily: "Source Code Pro, monospace",
    },
  },
  palette: {
    primary: { main: "#205EA6", light: "#205EA6", dark: "#4385BE" },
    secondary: { main: "#AD8301", light: "#AD8301", dark: "#D0A215" },
    error: { main: "#AF3029", light: "#AF3029", dark: "#D14D41" },
    warning: { main: "#BC5215", light: "#BC5215", dark: "#DA702C" },
    info: { main: "#24837B", light: "#24837B", dark: "#3AA99F" },
    success: { main: "#66800B", light: "#66800B", dark: "#879A39" },
    tx: { main: "#100F0F", light: "#100F0F", dark: "#CECDC3" },
    "tx-2": { main: "#6F6E69", light: "#6F6E69", dark: "#878580" },
    "tx-3": { main: "#B7B5AC", light: "#B7B5AC", dark: "#575653" },
    "ui-3": { main: "#CECDC3", light: "#CECDC3", dark: "#403E3C" },
    "ui-2": { main: "#DAD8CE", light: "#DAD8CE", dark: "#343331" },
    ui: { main: "#E6E4D9", light: "#E6E4D9", dark: "#282726" },
    "bg-2": { main: "#F2F0E5", light: "#F2F0E5", dark: "#1C1B1A" },
    bg: { main: "#FFFCF0", light: "#FFFCF0", dark: "#100F0F" },
    pu: { main: "#5E409D", light: "#5E409D", dark: "#8B7EC8" },
    ma: { main: "#A02F6F", light: "#A02F6F", dark: "#CE5D97" },
  },
});

declare module "@mui/material/styles" {
  interface TypographyVariants {
    body1Monospace: React.CSSProperties;
    body1Written: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body1Monospace?: React.CSSProperties;
    body1Written?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body1Monospace: true;
    body1Written: true;
  }
}

declare module "@mui/material/styles" {
  interface Palette {
    data: {
      blue: "#838feb";
      pink: "#e159ff";
      lightblue: "#13bfcf";
      orange: "#f0ac00";
      green: "#3dd600";
      red: "#ff6459";
    };
  }

  interface PaletteOptions {
    data?: {
      blue: "#838feb";
      pink: "#e159ff";
      lightblue: "#13bfcf";
      orange: "#f0ac00";
      green: "#3dd600";
      red: "#ff6459";
    };
  }
}

declare module "@mui/material/styles" {
  interface Palette {
    tx: Palette["primary"];
    "tx-2": Palette["primary"];
    "tx-3": Palette["primary"];
    "ui-3": Palette["primary"];
    "ui-2": Palette["primary"];
    ui: Palette["primary"];
    "bg-2": Palette["primary"];
    bg: Palette["primary"];
    pu: Palette["primary"];
    ma: Palette["primary"];
  }

  interface PaletteOptions {
    tx?: PaletteOptions["primary"];
    "tx-2": PaletteOptions["primary"];
    "tx-3": PaletteOptions["primary"];
    "ui-3": PaletteOptions["primary"];
    "ui-2": PaletteOptions["primary"];
    ui: PaletteOptions["primary"];
    "bg-2": PaletteOptions["primary"];
    bg: PaletteOptions["primary"];
    pu: PaletteOptions["primary"];
    ma: PaletteOptions["primary"];
  }
}
