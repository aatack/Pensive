import { Button, Stack, TextField, Typography } from "@mui/material";
import { arrayCursors, Atom } from "../../helpers/atoms";
import { Integration, useIntegrations } from "./integrations";
import { TextInput } from "../common/text";
import { colours, font } from "../../constants";

export const IntegrationsPage = () => {
  const integrations = useIntegrations();

  return (
    <>
      {arrayCursors(integrations).map((integration) => (
        <EditIntegration integration={integration} />
      ))}

      <Button
        onClick={() =>
          integrations.swap((current) => [...current, { hotkey: "", url: "" }])
        }
        sx={{ textTransform: "none" }}
      >
        New
      </Button>
    </>
  );
};

const EditIntegration = ({
  integration,
}: {
  integration: Atom<Integration>;
}) => {
  return (
    <Stack
      direction="row"
      gap={2}
      justifyContent="flex-start"
      alignItems="center"
      sx={{ py: 2 }}
    >
      <Typography sx={font}>Hotkey</Typography>
      <TextField
        variant="standard"
        size="small"
        fullWidth
        value={integration.value.hotkey}
        onChange={({ target: { value } }) =>
          integration.swap((current) => ({ ...current, hotkey: value }))
        }
        inputProps={{ sx: { p: 0.5, color: colours.tx, ...font } }}
        InputProps={{
          disableUnderline: true,
          sx: { margin: 0, padding: 0, border: "1px solid lightgrey" },
        }}
      />
      <Typography sx={font}>URL</Typography>
      <TextField
        variant="standard"
        size="small"
        fullWidth
        value={integration.value.url}
        onChange={({ target: { value } }) =>
          integration.swap((current) => ({ ...current, url: value }))
        }
        inputProps={{ sx: { p: 0.5, color: colours.tx, ...font } }}
        InputProps={{
          disableUnderline: true,
          sx: { margin: 0, padding: 0, border: "1px solid lightgrey" },
        }}
      />
    </Stack>
  );
};
