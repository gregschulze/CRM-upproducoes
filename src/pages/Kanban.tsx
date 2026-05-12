import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Kanban.css';

// Types
export type Lead = {
  id: string;
  whatsapp: string;
  empresa: string | null;
  segmento: string | null;
  score: number | null;
  fase_funil: string;
  ultima_interacao: string | null;
  pausar_ia: boolean;
};

// As colunas do Kanban com seus nomes de banco de dados
const COLUMNS = [
  { id: 'primeiro_contato', title: 'Primeiro Contato', colorClass: 'col-1' },
  { id: 'curiosidade', title: 'Curiosidade', colorClass: 'col-2' },
  { id: 'interesse', title: 'Interesse', colorClass: 'col-3' },
  { id: 'qualificacao', title: 'Qualificação', colorClass: 'col-4' },
  { id: 'objecao', title: 'Objeção', colorClass: 'col-5' },
  { id: 'pronto_handoff', title: 'Pronto p/ Handoff', colorClass: 'col-6' },
  { id: 'descartado', title: 'Descartado', colorClass: 'col-7' },
];

const Kanban = () => {
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);

  // Inicializa o state de colunas vazias
  const initCols = () => {
    const cols: Record<string, Lead[]> = {};
    COLUMNS.forEach(c => cols[c.id] = []);
    return cols;
  };

  useEffect(() => {
    fetchLeads();

    // Configurar Supabase Realtime para a tabela 'leads'
    const channel = supabase.channel('realtime_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        // Refetch on any change to keep logic simple for now, 
        // ou a gente poderia atualizar o estado local diretamente.
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('ultima_interacao', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
      return;
    }

    const grouped = initCols();
    data?.forEach((lead: Lead) => {
      // Caso a fase venha vazia ou não exista na lista, coloca no primeiro contato
      const fase = grouped[lead.fase_funil] ? lead.fase_funil : 'primeiro_contato';
      grouped[fase].push(lead);
    });

    setLeads(grouped);
    setLoading(false);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Atualiza State local otimisticamente
    const sourceCol = [...leads[source.droppableId]];
    const destCol = [...leads[destination.droppableId]];
    
    const [movedLead] = sourceCol.splice(source.index, 1);
    movedLead.fase_funil = destination.droppableId;
    
    if (source.droppableId === destination.droppableId) {
      sourceCol.splice(destination.index, 0, movedLead);
      setLeads({ ...leads, [source.droppableId]: sourceCol });
    } else {
      destCol.splice(destination.index, 0, movedLead);
      setLeads({
        ...leads,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol,
      });
    }

    // Update via Supabase
    const { error } = await supabase
      .from('leads')
      .update({ fase_funil: destination.droppableId })
      .eq('id', draggableId);

    if (error) {
      console.error('Error updating lead phase:', error);
      fetchLeads(); // Revert on error
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'var(--text-tertiary)';
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Sem interação';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  if (loading && Object.keys(leads).length === 0) {
    return <div className="kanban-page"><p className="loading-text">Carregando funil...</p></div>;
  }

  return (
    <div className="kanban-page animate-fade-in">
      <div className="page-header">
        <h1 className="text-gradient-primary">Funil SDR</h1>
        <p className="text-secondary">Arraste os leads entre as fases. Atualizações ocorrem em tempo real.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <div className="kanban-col-wrapper" key={col.id}>
              <div className={`kanban-col-header ${col.colorClass}`}>
                <h3>{col.title}</h3>
                <span className="lead-count">{leads[col.id]?.length || 0}</span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    className={`kanban-col-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {leads[col.id]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            className={`lead-card glass-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="card-top">
                              <span className="empresa-nome">{lead.empresa || lead.whatsapp}</span>
                              {lead.score !== null && (
                                <span 
                                  className="score-badge" 
                                  style={{ color: getScoreColor(lead.score), borderColor: getScoreColor(lead.score) }}
                                >
                                  {lead.score}
                                </span>
                              )}
                            </div>
                            {lead.segmento && <div className="segmento">{lead.segmento}</div>}
                            
                            <div className="card-footer">
                              <span className="time-ago">{timeAgo(lead.ultima_interacao)}</span>
                              {lead.pausar_ia && (
                                <span className="ai-paused-badge" title="IA Pausada para este lead">✋ Humano</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Kanban;
