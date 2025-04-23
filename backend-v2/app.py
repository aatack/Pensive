from datetime import datetime
import json
import os
from typing import Annotated
from uuid import UUID
from client import Client
from fastapi import FastAPI, Form, Response, UploadFile
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from reducers import array
from store import Store


app = FastAPI()

# Looks like it could probably be removed?
origins = ["http://localhost:3000", "localhost:3000"]


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
    logging.error(f"{request}: {exc_str}")
    content = {"status_code": 10422, "message": exc_str, "data": None}
    return JSONResponse(
        content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class State:
    client: Client = Client(
        dict(inbound=array, outbound=array),
        Store(os.environ.get("PENSIVE_PATH", ".pensive")),
        [],
    )


class Metadata(BaseModel):
    root: str | None


@app.get("/metadata")
async def metadata_endpoint() -> dict:
    client = State.client
    return dict(
        data=Metadata(root=None if (root := client.root_entity()) is None else root.hex)
    )


class Read(BaseModel):
    uuid: str
    timestamp: str | None = None


@app.post("/read")
def read_endpoint(read: Read) -> dict:
    client = State.client
    uuid = UUID(read.uuid)

    return dict(data=client.read_entities([uuid])[uuid])


@app.post("/write")
async def write_endpoint(
    timestamp: Annotated[str, Form()],
    entities: Annotated[str, Form()],
    resource_uuids: Annotated[str, Form()],
    resource_blobs: Annotated[list[UploadFile] | None | UploadFile, Form()] = None,
) -> dict:
    client = State.client

    # If there are no blobs, or just one, the type of the input may need coercing into a
    # list before it can be used
    resources: dict[UUID, bytes] = {
        UUID(uuid): await blob.read()
        for uuid, blob in zip(
            json.loads(resource_uuids),
            (
                []
                if resource_blobs is None
                else (
                    resource_blobs
                    if isinstance(resource_blobs, list)
                    else [resource_blobs]
                )
            ),
        )
    }

    client.write(
        datetime.fromisoformat(timestamp),
        {UUID(uuid): updates for uuid, updates in json.loads(entities).items()},
        resources,
    )

    return dict(data="OK", headers={"Content-Type": "application/json"})


class ReadResource(BaseModel):
    uuid: str


@app.post("/read-resource")
async def read_resource_endpoint(read_resource: ReadResource) -> Response:
    client = State.client
    uuid = UUID(read_resource.uuid)

    resource = client.read_resources([uuid])[uuid]

    return Response(content=resource)
