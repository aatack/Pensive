import { useLayoutEffect, useRef, useState, ReactNode } from "react";
import { useResource, useWrite } from "../../context/hooks";
import { colours } from "../../constants";
import { Box, Typography } from "@mui/material";
import { generateUuid } from "../../helpers/uuid";

export const RenderImage = ({ resourceUuid }: { resourceUuid: string }) => {
  const resource = useResource(resourceUuid);
  const [containerRef] = useDimensions<HTMLImageElement>();

  const imageRef = useRef<HTMLImageElement>(null);

  return resource == null ? (
    <Typography sx={{ color: colours.tx2 }}>{"Loading image..."}</Typography>
  ) : (
    <Box ref={containerRef}>
      <img
        ref={imageRef}
        style={{ width: 400, objectFit: "fill" }}
        src={resource}
      />
    </Box>
  );
};

const useDimensions = <T extends HTMLElement>() => {
  const ref = useRef<T>();
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  /* Note: this hook sometimes doesn't fire properly when the element being
    measured is half on the screen and half off it.  Not really sure why that
    is. */
  useLayoutEffect(() => {
    const current = ref.current;
    if (current != null) {
      const { width, height } = current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [ref.current]);
  return [ref, dimensions] as const;
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
        [entityUuid]: { outbound: [`+${resourceUuid}`] },
        [resourceUuid]: { inbound: [`+${entityUuid}`], image: true },
      },
      { [resourceUuid]: file }
    );
  };
};
