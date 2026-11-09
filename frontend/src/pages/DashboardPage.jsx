import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
     <>
      <Navbar />
    <div className="login-wrapper">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h2 className="login-title">Welcome to the Dashboard</h2>
        <p>You are logged in!</p>
        <button onClick={handleLogout} className="login-button">Logout</button>
      </div>
    </div>
    </>
  );
}

export default DashboardPage;
