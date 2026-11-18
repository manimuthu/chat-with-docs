import os

import faiss
import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import InternalServerError, OpenAIError, RateLimitError
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

from llm import LLMConfigurationError, LLMResponseError, generate_answer, retrieval_top_k

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.environ.get(
    'UPLOAD_DIR',
    os.path.join(PROJECT_ROOT, 'backend', 'uploads'),
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

    data = request.get_json(silent=True) or {}
    question = data.get('question', '')
    if not isinstance(question, str):
        question = ''
    question = question.strip()
    if not question:
        return jsonify({'answer': 'Empty question', 'sources': []})

    try:
        top_k = retrieval_top_k()
    except LLMConfigurationError as exc:
        return jsonify({'error': str(exc)}), 503

    q_vec = model.encode([question])
    _, indices = index.search(
        np.array(q_vec, dtype=np.float32),
        k=min(top_k, index.ntotal),
    )

    matched = []
    for idx in indices[0]:
        if idx < len(chunks) and idx < len(doc_map):
            matched.append({
                **doc_map[idx],
                'excerpt': chunks[idx]
            })

    if not matched:
        return jsonify({
            'answer': "I couldn't find relevant passages in the indexed documents.",
            'sources': [],
        })

    try:
        answer = generate_answer(question, matched)
    except LLMConfigurationError as exc:
        return jsonify({'error': str(exc)}), 503
    except RateLimitError:
        app.logger.warning('LLM provider rejected the request due to its rate or credit limit.')
        return jsonify({
            'error': (
                'The LLM provider has no available credits or its rate limit was reached. '
                'Check your provider billing and usage limits, then try again.'
            ),
        }), 429
    except InternalServerError as exc:
        app.logger.warning('LLM provider returned a server error: %s', exc)
        return jsonify({
            'error': 'The LLM provider is temporarily unavailable. Please wait and try again.',
        }), 503
    except (LLMResponseError, OpenAIError):
        app.logger.exception('LLM answer generation failed')
        return jsonify({
            'error': 'Could not generate an answer from the configured LLM provider.',
        }), 502

    return jsonify({
        'answer': answer,
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
