import { useState } from 'react';
import API_BASE_URL from '../config';
import '../assets/style.css';
import Navbar from '../components/Navbar';

function DocumentUploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      setMessage('✅ Document uploaded successfully');
      setFile(null);
    } catch (err) {
      setMessage('❌ Upload failed');
    }
  };

  return (
     <>
      <Navbar />
    <div className="login-wrapper">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h2 className="login-title">Upload Document</h2>
        {message && <p>{message}</p>}
        <form onSubmit={handleUpload} className="login-form">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="login-input"
          />
          <button type="submit" className="login-button">Upload</button>
        </form>
      </div>
    </div>
    </>
  );
}

export default DocumentUploadPage;
