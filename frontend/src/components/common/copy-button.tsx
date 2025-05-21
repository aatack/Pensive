import { Stack } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAtom } from "../../helpers/atoms";
import DoneIcon from "@mui/icons-material/Done";

export const CopyButton = ({
  onClick,
  size,
}: {
  onClick: () => void;
  size?: number;
}) => {
  const copied = useAtom(false);
  const iconStyle = {
    fontSize: 14 * (size ?? 1),
    opacity: 0.5,
    cursor: "pointer",
  };

  return (
    <Stack
      direction="column"
      onClick={() => {
        onClick();
        copied.reset(true);
        setTimeout(() => copied.reset(false), 2000);
      }}
      sx={{ margin: 0.3 }}
    >
      {copied.value ? (
        <DoneIcon sx={iconStyle} />
      ) : (
        <ContentCopyIcon sx={iconStyle} />
      )}
    </Stack>
  );
};
