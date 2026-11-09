from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import faiss
import numpy as np
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.environ.get(
    'UPLOAD_DIR',
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'uploads')),
)
model = SentenceTransformer('all-MiniLM-L6-v2')
index = faiss.IndexFlatL2(384)
chunks = []  # Store raw chunks alongside vectors
doc_map = []  # Track document IDs with chunks

# Load & embed all PDFs
def load_documents(document_metadata=None):
    global index, chunks, doc_map
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    metadata_by_storage_name = {
        document['storageFilename']: document
        for document in (document_metadata or [])
    }
    index = faiss.IndexFlatL2(384)  # Reinitialize index
    chunks.clear()
    doc_map.clear()

    for filename in os.listdir(UPLOAD_DIR):
        if filename.endswith('.pdf'):
            path = os.path.join(UPLOAD_DIR, filename)
            try:
                document = metadata_by_storage_name.get(filename, {})
                reader = PdfReader(path)
                full_text = ''
                for page in reader.pages:
                    full_text += page.extract_text() or ''
                text_chunks = [full_text[i:i+500] for i in range(0, len(full_text), 500)]
                if text_chunks:
                    embeddings = model.encode(text_chunks)
                    index.add(np.array(embeddings, dtype=np.float32))
                    chunks.extend(text_chunks)
                    source = {
                        'documentId': document.get('documentId', filename),
                        'filename': document.get('filename', filename),
                    }
                    doc_map.extend([source] * len(text_chunks))
            except Exception as e:
                print(f"❌ Failed to process {filename}: {e}")

@app.route('/ask', methods=['POST'])
def ask():
    if index.ntotal == 0:
        return jsonify({
            'answer': 'No documents indexed yet. Please run ingestion.',
            'sources': []
        })

    data = request.json
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'answer': 'Empty question', 'sources': []})

    q_vec = model.encode([question])
    D, I = index.search(np.array(q_vec, dtype=np.float32), k=3)

    matched = []
    for idx in I[0]:
        if idx < len(chunks) and idx < len(doc_map):
            matched.append({
                **doc_map[idx],
                'excerpt': chunks[idx]
            })

    return jsonify({
        'answer': f"Top {len(matched)} matches found.",
        'sources': matched
    })

@app.route('/ingest', methods=['POST'])
def ingest():
    data = request.get_json(silent=True) or {}
    load_documents(data.get('documents', []))
    return jsonify({'status': 're-ingested all documents'})

if __name__ == '__main__':
    load_documents()
    app.run(host='0.0.0.0', port=5000, debug=False)
