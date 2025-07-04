# Backend

## Setup

```bash
npm install
```

## Running

```bash
npm start
```

### Environment variables

- `PENSIVE_PATH`: if defined, reads from and writes to a database stored elsewhere
  - If the file does not exist at the given location, it will be created automatically
- `PENSIVE_PORT`: run on a different port (the default is 2998)
- `GEMINI_API_KEY`: required to run LLM prompts with Gemini models
