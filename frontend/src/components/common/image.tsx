import { useRef, ReactNode } from "react";
import { useResource, useWrite } from "../../context/hooks";
import { colours } from "../../constants";
import { Box, Stack, Typography } from "@mui/material";
import { generateUuid } from "../../helpers/uuid";
import { CopyButton } from "./copy-button";

export const RenderImage = ({ resourceUuid }: { resourceUuid: string }) => {
  const resource = useResource(resourceUuid);

  const imageRef = useRef<HTMLImageElement>(null);

  return resource == null ? (
    <Typography sx={{ color: colours.tx2 }}>{"Loading image..."}</Typography>
  ) : (
    <Stack direction="row" gap={0.5} sx={{ marginBottom: 0.5 }}>
      <img
        ref={imageRef}
        style={{ width: 400, objectFit: "fill" }}
        src={resource}
      />
      <CopyButton onClick={() => {}} />
    </Stack>
  );
};

export const PasteImage = ({
  entityUuid,
  children,
}: {
  entityUuid: string;
  children: ReactNode;
}) => {
  const addImage = useAddImage();

  const paste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = event.clipboardData.files[0];

    if (file != null) {
      addImage(entityUuid, file);
    }
  };

  return <Box onPaste={paste}>{children}</Box>;
};

const useAddImage = () => {
  const write = useWrite();
  return (entityUuid: string, file: File) => {
    const resourceUuid = generateUuid();
    return write(
      {
        [entityUuid]: { outbound: `+${resourceUuid}` },
        [resourceUuid]: { inbound: `+${entityUuid}`, image: true },
      },
      { [resourceUuid]: file }
    );
  };
};
