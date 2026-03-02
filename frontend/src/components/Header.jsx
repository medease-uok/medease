import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import './Header.css';

export default function Header({ title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        <span className="header-user">
          {currentUser?.firstName} {currentUser?.lastName}
        </span>
        <span className="header-role">{currentUser?.role?.replace('_', ' ')}</span>
        <button className="header-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
