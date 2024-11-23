import { Stack, Typography } from "@mui/material";
import { Atom } from "../../helpers/atoms";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { colours } from "../../constants";

export const LabelledCheckbox = ({
  label,
  value,
}: {
  label: string;
  value: Atom<boolean | undefined>;
}) => {
  return (
    <Stack
      direction="row"
      onClick={() => value.swap((current) => !current)}
      alignItems="center"
      gap={1}
      sx={{ cursor: "pointer" }}
    >
      <Typography sx={{ userSelect: "none" }}>{label}</Typography>
      {value.value ? (
        <CheckCircleIcon fontSize="small" sx={{ color: colours.bl }} />
      ) : (
        <RadioButtonUncheckedIcon fontSize="small" sx={{ color: colours.bl }} />
      )}
    </Stack>
  );
};
