import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, MessageSquare, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/funil', label: 'Funil SDR', icon: <KanbanSquare size={20} /> },
    { path: '/chat', label: 'Central de Conversas', icon: <MessageSquare size={20} /> },
    { path: '/configuracao', label: 'Configuração', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1 className="logo text-gradient-primary">UpProdutora</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">SDR</div>
          <div className="user-info">
            <span className="user-name">Agente B2B</span>
            <span className="user-status text-gradient-primary">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
