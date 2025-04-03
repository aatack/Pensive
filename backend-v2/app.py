from collections import defaultdict
import json
import os
from typing import Annotated, Any
from fastapi import FastAPI, Form, Response, UploadFile
from pydantic import BaseModel

from aliases import Json
from models.pensive import Pensive
from models.timestamp import Timestamp
from models.trait import Trait

from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

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
    pensive = Pensive.load(os.getenv("PENSIVE_ROOT", "."))


@app.on_event("shutdown")
def on_shutdown():
    print("Saving pensive...")
    State.pensive.save()
    print("Finished saving pensive")


class Metadata(BaseModel):
    offset: int
    note: str


@app.get("/metadata")
async def metadata_endpoint() -> dict:
    pensive = State.pensive
    return dict(data=Metadata(offset=pensive.offset, note=str(pensive.note)))


@app.post("/save")
async def save_endpoint() -> bool:
    pensive = State.pensive
    return pensive.save()


class Read(BaseModel):
    item: str
    note: str | None = None


@app.post("/read")
def read_endpoint(read: Read) -> dict:
    pensive = State.pensive

    item = Timestamp.parse(read.item)
    note = None if read.note is None else Timestamp.parse(read.note)

    chunk = pensive.chunk(item)

    # This should ultimately be replaced with a `get_item` method on the pensive
    return dict(data=State.pensive.get_chunk(chunk, note=note).get(item, {}))


class Write(BaseModel):
    note: str
    inputs: dict[Annotated[str, Timestamp], dict[Annotated[str, Trait], Any]]


@app.post("/write")
async def write_endpoint(
    note: Annotated[str, Form()],
    inputs: Annotated[str, Form()],
    names: Annotated[str, Form()],
    blobs: Annotated[list[UploadFile] | None | UploadFile, Form()] = None,
) -> dict:
    pensive = State.pensive
    formatted_note = Timestamp.parse(note)

    # Inputs arrive with keys in a raw string format, and in the more convenient (for
    # the frontend) item to trait to value mapping.  This must be converted into a new
    # format, more convenient for the backend, where keys are named tuples and the order
    # is trait to item to value
    formatted_inputs: dict[Trait, dict[Timestamp, Json]] = defaultdict(dict)
    for item, trait_map in json.loads(inputs).items():
        for trait, snapshot in trait_map.items():
            formatted_inputs[pensive.trait_by_name[trait]][
                Timestamp.parse(item)
            ] = snapshot

    # If there are no blobs, or just one, the type of the input may need coercing into a
    # list before it can be used
    formatted_resources = {
        name: (dict(blob.headers)["content-type"], await blob.read())
        for name, blob in zip(
            json.loads(names),
            [] if blobs is None else (blobs if isinstance(blobs, list) else [blobs]),
        )
    }

    changes = pensive.update(formatted_note, formatted_inputs, formatted_resources)

    formatted_changes: dict[str, dict[str, Any]] = defaultdict(dict)
    for trait, item_map in changes.items():
        for item, (_, snapshot) in item_map.items():
            formatted_changes[str(item)][trait.name] = snapshot

    return dict(data=formatted_changes, headers={"Content-Type": "application/json"})


class ReadResource(BaseModel):
    note: str
    name: str


@app.post("/read-resource")
async def read_resource_endpoint(read_resource: ReadResource) -> Response:
    pensive = State.pensive
    content_type, resource = pensive.read_resource(
        Timestamp.parse(read_resource.note), read_resource.name
    )

    return Response(content=resource, media_type=content_type)
