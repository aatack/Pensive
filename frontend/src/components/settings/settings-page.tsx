import { Button, Stack, Tabs } from "@mui/material";
import { EditHotkeys } from "./edit-hotkeys";
import { useState } from "react";
import { IntegrationsPage } from "./integrations-page";

export const SettingsPage = () => {
  const [value, setValue] = useState("hotkeys");

  return (
    <>
      <Tabs>
        <SectionHeader
          value={value}
          setValue={setValue}
          id="hotkeys"
          name="Hotkeys"
        />
        <SectionHeader
          value={value}
          setValue={setValue}
          id="integrations"
          name="Integrations"
        />
      </Tabs>

      <Stack sx={{ overflowY: "scroll", padding: 2, flexGrow: 1 }}>
        {value === "hotkeys" && <EditHotkeys />}
        {value === "integrations" && <IntegrationsPage />}
      </Stack>
    </>
  );
};

const SectionHeader = ({
  value,
  setValue,
  id,
  name,
}: {
  value: string;
  id: string;
  name: string;
  setValue: (value: string) => void;
}) => {
  return (
    <Button
      variant={value === id ? "outlined" : undefined}
      onClick={() => setValue(id)}
      sx={{ textTransform: "none" }}
    >
      {name}
    </Button>
  );
};
