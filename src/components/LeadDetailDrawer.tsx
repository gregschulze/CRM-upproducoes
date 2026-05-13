import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Building2, Phone, Globe, AtSign, MapPin, Tag,
  MessageSquare, Send, Zap, Clock, Eye, AlertTriangle,
  Target, Briefcase, TrendingUp
} from 'lucide-react';
import type { Lead } from '@/pages/Kanban';

type Conversa = {
  id: number;
  lead_id: number;
  mensagem_enviada: string | null;
  mensagem_recebida: string | null;
  intencao_detectada: string | null;
  timestamp: string;
};

type Apresentacao = {
  id: number;
  lead_id: number;
  gancho_usado: string | null;
  servico_apresentado: string | null;
  nivel_apresentacao: number | null;
  argumento_usado: string | null;
  objecao_detectada: string | null;
  portfolio_enviado: boolean;
  momento_preco_revelado: string | null;
  created_at: string;
};

type Followup = {
  id: number;
  lead_id: number;
  motivo: string | null;
  data_followup: string;
  mensagem_planejada: string | null;
  status: string;
};

type Disparo = {
  id: string;
  lead_id: number;
  mensagem_enviada: string;
  tipo_campanha: string;
  enviado_em: string;
  status_envio: string;
  respondeu: boolean;
};

type TimelineEvent = {
  id: string;
  type: 'conversa' | 'apresentacao' | 'followup' | 'disparo';
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  color: string;
};

