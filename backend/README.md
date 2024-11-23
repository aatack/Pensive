# Backend

## Setup

1. `python -m venv .venv`
2. `source .venv/Scripts/activate`
3. `pip install -r requirements.txt`
4. `pip install python-multipart`

## Running

1. `source .venv/Scripts/activate`
2. `uvicorn app:app --reload`
    - This will run pensive in the current directory.  To use a different one, specify the `PENSIVE_ROOT` environment variable
