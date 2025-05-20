import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useProvided } from "../../providers/provider";
import { defaultHotkeys } from "../../constants";
import { Hotkeys } from "../../providers/hotkeys";

export const EditHotkeys = () => {
  const hotkeys = useProvided("hotkeys");

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography fontWeight="bold">Action</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight="bold">Hotkey</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(defaultHotkeys).map((hotkey) => (
            <TableRow key={hotkey}>
              <TableCell>
                <Typography variant="body1Monospace" fontWeight="bold">
                  {hotkey}
                </Typography>
              </TableCell>
              <TableCell>
                <TextField
                  variant="outlined"
                  size="small"
                  value={hotkeys.value[hotkey as keyof Hotkeys] ?? ""}
                  onChange={({ target: { value } }) =>
                    hotkeys.swap((current) => ({ ...current, [hotkey]: value }))
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