type Props = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const LeadDetailDrawer = ({ lead, open, onOpenChange }: Props) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [apresentacao, setApresentacao] = useState<Apresentacao | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [disparos, setDisparos] = useState<Disparo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead && open) {
      fetchLeadData(lead.id);
    }
  }, [lead, open]);

  const fetchLeadData = async (leadId: string) => {
    setLoading(true);

    const [convRes, apresRes, followRes, dispRes] = await Promise.all([
      supabase.from('conversas').select('*').eq('lead_id', leadId).order('timestamp', { ascending: false }).limit(20),
      supabase.from('apresentacao_servico').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1),
      supabase.from('followups').select('*').eq('lead_id', leadId).order('data_followup', { ascending: false }),
      supabase.from('disparos_massa').select('*').eq('lead_id', leadId).order('enviado_em', { ascending: false }),
    ]);

    setConversas(convRes.data || []);
    setApresentacao(apresRes.data?.[0] || null);
    setFollowups(followRes.data || []);
    setDisparos(dispRes.data || []);
    setLoading(false);
  };

  const buildTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    conversas.forEach((c) => {
      events.push({
        id: `conv-${c.id}`,
        type: 'conversa',
        title: c.intencao_detectada || 'Conversa',
        description: c.mensagem_recebida || c.mensagem_enviada || '',
        date: c.timestamp,
        icon: <MessageSquare size={14} />,
        color: 'text-blue-400',
      });
    });

    followups.forEach((f) => {
      events.push({
        id: `follow-${f.id}`,
        type: 'followup',
        title: `Follow-up: ${f.motivo || 'Manual'}`,
        description: f.mensagem_planejada || '',
        date: f.data_followup,
        icon: <Clock size={14} />,
        color: 'text-amber-400',
      });
    });

    disparos.forEach((d) => {
      events.push({
        id: `disp-${d.id}`,
        type: 'disparo',
        title: `Disparo: ${d.tipo_campanha}`,
        description: d.mensagem_enviada.substring(0, 120) + (d.mensagem_enviada.length > 120 ? '...' : ''),
        date: d.enviado_em,
        icon: <Send size={14} />,
        color: d.respondeu ? 'text-emerald-400' : 'text-zinc-400',
      });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (!lead) return null;

  const initials = lead.empresa ? lead.empresa.substring(0, 2).toUpperCase() : '??';
  const scorePercent = Math.min(lead.score || 0, 100);

  const faseLabel: Record<string, string> = {
    captacao: 'Captação',
    primeiro_contato: 'Primeiro Contato',
    curiosidade: 'Curiosidade',
    interesse: 'Interesse',
    qualificacao: 'Qualificação',
    objecao: 'Objeção',
    pronto_handoff: 'Pronto p/ Handoff',
    descartado: 'Descartado',
  };

  const faseColor: Record<string, string> = {
    captacao: 'bg-zinc-500/20 text-zinc-300',
    primeiro_contato: 'bg-slate-500/20 text-slate-300',
    curiosidade: 'bg-blue-500/20 text-blue-300',
    interesse: 'bg-violet-500/20 text-violet-300',
    qualificacao: 'bg-pink-500/20 text-pink-300',
    objecao: 'bg-amber-500/20 text-amber-300',
    pronto_handoff: 'bg-emerald-500/20 text-emerald-300',
    descartado: 'bg-red-500/20 text-red-300',
  };

  const timeline = buildTimeline();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-[#0f0f11] border-l border-white/8 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-indigo-500/30">
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-cyan-500 text-white text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold text-white truncate">
                {lead.empresa || lead.whatsapp}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${faseColor[lead.fase_funil] || 'bg-zinc-500/20 text-zinc-300'}`}>
                  {faseLabel[lead.fase_funil] || lead.fase_funil}
                </Badge>
                {lead.pausar_ia && (
                  <Badge className="bg-amber-500/20 text-amber-300 text-xs">✋ Humano</Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Score Bar */}
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400 font-medium">Score de qualificação</span>
            <span className="text-sm font-bold text-white">{lead.score || 0}/100</span>
          </div>
          <Progress value={scorePercent} className="h-2" />
        </div>

        <Separator className="bg-white/5" />

        <ScrollArea className="h-[calc(100vh-220px)]">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/5 rounded-none px-6 h-11 gap-1">
              <TabsTrigger value="info" className="text-xs data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-md">
                Dados
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-md">
                Timeline ({timeline.length})
              </TabsTrigger>
              <TabsTrigger value="sales" className="text-xs data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-md">
                Vendas
              </TabsTrigger>
            </TabsList>

            {/* === TAB: Dados === */}
            <TabsContent value="info" className="px-6 py-4 space-y-4 mt-0">
              <div className="space-y-3">
                <InfoRow icon={<Building2 size={15} />} label="Empresa" value={lead.empresa} />
                <InfoRow icon={<Phone size={15} />} label="WhatsApp" value={lead.whatsapp} />
                <InfoRow icon={<Tag size={15} />} label="Segmento" value={(lead as any).segmento} />
                <InfoRow icon={<MapPin size={15} />} label="Cidade" value={(lead as any).cidade} />
                <InfoRow icon={<AtSign size={15} />} label="Instagram" value={(lead as any).instagram} />
                <InfoRow icon={<Globe size={15} />} label="Site" value={(lead as any).site} />
                <InfoRow icon={<Zap size={15} />} label="Fonte" value={(lead as any).fonte} />
              </div>

              {(lead as any).observacoes && (
                <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-xs text-zinc-400 font-medium mb-1">Observações</p>
                  <p className="text-sm text-zinc-200">{(lead as any).observacoes}</p>
                </div>
              )}

              {(lead as any).angulo_abordagem && (
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-xs text-indigo-400 font-medium mb-1">Ângulo de Abordagem</p>
                  <p className="text-sm text-zinc-200">{(lead as any).angulo_abordagem}</p>
                </div>
              )}
            </TabsContent>

            {/* === TAB: Timeline === */}
            <TabsContent value="timeline" className="px-6 py-4 mt-0">
              {loading ? (
                <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
              ) : timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-sm">Nenhuma atividade registrada.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
                  <div className="space-y-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 relative">
                        <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 z-10 ${event.color}`}>
                          {event.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{event.title}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-zinc-500 border-zinc-700">
                              {event.type}
                            </Badge>
                          </div>
                          {event.description && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{event.description}</p>
                          )}
                          <p className="text-[10px] text-zinc-600 mt-1">
                            {new Date(event.date).toLocaleDateString('pt-BR')} {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* === TAB: Vendas === */}
            <TabsContent value="sales" className="px-6 py-4 mt-0 space-y-4">
              {apresentacao ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard
                      icon={<Target size={16} />}
                      label="Gancho"
                      value={apresentacao.gancho_usado || '-'}
                      color="text-violet-400"
                    />
                    <MiniCard
                      icon={<Briefcase size={16} />}
                      label="Serviço"
                      value={apresentacao.servico_apresentado || '-'}
                      color="text-blue-400"
                    />
                    <MiniCard
                      icon={<TrendingUp size={16} />}
                      label="Nível"
                      value={`${apresentacao.nivel_apresentacao || 0}/5`}
                      color="text-emerald-400"
                    />
                    <MiniCard
                      icon={<Eye size={16} />}
                      label="Portfólio"
                      value={apresentacao.portfolio_enviado ? '✅ Enviado' : '❌ Não'}
                      color="text-cyan-400"
                    />
                  </div>

                  {apresentacao.argumento_usado && (
                    <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                      <p className="text-xs text-zinc-400 font-medium mb-1">Argumento Usado</p>
                      <p className="text-sm text-zinc-200">{apresentacao.argumento_usado}</p>
                    </div>
                  )}

                  {apresentacao.objecao_detectada && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-amber-400 font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Objeção Detectada
                      </p>
                      <p className="text-sm text-zinc-200">{apresentacao.objecao_detectada}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Briefcase size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-sm">Nenhuma apresentação registrada.</p>
                </div>
              )}

              {followups.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Follow-ups Pendentes</h4>
                  <div className="space-y-2">
                    {followups.filter(f => f.status === 'pendente').map(f => (
                      <div key={f.id} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white">{f.motivo}</span>
                          <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">{f.status}</Badge>
                        </div>
                        {f.mensagem_planejada && (
                          <p className="text-xs text-zinc-400 mt-1">{f.mensagem_planejada}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) => (
  <div className="flex items-center gap-3">
    <div className="text-zinc-500 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <span className="text-[11px] text-zinc-500 block">{label}</span>
      <span className="text-sm text-zinc-200 truncate block">{value || '-'}</span>
    </div>
  </div>
);

const MiniCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="p-3 rounded-lg bg-white/3 border border-white/5">
    <div className={`${color} mb-1`}>{icon}</div>
    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
  </div>
);

export default LeadDetailDrawer;
