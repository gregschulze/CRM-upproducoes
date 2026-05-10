import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle, MessageSquare, Target } from 'lucide-react';
import type { Lead } from './Kanban';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualificados: 0,
    prontoHandoff: 0,
    descartados: 0
  });

  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data } = await supabase.from('leads').select('*');
    if (data) {
      setStats({
        totalLeads: data.length,
        qualificados: data.filter(l => l.score_engajamento && l.score_engajamento >= 50).length,
        prontoHandoff: data.filter(l => l.fase_funil === 'pronto_handoff').length,
        descartados: data.filter(l => l.fase_funil === 'descartado').length
      });

      // Pega os 5 mais recentes
      const sorted = [...data].sort((a, b) => new Date(b.ultima_interacao || 0).getTime() - new Date(a.ultima_interacao || 0).getTime());
      setRecentLeads(sorted.slice(0, 5));
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="text-gradient-primary">Overview B2B</h1>
        <p className="text-secondary">Visão geral do funil de prospecção da Up Produções.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Total Leads</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{stats.totalLeads}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
            <Target size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Leads Qualificados</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{stats.qualificados}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Pronto p/ Handoff</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{stats.prontoHandoff}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Interações Recentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentLeads.map(lead => (
            <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} color="var(--text-tertiary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{lead.nome_empresa || lead.telefone}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{lead.segmento || 'Sem segmento'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{lead.fase_funil.replace('_', ' ')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Score: {lead.score_engajamento || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
