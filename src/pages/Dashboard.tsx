import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Users, Target, CheckCircle, XCircle, Send, MessageSquare,
  Clock, Hand, Zap, TrendingUp, Building2, BarChart3
} from 'lucide-react';

type Lead = {
  id: string;
  empresa: string | null;
  segmento: string | null;
  whatsapp: string;
  score: number | null;
  fase_funil: string;
  ultima_interacao: string | null;
  pausar_ia: boolean;
  created_at: string;
};

const FUNIL_STAGES = [
  { id: 'captacao', label: 'Captação', color: '#64748b', icon: Target },
  { id: 'primeiro_contato', label: 'Primeiro Contato', color: '#94a3b8', icon: Send },
  { id: 'curiosidade', label: 'Curiosidade', color: '#3b82f6', icon: MessageSquare },
  { id: 'interesse', label: 'Interesse', color: '#8b5cf6', icon: Zap },
  { id: 'qualificacao', label: 'Qualificação', color: '#ec4899', icon: BarChart3 },
  { id: 'objecao', label: 'Objeção', color: '#f59e0b', icon: Clock },
  { id: 'pronto_handoff', label: 'Pronto p/ Handoff', color: '#10b981', icon: CheckCircle },
  { id: 'descartado', label: 'Descartado', color: '#ef4444', icon: XCircle },
];

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [disparosCount, setDisparosCount] = useState(0);
  const [respondidosCount, setRespondidosCount] = useState(0);
  const [followupsPendentes, setFollowupsPendentes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [leadRes, dispRes, followRes] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('disparos_massa').select('id, respondeu'),
      supabase.from('followups').select('id, status').eq('status', 'pendente'),
    ]);

    const leadsData = leadRes.data || [];
    setLeads(leadsData);

    const disps = dispRes.data || [];
    setDisparosCount(disps.length);
    setRespondidosCount(disps.filter((d: any) => d.respondeu).length);

    setFollowupsPendentes((followRes.data || []).length);
    setLoading(false);
  };

  // Stats derivados
  const totalLeads = leads.length;
  const qualificados = leads.filter(l => (l.score ?? 0) >= 50).length;
  const prontoHandoff = leads.filter(l => l.fase_funil === 'pronto_handoff').length;
  const iaPausada = leads.filter(l => l.pausar_ia).length;
  const taxaResposta = disparosCount > 0 ? Math.round((respondidosCount / disparosCount) * 100) : 0;

  // Sem interação há 7+ dias
  const now = new Date();
  const semInteracao7d = leads.filter(l => {
    if (!l.ultima_interacao) return true;
    const diff = now.getTime() - new Date(l.ultima_interacao).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  }).length;

  // Leads por segmento
  const segmentoMap: Record<string, number> = {};
  leads.forEach(l => {
    const seg = l.segmento || 'Sem segmento';
    segmentoMap[seg] = (segmentoMap[seg] || 0) + 1;
  });
  const topSegmentos = Object.entries(segmentoMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Funil data
  const funilData = FUNIL_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.fase_funil === stage.id).length,
  }));
  const maxFunil = Math.max(...funilData.map(f => f.count), 1);

  // Score médio
  const leadsComScore = leads.filter(l => l.score !== null && l.score !== undefined);
  const scoreMedio = leadsComScore.length > 0
    ? Math.round(leadsComScore.reduce((sum, l) => sum + (l.score || 0), 0) / leadsComScore.length)
    : 0;

  // Recent leads
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.ultima_interacao || b.created_at).getTime() - new Date(a.ultima_interacao || a.created_at).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-zinc-500">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-gradient-primary text-2xl font-bold">Overview B2B</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral do funil de prospecção da Up Produções.</p>
      </div>

      {/* === KPI Cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users size={20} />} label="Total Leads" value={totalLeads} iconBg="bg-indigo-500/10" iconColor="text-indigo-400" />
        <KpiCard icon={<Target size={20} />} label="Qualificados" value={qualificados} iconBg="bg-violet-500/10" iconColor="text-violet-400" subtitle={`Score ≥ 50`} />
        <KpiCard icon={<CheckCircle size={20} />} label="Pronto Handoff" value={prontoHandoff} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        <KpiCard icon={<Send size={20} />} label="Disparos Enviados" value={disparosCount} iconBg="bg-cyan-500/10" iconColor="text-cyan-400" />
      </div>

      {/* === Mini KPIs === */}
      <div className="grid grid-cols-4 gap-3">
        <MiniKpi icon={<TrendingUp size={14} />} label="Taxa Resposta" value={`${taxaResposta}%`} color="text-emerald-400" />
        <MiniKpi icon={<BarChart3 size={14} />} label="Score Médio" value={`${scoreMedio}`} color="text-indigo-400" />
        <MiniKpi icon={<Hand size={14} />} label="IA Pausada" value={`${iaPausada}`} color="text-amber-400" />
        <MiniKpi icon={<Clock size={14} />} label="Sem interação 7d+" value={`${semInteracao7d}`} color="text-red-400" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* === Gráfico de Funil === */}
        <Card className="col-span-7 bg-[#121214] border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funilData.map((stage) => {
              const Icon = stage.icon;
              const percentage = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
              return (
                <div key={stage.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon size={13} style={{ color: stage.color }} />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{stage.count}</span>
                      <span className="text-[10px] text-zinc-600">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(stage.count / maxFunil) * 100}%`,
                        background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* === Top Segmentos === */}
        <Card className="col-span-5 bg-[#121214] border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 size={16} className="text-cyan-400" />
              Segmentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSegmentos.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-4">Nenhum segmento.</p>
            ) : (
              topSegmentos.map(([segmento, count], i) => (
                <div key={segmento} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-200 truncate">{segmento}</span>
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 ml-2">{count}</Badge>
                    </div>
                    <Progress value={(count / totalLeads) * 100} className="h-1" />
                  </div>
                </div>
              ))
            )}

            <Separator className="bg-white/5 my-3" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Follow-ups pendentes</span>
              <Badge className={followupsPendentes > 0 ? 'bg-amber-500/15 text-amber-400 text-xs' : 'bg-zinc-500/15 text-zinc-400 text-xs'}>
                {followupsPendentes}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Leads Recentes === */}
      <Card className="bg-[#121214] border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-violet-400" />
            Interações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition-all group cursor-default">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600/80 to-cyan-500/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {lead.empresa ? lead.empresa.substring(0, 2).toUpperCase() : '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.empresa || lead.whatsapp}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{lead.segmento || 'Sem segmento'}</span>
                    {lead.score !== null && (
                      <span className={`text-[10px] font-bold ${
                        (lead.score ?? 0) >= 80 ? 'text-emerald-400' :
                        (lead.score ?? 0) >= 50 ? 'text-amber-400' :
                        'text-zinc-500'
                      }`}>
                        {lead.score}pts
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${
                  lead.fase_funil === 'pronto_handoff' ? 'bg-emerald-500/15 text-emerald-400' :
                  lead.fase_funil === 'descartado' ? 'bg-red-500/15 text-red-400' :
                  'bg-white/5 text-zinc-400'
                }`}>
                  {lead.fase_funil.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ icon, label, value, iconBg, iconColor, subtitle }: {
  icon: React.ReactNode; label: string; value: number;
  iconBg: string; iconColor: string; subtitle?: string;
}) => (
  <Card className="bg-[#121214] border-white/5 hover:border-white/10 transition-all">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-white animate-count-up">{value}</p>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

const MiniKpi = ({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#121214] border border-white/5">
    <div className={color}>{icon}</div>
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export default Dashboard;
