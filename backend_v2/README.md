# Backend

## Setup

```bash
uv venv
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

### Missing root

In some cases, the root entity will not be ingested correctly.
If this does happen, opening a new tab will show a blank screen.
This is because the root entity in the v2 backend is the earliest entity with a text value; whereas in the v1 backend the root entity was the entity whose ID was `0`.
So if the first entity to which text was written when the pensive created was _not_ the root entity, the root entity will now be inferred incorrectly.

To fix this:

- Go into the original `.pensive/` folder and find the earliest chunk
- Open `text.json` in that chunk (or create it if it doesn't exist), and find the entry for `"0"` (or create it if it doesn't exist)
- Within that dictionary, set `"0": "Root"`
- Check to see whether there are any other entities in that file whose text was set at the 0th time step.
  This will be any value whose path within the JSON object is `"*"`, `"0"`, `"*"` (where `"*"` represents any string), for example if `text.json` contains `{"1": {"0": "Child"}}`.
  Swap the `"0"` for a `"1"`
- Re-run the parsing script
