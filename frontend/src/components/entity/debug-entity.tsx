import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEntity } from "../../context/hooks";

export const DebugEntity = ({
  entityUuid,
  close,
}: {
  entityUuid: string;
  close: () => void;
}) => {
  const entity = useEntity(entityUuid);

  return (
    <Dialog open onClose={close}>
      <DialogTitle>{entityUuid}</DialogTitle>

      <DialogContent>
        <Typography>{JSON.stringify(entity)}</Typography>
      </DialogContent>

      <DialogActions>
        <Button>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
