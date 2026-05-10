import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Hand, User, Bot } from 'lucide-react';
import './Chat.css';
import type { Lead } from './Kanban';

type ChatMessage = {
  id: number;
  session_id: string;
  message: {
    type: 'ai' | 'human';
    content: string;
  };
};

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_TOKEN = import.meta.env.VITE_EVOLUTION_API_TOKEN;
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE || 'UpBDR';

const Chat = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.telefone);
      
      // Subscribe to chat histories
      const channel = supabase.channel('realtime_chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'n8n_chat_histories' }, (payload) => {
          if (payload.new.session_id === selectedLead.telefone) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
            scrollToBottom();
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
          if (payload.new.id === selectedLead.id) {
            setSelectedLead(payload.new as Lead);
            // Atualizar na lista tbm
            setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new as Lead : l));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedLead]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('ultima_interacao', { ascending: false, nullsFirst: false });
    
    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const fetchMessages = async (telefone: string) => {
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', telefone)
      .order('id', { ascending: true });
      
    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const togglePausaIA = async () => {
    if (!selectedLead) return;
    const newState = !selectedLead.pausar_ia;
    
    const { error } = await supabase
      .from('leads')
      .update({ pausar_ia: newState })
      .eq('id', selectedLead.id);
      
    if (!error) {
      setSelectedLead({ ...selectedLead, pausar_ia: newState });
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedLead) return;
    
    const textToSend = inputText;
    setInputText('');

    // 1. Enviar para a Evolution API
    try {
      if (EVOLUTION_API_URL && EVOLUTION_API_TOKEN) {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_TOKEN
          },
          body: JSON.stringify({
            number: selectedLead.telefone,
            text: textToSend
          })
        });
      } else {
        console.warn("Credenciais da Evolution API não configuradas no .env. A mensagem será salva apenas no banco de dados.");
      }

      // 2. Inserir no n8n_chat_histories para a IA ter o contexto no futuro
      const newMessage = {
        session_id: selectedLead.telefone,
        message: {
          type: 'ai', // Trata o humano como a assistente (a empresa)
          content: textToSend,
          additional_kwargs: { manual: true }
        }
      };

      await supabase.from('n8n_chat_histories').insert([newMessage]);
      // Não precisamos dar push no state local pois o subscription do realtime já vai puxar o INSERT acima.

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return (
    <div className="chat-page animate-fade-in">
      {/* Sidebar de Leads do Chat */}
      <div className="chat-sidebar glass-panel">
        <div className="chat-sidebar-header">
          <h3>Conversas</h3>
        </div>
        <div className="chat-lead-list">
          {loading ? <p className="loading-text">Carregando...</p> : 
            leads.map(lead => (
              <div 
                key={lead.id} 
                className={`chat-lead-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="lead-avatar">
                  {lead.nome_empresa ? lead.nome_empresa.substring(0,2).toUpperCase() : <User size={18} />}
                </div>
                <div className="lead-details">
                  <span className="lead-name">{lead.nome_empresa || lead.telefone}</span>
                  <span className="lead-phase">{lead.fase_funil.replace('_', ' ')}</span>
                </div>
                {lead.pausar_ia && <Hand size={14} className="paused-icon" color="var(--warning)" />}
              </div>
            ))
          }
        </div>
      </div>

      {/* Área principal do Chat */}
      <div className="chat-main glass-panel">
        {selectedLead ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <h2>{selectedLead.nome_empresa || selectedLead.telefone}</h2>
                <span className="subtitle">{selectedLead.segmento || 'Sem segmento'} • Score: {selectedLead.score_engajamento || '-'}</span>
              </div>
              <button 
                className={`btn-toggle-ia ${selectedLead.pausar_ia ? 'paused' : 'active'}`}
                onClick={togglePausaIA}
              >
                {selectedLead.pausar_ia ? (
                  <><Hand size={18} /> IA Pausada (Devolver p/ Bot)</>
                ) : (
                  <><Bot size={18} /> IA Ativa (Assumir Conversa)</>
                )}
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-chat">Nenhuma mensagem registrada nesta conversa.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.message.type === 'human' ? 'received' : 'sent'}`}>
                    <div className="message-content">
                      {msg.message.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              {!selectedLead.pausar_ia && (
                <div className="warning-banner">
                  <Bot size={14} /> 
                  A IA está ativa! Recomenda-se clicar em "Assumir Conversa" antes de mandar mensagens manuais para evitar que o bot também responda o lead.
                </div>
              )}
              <div className="input-group">
                <textarea 
                  placeholder="Digite sua mensagem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button className="btn-send" onClick={sendMessage} disabled={!inputText.trim()}>
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <MessageSquare size={48} color="var(--text-tertiary)" />
            <h3>Nenhuma conversa selecionada</h3>
            <p>Selecione um lead ao lado para visualizar e interagir no chat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente helper pro empty state
import { MessageSquare } from 'lucide-react';

export default Chat;
