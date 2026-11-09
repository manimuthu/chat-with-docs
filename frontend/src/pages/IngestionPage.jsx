import { useState } from 'react';
import API_BASE_URL from '../config';
import '../assets/style.css';
import Navbar from '../components/Navbar';

function IngestionPage() {
  const [docId, setDocId] = useState('');
  const [message, setMessage] = useState('');

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!docId) return setMessage('Please enter document ID');

    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/ingest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Ingestion failed');
      setMessage(`✅ Ingestion triggered for document ID ${docId}`);
    } catch (err) {
      setMessage(`❌ Failed to trigger ingestion`);
    }
  };

  return (
     <>
      <Navbar />
    <div className="login-wrapper">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h2 className="login-title">Trigger Ingestion</h2>
        {message && <p>{message}</p>}
        <form onSubmit={handleIngest} className="login-form">
          <input
            type="number"
            placeholder="Enter Document ID"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            required
            className="login-input"
          />
          <button type="submit" className="login-button">Trigger Ingestion</button>
        </form>
      </div>
    </div>
    </>
  );
}

export default IngestionPage;
