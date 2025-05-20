import { ReactNode } from "react";
import { usePersistentAtom } from "../helpers/atoms";
import { Provide, useProvided } from "./provider";
import { useHotkeys } from "react-hotkeys-hook";
import { OptionsOrDependencyArray } from "react-hotkeys-hook/dist/types";
import { defaultHotkeys } from "../constants";
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

export type Hotkeys = {
  toggleSections: string;

  search: string;
  cancelSearch: string;
  confirmSearch: string;

  closeTab: string;
  openTab: string;
  selectNextTab: string;
  selectPreviousTab: string;
  selectNextTabGroup: string;
  selectPreviousTabGroup: string;
  incrementTabGroup: string;
  decrementTabGroup: string;

  selectParent: string;
  selectFollowing: string;
  selectPreceding: string;

  pushFrame: string;
  popFrame: string;
  popFrameIntoTab: string; // Probably going to be removed soon

  addSection: string;
  addOpenEntity: string;
  addEntity: string;
  confirmAddEntity: string;
  cancelAddEntity: string;

  editEntity: string;
  toggleSection: string;
  toggleOpen: string;

  collapseEntity: string;
  expandEntity: string;

  debugEntity: string;

  startOutboundConnection: string;
  startInboundConnection: string;
  cancelConnection: string;
  moveConnection: string;
  cancelMoveConnection: string;
  removeConnection: string;
};

export const ProvideHotkeys = ({ children }: { children: ReactNode }) => {
  const hotkeys = usePersistentAtom<Partial<Hotkeys>>(
    "hotkeys",
    defaultHotkeys
  );

  return <Provide values={{ hotkeys }}>{children}</Provide>;
};

export const useHotkey = (
  key: keyof Hotkeys,
  callback: () => void,
  options?: OptionsOrDependencyArray
) => {
  const hotkey = useProvided("hotkeys").value?.[key];
  useHotkeys(hotkey ?? "", callback, options);
};

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
                  onChange={(e) =>
                    hotkeys.swap((current) => ({
                      ...current,
                      [hotkey]: e.target.value,
                    }))
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
