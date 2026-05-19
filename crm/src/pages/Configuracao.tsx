import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './Configuracao.css';

type ConfigItem = {
  id: string;
  tipo: 'cidade' | 'segmento';
  valor: string;
};

const Configuracao = () => {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [novoSegmento, setNovoSegmento] = useState('');
  const [novaCidade, setNovaCidade] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('config_captacao')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching configs:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async (tipo: 'cidade' | 'segmento', valor: string) => {
    if (!valor.trim()) return;
    
    const { data, error } = await supabase
      .from('config_captacao')
      .insert([{ tipo, valor }])
      .select();
      
    if (error) {
      console.error('Error adding item:', error);
    } else if (data) {
      setItems([data[0], ...items]);
      if (tipo === 'cidade') setNovaCidade('');
      else setNovoSegmento('');
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase
      .from('config_captacao')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error removing item:', error);
    } else {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const cidades = items.filter(i => i.tipo === 'cidade');
  const segmentos = items.filter(i => i.tipo === 'segmento');

  return (
    <div className="configuracao-page animate-fade-in">
      <div className="page-header">
        <h1 className="text-gradient-primary">Configuração de Captação</h1>
        <p className="text-secondary">Gerencie as cidades e nichos que a AI usará para prospectar clientes.</p>
      </div>

      <div className="config-grid">
        {/* Coluna Nichos */}
        <div className="config-card glass-panel">
          <div className="card-header">
            <h3>Nichos / Segmentos</h3>
            <span className="badge">{segmentos.length}</span>
          </div>
          <div className="add-input-group">
            <input 
              type="text" 
              placeholder="Ex: construtora, advocacia..." 
              value={novoSegmento}
              onChange={(e) => setNovoSegmento(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('segmento', novoSegmento)}
            />
            <button className="btn-icon" onClick={() => addItem('segmento', novoSegmento)}>
              <Plus size={18} />
            </button>
          </div>
          <div className="item-list">
            {loading ? <p className="loading-text">Carregando...</p> : 
              segmentos.map(item => (
                <div key={item.id} className="list-item animate-fade-in">
                  <span>{item.valor}</span>
                  <button className="btn-delete" onClick={() => removeItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        {/* Coluna Cidades */}
        <div className="config-card glass-panel">
          <div className="card-header">
            <h3>Cidades Alvo</h3>
            <span className="badge">{cidades.length}</span>
          </div>
          <div className="add-input-group">
            <input 
              type="text" 
              placeholder="Ex: Rio do Sul, Blumenau..." 
              value={novaCidade}
              onChange={(e) => setNovaCidade(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('cidade', novaCidade)}
            />
            <button className="btn-icon" onClick={() => addItem('cidade', novaCidade)}>
              <Plus size={18} />
            </button>
          </div>
          <div className="item-list">
            {loading ? <p className="loading-text">Carregando...</p> : 
              cidades.map(item => (
                <div key={item.id} className="list-item animate-fade-in">
                  <span>{item.valor}</span>
                  <button className="btn-delete" onClick={() => removeItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracao;
