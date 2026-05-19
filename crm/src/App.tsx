import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import Configuracao from './pages/Configuracao';
import Kanban from './pages/Kanban';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Campanhas from './pages/Campanhas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="funil" element={<Kanban />} />
          <Route path="chat" element={<Chat />} />
          <Route path="campanhas" element={<Campanhas />} />
          <Route path="configuracao" element={<Configuracao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
