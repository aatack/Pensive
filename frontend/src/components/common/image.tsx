import { useRef, ReactNode } from "react";
import { useResource, useWrite } from "../../context/hooks";
import { colours, server } from "../../constants";
import { Box, Stack, Typography } from "@mui/material";
import { generateUuid } from "../../helpers/uuid";
import { CopyButton } from "./copy-button";
import { pensiveReadResource } from "../../api/endpoints";

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
      <CopyButton
        onClick={async () => {
          // Fetching the image from the object URL violates some security
          // policy, so it needs to be loaded from the server again instead
          fetch(`${server}/read-resource`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid: resourceUuid }),
          })
            .then((response) => response.arrayBuffer())
            .then((buffer) => new Blob([buffer], { type: "image/png" }))
            .then((blob) =>
              navigator.clipboard.write([
                new ClipboardItem({
                  [blob.type]: blob,
                }),
              ])
            );
        }}
      />
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
