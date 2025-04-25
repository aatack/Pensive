# Backend

## Setup

```bash
uv venv
source .venv/Scripts/activate
```

## Running

```bash
PENSIVE_PATH=./.pensive uv run uvicorn pensive_backend.app:app
```

- Change the pensive path to store the database elsewhere
- If the file does not exist at the given location, it will be created automatically
- Add `--reload` when running in a development environment

## Migrating from old formats

The original implementation used a different backend which stored data in a folder instead of a single file.
To migrate from the old format, use the helper functions in `pensive_backend/parsing.py`.

```bash
uv run python -m pensive_backend.parsing path/to/v1/ path/to/v2
```

Here, `path/to/v1/` should specify the path to the folder (likely `.pensive`) containing the original pensive; and `path/to/v2` is the location of the file that should be created to store the ingested data.
(This will typically be the same as `PENSIVE_PATH` above.)

The whole process should take a couple of minutes, but may be quicker for smaller pensives.
