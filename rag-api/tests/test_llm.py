import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from llm import LLMConfigurationError, LLMResponseError, generate_answer


class GenerateAnswerTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(
            os.environ,
            {
                'LLM_API_KEY': 'test-key',
                'LLM_MODEL': 'test-model',
                'LLM_BASE_URL': 'https://llm.example/v1',
                'LLM_TEMPERATURE': '0.1',
                'LLM_MAX_TOKENS': '250',
                'LLM_TIMEOUT_SECONDS': '20',
                'RETRIEVAL_TOP_K': '2',
            },
            clear=True,
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

    @patch('llm.OpenAI')
    def test_generates_grounded_answer_using_configured_model_and_context(self, openai):
        openai.return_value.chat.completions.create.return_value = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='The policy is 30 days [policy.pdf].')
                )
            ]
        )
        sources = [
            {'filename': 'policy.pdf', 'excerpt': 'The return period is 30 days.'},
            {'filename': 'guide.pdf', 'excerpt': 'Contact support for help.'},
            {'filename': 'excluded.pdf', 'excerpt': 'This source is beyond top-k.'},
        ]

        answer = generate_answer('What is the return period?', sources)

        self.assertEqual(answer, 'The policy is 30 days [policy.pdf].')
        openai.assert_called_once_with(
            api_key='test-key',
            base_url='https://llm.example/v1',
            timeout=20,
        )
        request = openai.return_value.chat.completions.create.call_args.kwargs
        self.assertEqual(request['model'], 'test-model')
        self.assertEqual(request['temperature'], 0.1)
        self.assertEqual(request['max_tokens'], 250)
        self.assertIn('only the supplied document excerpts', request['messages'][0]['content'])
        self.assertIn('policy.pdf', request['messages'][1]['content'])
        self.assertIn('guide.pdf', request['messages'][1]['content'])
        self.assertNotIn('excluded.pdf', request['messages'][1]['content'])

    def test_requires_api_key(self):
        os.environ.pop('LLM_API_KEY')

        with self.assertRaises(LLMConfigurationError):
            generate_answer('Question?', [{'filename': 'doc.pdf', 'excerpt': 'Text'}])

    def test_rejects_empty_provider_response(self):
        with patch('llm.OpenAI') as openai:
            openai.return_value.chat.completions.create.return_value = SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content='  '))]
            )

            with self.assertRaises(LLMResponseError):
                generate_answer('Question?', [{'filename': 'doc.pdf', 'excerpt': 'Text'}])

    def test_rejects_invalid_generation_settings(self):
        os.environ['LLM_TEMPERATURE'] = '3'

        with self.assertRaises(LLMConfigurationError):
            generate_answer('Question?', [{'filename': 'doc.pdf', 'excerpt': 'Text'}])


if __name__ == '__main__':
    unittest.main()
