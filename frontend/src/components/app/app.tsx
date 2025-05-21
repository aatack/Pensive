import { ThemeProvider } from "@mui/material";
import { createRoot } from "react-dom/client";
import { ProvidePensive } from "../pensive";
import "./app.css";
import "../../fonts/fonts.css";
import { theme } from "./theme";
import { ProvideTool } from "../tool/tool";
import { Tabs, TabsState } from "../tabs";
import { MigrateTabsState } from "../../helpers/migration";
import { ProvideHotkeys } from "../../providers/hotkeys";

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
