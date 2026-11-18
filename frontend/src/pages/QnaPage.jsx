import { useState } from 'react';
import Navbar from '../components/Navbar';
import '../assets/style.css';

function QnaPage () {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://localhost:5000/ask';

  const askQuestion = async (e) => {
    e.preventDefault();
    setAnswer('');
    setSources([]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userId: 1, // Replace with real user ID later
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Question failed (${res.status})`);
      }
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : 'Error contacting the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h2 className="login-title">Ask a Question</h2>
          <form onSubmit={askQuestion} className="login-form">
            <input
              type="text"
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="login-input"
              required
            />
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </form>

          {answer && (
            <>
              <h3 style={{ marginTop: '1rem' }}>Answer:</h3>
              <p>{answer}</p>
            </>
          )}

         {sources.length > 0 && (
          <>
            <h4 style={{ marginTop: '1rem' }}>📄 Source Excerpts:</h4>
            <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              {sources.map((src, idx) => (
                <div key={idx} style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <strong>{src.filename || `Document #${src.documentId}`}</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>{src.excerpt}</p>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
}

export default QnaPage;
