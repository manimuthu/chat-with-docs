import { useNavigate } from 'react-router-dom';
import './navbar.css'; // We'll style it next

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>🗂️ DocApp</div>
      <ul className="navbar-links">
        <li onClick={() => navigate('/dashboard')}>Dashboard</li>
        <li onClick={() => navigate('/documents')}>Upload</li>
        <li onClick={() => navigate('/documents/list')}>List</li>
        <li onClick={() => navigate('/ingestion')}>Ingestion</li>
        <li onClick={() => navigate('/qna')}>Q&A</li>
        <li onClick={handleLogout} className="logout">Logout</li>
      </ul>
    </nav>
  );
}

export default Navbar;
