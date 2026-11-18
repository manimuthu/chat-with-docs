import unittest
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
from openai import InternalServerError, RateLimitError

import app as rag_app


class SearchIndexStub:
    ntotal = 1

    def search(self, query, k):
        return np.array([[0.0]], dtype=np.float32), np.array([[0]])


class AskEndpointTests(unittest.TestCase):
    def setUp(self):
        self.original_index = rag_app.index
        self.original_chunks = rag_app.chunks
        self.original_doc_map = rag_app.doc_map
        rag_app.index = SearchIndexStub()
        rag_app.chunks = ['The plan includes 20 days of leave.']
        rag_app.doc_map = [{'documentId': 1, 'filename': 'leave-policy.pdf'}]
        self.client = rag_app.app.test_client()

    def tearDown(self):
        rag_app.index = self.original_index
        rag_app.chunks = self.original_chunks
        rag_app.doc_map = self.original_doc_map

    def test_returns_actionable_message_when_provider_has_no_credits(self):
        response_error = RateLimitError(
            'No credits remaining',
            response=SimpleNamespace(
                status_code=429,
                request=object(),
                headers={},
            ),
            body={'error': {'message': 'No credits remaining'}},
        )
        with patch.object(rag_app.model, 'encode', return_value=[[0.0] * 384]), patch(
            'app.generate_answer', side_effect=response_error
        ):
            response = self.client.post('/ask', json={'question': 'How much leave?'})

        self.assertEqual(response.status_code, 429)
        self.assertIn('credits', response.get_json()['error'])

    def test_returns_retryable_message_when_provider_is_unavailable(self):
        response_error = InternalServerError(
            'Service unavailable',
            response=SimpleNamespace(
                status_code=503,
                request=object(),
                headers={},
            ),
            body={'error': {'message': 'Service unavailable'}},
        )
        with patch.object(rag_app.model, 'encode', return_value=[[0.0] * 384]), patch(
            'app.generate_answer', side_effect=response_error
        ):
            response = self.client.post('/ask', json={'question': 'How much leave?'})

        self.assertEqual(response.status_code, 503)
        self.assertIn('try again', response.get_json()['error'])
