# PDF Knowledge Search

A prototype web application for uploading PDFs, indexing their text, and finding
relevant passages in response to a question. It is built with React, NestJS,
PostgreSQL, and a Python retrieval API.

**What it does today:** retrieves and displays matching PDF excerpts and their
source filenames. It does not use a language model to generate a natural-language
answer.

## Features

- Register and log in; the backend hashes passwords and issues JWTs.
- Upload PDFs and keep their original names in the document list.
- Trigger indexing and ask questions against the indexed PDF text.
- See up to three matching excerpts with their source filenames.

## How it works

1. The React frontend sends login, upload, and document-list requests to the
   NestJS backend.
2. The backend stores document metadata in PostgreSQL and uploaded files in
   `backend/uploads`. It records the original filename separately from the
   generated filename used on disk, so files with duplicate names do not
   overwrite one another.
3. When ingestion is triggered, the backend sends document metadata to the
   Python API. Both services read the same uploads directory (a shared Docker
   volume in Compose, or the same project folder when run locally).
4. The Python service extracts PDF text, splits it into 500-character chunks,
   encodes the chunks with `all-MiniLM-L6-v2`, and indexes the vectors in a
   FAISS `IndexFlatL2`.
5. The Q&A page sends a question to Python. Python encodes it, searches for up
   to three nearest chunks, and returns those excerpts and their document names.

## Design choices and trade-offs

- **Separate web and retrieval services:** NestJS owns authentication, metadata,
  and uploads; Python owns PDF text extraction and vector search. This keeps
  each service focused, at the cost of needing to configure communication and
  shared file storage between them.
- **Keep files on disk and metadata in PostgreSQL:** the database stores document
  records, while the actual PDFs remain in `backend/uploads`. This is simple for
  a local prototype, but is not a scalable or highly available file-storage
  strategy.
- **Use a local embedding model and FAISS:** this avoids requiring a hosted
  vector-search service. The current flat index is held in memory and rebuilt
  when ingestion runs, so it is straightforward to understand but does not
  persist across Python restarts.
- **Show retrieved evidence instead of generated prose:** the current response
  is a retrieval result, not a synthesized answer. This makes the prototype's
  behavior explicit, but users must read the excerpts themselves.

## Current limitations and next steps

- PDF is the only format the Python indexer reads. Although the upload page also
  offers DOC/DOCX selection, those formats are not processed.
- Each ingestion trigger rebuilds the index from the PDFs in the shared upload
  directory; ingestion is synchronous.
- The FAISS index is in memory, and the Q&A endpoint currently searches a
  shared corpus rather than filtering results by the authenticated user.
- Scanned/image-only PDFs need OCR, which is not implemented.
- The app does not generate a conversational answer. A next step would be to
  add a language model that answers using retrieved passages and cites its
  sources.
- Other practical next steps include persistent vector storage, user-scoped
  retrieval, ingestion status/error reporting, and validation of uploaded file
  types and sizes.

## Run locally (Windows PowerShell)

### Prerequisites

- Node.js and npm
- Python 3.10 (recommended for the `faiss-cpu` dependency)
- PostgreSQL

Create a PostgreSQL database and configure the backend's database settings and
JWT secret in `backend/.env`. Start with the example file, then set your own
secret and database credentials:

```powershell
cd E:\xampp\htdocs\fullstack-rag\backend
Copy-Item .env.example .env
```

Start the backend, Python API, and frontend in separate PowerShell terminals.

### 1. NestJS backend

```powershell
cd E:\xampp\htdocs\fullstack-rag\backend
npm install
npm run start:dev
```

The backend listens on `http://localhost:3000`. TypeORM schema synchronization
is enabled for development; use migrations instead for a production database.

### 2. Python retrieval API

```powershell
cd E:\xampp\htdocs\fullstack-rag\rag-api
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

The API listens on `http://localhost:5000`. On its first start, the embedding
model may need to download.

### 3. React frontend

```powershell
cd E:\xampp\htdocs\fullstack-rag\frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The
frontend is configured to call the backend at `http://localhost:3000` and the
Python Q&A endpoint at `http://localhost:5000`.

## Docker status

The repository includes Dockerfiles and a Compose file, but the Compose setup is
not yet a complete standalone deployment: it does not define a PostgreSQL
service or configure the backend's database connection. The frontend Dockerfile
also needs to copy Vite's `dist` output rather than `/app/build`, and the current
frontend `npm run build` is blocked by TypeScript errors. Docker deployment has
not been verified; the local instructions above are the supported run path for
this prototype.
