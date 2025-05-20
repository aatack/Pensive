import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
  Stack,
} from "@mui/material";
import { useProvided } from "../../providers/provider";
import { colours, defaultHotkeys, font } from "../../constants";
import { Hotkeys } from "../../providers/hotkeys";

export const EditHotkeys = () => {
  const hotkeys = useProvided("hotkeys");

  return (
    <Stack sx={{ overflowY: "scroll", padding: 2 }}>
      <Table>
        <TableBody>
          {Object.keys(defaultHotkeys).map((hotkey) => (
            <TableRow key={hotkey}>
              <TableCell sx={{ margin: 0, padding: 0 }}>
                <Typography variant="body1Monospace" fontWeight="bold">
                  {hotkey}
                </Typography>
              </TableCell>
              <TableCell sx={{ margin: 0, padding: 0 }}>
                <TextField
                  variant="standard"
                  size="small"
                  value={hotkeys.value[hotkey as keyof Hotkeys] ?? ""}
                  onChange={({ target: { value } }) =>
                    hotkeys.swap((current) => ({ ...current, [hotkey]: value }))
                  }
                  inputProps={{ sx: { p: 0.5, color: colours.tx, ...font } }}
                  InputProps={{
                    disableUnderline: true,
                    sx: { margin: 0, padding: 0 },
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
};
