import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEntity } from "../../context/hooks";
import { colours } from "../../constants";

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
      <Stack sx={{ backgroundColor: colours.ui }}>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontFamily: "monospace" }}>
            {entityUuid}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(entity, null, 2)}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button sx={{ textTransform: "none" }} onClick={close}>
            Close
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
};
