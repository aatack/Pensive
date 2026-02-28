import { ThemeProvider } from "@mui/material";
import { createRoot } from "react-dom/client";
import "./app.css";
import "../../fonts/fonts.css";
import { theme } from "./theme";
import { Tabs } from "../tabs";
import { MigrateTabsState } from "../../helpers/migration";
import { ProvideHotkeys } from "../../providers/hotkeys";
import { ProvidePensive } from "../provide-pensive";
import { TabsState } from "../tabs-hooks";
import { ProvideTool } from "../tool/provide-tool";

const App = () => {
  const migration: ((current: TabsState) => TabsState) | null = null;

  return (
    <ThemeProvider theme={theme}>
      {migration == null ? (
        <ProvidePensive>
          <ProvideHotkeys>
            <ProvideTool>
              <Tabs />
            </ProvideTool>
          </ProvideHotkeys>
        </ProvidePensive>
      ) : (
        <MigrateTabsState migration={migration} />
      )}
    </ThemeProvider>
  );
};

const root = createRoot(document.body);
root.render(<App />);
