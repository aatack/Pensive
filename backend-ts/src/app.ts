import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { Client, generateUuid } from "@pensive/common"; // Adjust path as needed
import { json as bodyParserJson } from "body-parser";

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParserJson());
app.use(express.urlencoded({ extended: true }));

const client: Client = {} as Client;

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`${req.method} ${req.url} - ${err.message}`);
  res.status(422).json({
    status_code: 10422,
    message: err.message,
    data: null,
  });
});

app.get("/metadata", (_: Request, res: Response) => {
  let root = client.rootEntity();

  if (root == null) {
    root = generateUuid();
    client.write(new Date(), { [root]: { text: "Root" } }, {});
  }

  res.json({ data: { root } });
});

app.post("/read", (req: Request, res: Response) => {
  const uuid: string = req.body.uuid;
  const data = client.readEntities([uuid])[uuid] ?? {};
  res.json({ data });
});

app.post(
  "/write",
  upload.array("resource_blobs"),
  async (req: Request, res: Response) => {
    const timestamp = new Date(req.body.timestamp);
    const entities: { [uuid: string]: any } = JSON.parse(req.body.entities);
    const resourceUuids: string[] = JSON.parse(req.body.resource_uuids);

    const files = (req.files as Express.Multer.File[]) || [];

    const resources: { [uuid: string]: Buffer } = {};
    resourceUuids.forEach((uuid, index) => {
      const file = files[index];
      if (file) resources[uuid] = file.buffer;
    });

    const typedEntities: { [uuid: string]: any } = {};
    for (const [uuid, updates] of Object.entries(entities)) {
      typedEntities[uuid] = updates;
    }

    client.write(timestamp, typedEntities, resources);

    res.json({ data: "OK" });
  }
);

app.post("/read-resource", (req: Request, res: Response) => {
  const uuid: string = req.body.uuid;
  const resource = client.readResources([uuid])[uuid];
  res.send(resource);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
