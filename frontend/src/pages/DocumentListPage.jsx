import { useEffect, useState } from 'react';
import API_BASE_URL from '../config';
import '../assets/style.css';
import Navbar from '../components/Navbar';

function DocumentListPage() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch documents');
    }
  };

  const handleIngest = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}/ingest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error();
      setMessage(`✅ Ingestion triggered for document ID ${id}`);
    } catch {
      setMessage(`❌ Failed to trigger ingestion`);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
     <>
      <Navbar />
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Your Documents</h2>
        {message && <p>{message}</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {documents.map((doc) => (
            <li key={doc.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
              <strong>{doc.filename}</strong> (ID: {doc.id})<br />
              <button onClick={() => handleIngest(doc.id)} className="login-button" style={{ marginTop: '0.5rem' }}>
                Trigger Ingestion
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
  );
}

export default DocumentListPage;
