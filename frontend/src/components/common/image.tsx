import { useEffect, useLayoutEffect, useRef, useState, ReactNode } from "react";
import { useResource, useSwapEntity } from "../../context/hooks";
import { colours } from "../../constants";
import { Box, Typography } from "@mui/material";
import { nullIfEmpty } from "../../helpers/arrays";

export const RenderImage = ({
  entityId,
  note,
  name,
}: {
  entityId?: string;
  note: string;
  name: string;
}) => {
  const resource = useResource(note, name);
  const [containerRef, dimensions] = useDimensions<HTMLImageElement>();

  const imageRef = useRef<HTMLImageElement>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

  const removeImage = useRemoveImage()

  useEffect(() => {
    if (imageRef.current != null) {
      setNaturalWidth(imageRef.current.naturalWidth);
    }
  }, [imageRef.current]);

  const overflowing =
    naturalWidth == null || dimensions == null
      ? false
      : naturalWidth > dimensions.width;

  return resource == null ? (
    <Typography sx={{ color: colours.tx2 }}>{"Loading image..."}</Typography>
  ) : (
    <Box ref={containerRef} onDoubleClick={() => {
        if (entityId != null) {
            removeImage(entityId, note, name)
        }
    }}>
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
  children,
  entityId,
}: {
  children: ReactNode;
  entityId: string;
}) => {
  const addImage = useAddImage();

  const paste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = event.clipboardData.files[0];

    if (file != null) {
      addImage(entityId, file);
    }
  };

  return <Box onPaste={paste}>{children}</Box>;
};

const useAddImage = () => {
  const swapEntity = useSwapEntity();
  return (entityId: string, file: File) =>
    swapEntity(
      entityId,
      (current, note) => ({
        ...current,
        // No need to remove duplicates here since the note will always be new
        image: [...(current.image ?? []), { note, name: file.name }],
      }),
      { [file.name]: file }
    );
};

const useRemoveImage = () => {
  const swapEntity = useSwapEntity();
  return (entityId: string, note: string, name: string) =>
    swapEntity(entityId, (current) => ({
      ...current,
      image: nullIfEmpty(
        (current.image ?? []).filter(
          (image) => image.note !== note && image.name !== name
        )
      ),
    }));
};
