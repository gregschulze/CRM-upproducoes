import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Send, Zap, Clock, CheckCircle, XCircle, MessageSquare,
  TrendingUp, BarChart3, ArrowUpRight
} from 'lucide-react';

type Disparo = {
  id: string;
  lead_id: number;
  whatsapp: string;
  mensagem_enviada: string;
  tipo_campanha: string;
  fase_funil_momento: string | null;
  enviado_em: string;
  status_envio: string;
  respondeu: boolean;
  respondeu_em: string | null;
  contexto_usado: string | null;
};

type FollowupAuto = {
  id: string;
  lead_id: number;
  whatsapp: string;
  tipo_followup: string;
  mensagem_enviada: string;
  fase_funil_momento: string | null;
  enviado_em: string;
  respondeu: boolean;
  respondeu_em: string | null;
};

type FollowupManual = {
  id: number;
  lead_id: number;
  motivo: string | null;
  data_followup: string;
  mensagem_planejada: string | null;
  status: string;
};

const Campanhas = () => {
  const [disparos, setDisparos] = useState<Disparo[]>([]);
  const [followupsAuto, setFollowupsAuto] = useState<FollowupAuto[]>([]);
  const [followupsManuais, setFollowupsManuais] = useState<FollowupManual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [dRes, faRes, fmRes] = await Promise.all([
      supabase.from('disparos_massa').select('*').order('enviado_em', { ascending: false }).limit(100),
      supabase.from('followups_automaticos').select('*').order('enviado_em', { ascending: false }).limit(100),
      supabase.from('followups').select('*').order('data_followup', { ascending: false }).limit(100),
    ]);

    setDisparos(dRes.data || []);
    setFollowupsAuto(faRes.data || []);
    setFollowupsManuais(fmRes.data || []);
    setLoading(false);
  };

  // Stats
  const totalDisparos = disparos.length;
  const respondidos = disparos.filter(d => d.respondeu).length;
  const taxaResposta = totalDisparos > 0 ? Math.round((respondidos / totalDisparos) * 100) : 0;
  const followupsPendentes = followupsManuais.filter(f => f.status === 'pendente').length;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return '-'; }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-gradient-primary text-2xl font-bold">Campanhas & Outbound</h1>
        <p className="text-zinc-400 text-sm mt-1">Acompanhe disparos em massa, follow-ups automáticos e manuais.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#121214] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10">
              <Send size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Total Disparos</p>
              <p className="text-2xl font-bold text-white">{totalDisparos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121214] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <MessageSquare size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Respondidos</p>
              <p className="text-2xl font-bold text-white">{respondidos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121214] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10">
              <TrendingUp size={20} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Taxa Resposta</p>
              <p className="text-2xl font-bold text-white">{taxaResposta}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121214] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Follow-ups Pendentes</p>
              <p className="text-2xl font-bold text-white">{followupsPendentes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="disparos" className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-[#121214] border border-white/5 p-1 h-10 w-fit">
          <TabsTrigger value="disparos" className="text-xs gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <Zap size={14} /> Disparos em Massa ({totalDisparos})
          </TabsTrigger>
          <TabsTrigger value="auto" className="text-xs gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <BarChart3 size={14} /> Follow-ups Auto ({followupsAuto.length})
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <Clock size={14} /> Follow-ups Manuais ({followupsManuais.length})
          </TabsTrigger>
        </TabsList>

        {/* === Disparos em Massa === */}
        <TabsContent value="disparos" className="flex-1 min-h-0 mt-3">
          <Card className="bg-[#121214] border-white/5 h-full">
            <ScrollArea className="h-[calc(100vh-420px)]">
              {loading ? (
                <p className="text-zinc-500 text-sm text-center py-12">Carregando...</p>
              ) : disparos.length === 0 ? (
                <div className="text-center py-16">
                  <Send size={40} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-500">Nenhum disparo em massa registrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs">WhatsApp</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Campanha</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Mensagem</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Data</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Resposta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disparos.map((d) => (
                      <TableRow key={d.id} className="border-white/3 hover:bg-white/3">
                        <TableCell className="text-sm text-zinc-300 font-mono">{d.whatsapp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{d.tipo_campanha}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 max-w-[200px] truncate">{d.mensagem_enviada}</TableCell>
                        <TableCell className="text-xs text-zinc-500">{formatDate(d.enviado_em)}</TableCell>
                        <TableCell>
                          {d.status_envio === 'sucesso' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                              <CheckCircle size={10} className="mr-1" /> Enviado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/15 text-red-400 text-[10px]">
                              <XCircle size={10} className="mr-1" /> Erro
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {d.respondeu ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                              <ArrowUpRight size={10} className="mr-1" /> Sim
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* === Follow-ups Automáticos === */}
        <TabsContent value="auto" className="flex-1 min-h-0 mt-3">
          <Card className="bg-[#121214] border-white/5 h-full">
            <ScrollArea className="h-[calc(100vh-420px)]">
              {followupsAuto.length === 0 ? (
                <div className="text-center py-16">
                  <Zap size={40} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-500">Nenhum follow-up automático registrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs">WhatsApp</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Tipo</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Mensagem</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Data</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Resposta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followupsAuto.map((f) => (
                      <TableRow key={f.id} className="border-white/3 hover:bg-white/3">
                        <TableCell className="text-sm text-zinc-300 font-mono">{f.whatsapp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{f.tipo_followup}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 max-w-[250px] truncate">{f.mensagem_enviada}</TableCell>
                        <TableCell className="text-xs text-zinc-500">{formatDate(f.enviado_em)}</TableCell>
                        <TableCell>
                          {f.respondeu ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                              <ArrowUpRight size={10} className="mr-1" /> Sim
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* === Follow-ups Manuais === */}
        <TabsContent value="manual" className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-[calc(100vh-420px)]">
            {followupsManuais.length === 0 ? (
              <div className="text-center py-16">
                <Clock size={40} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-zinc-500">Nenhum follow-up manual registrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {followupsManuais.map((f) => (
                  <Card key={f.id} className={`bg-[#121214] border-white/5 ${f.status === 'pendente' ? 'border-l-2 border-l-amber-500' : ''}`}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-white">{f.motivo || 'Follow-up'}</CardTitle>
                        <Badge className={`text-[10px] ${
                          f.status === 'pendente' ? 'bg-amber-500/15 text-amber-400' :
                          f.status === 'enviado' ? 'bg-emerald-500/15 text-emerald-400' :
                          'bg-zinc-500/15 text-zinc-400'
                        }`}>
                          {f.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {f.mensagem_planejada && (
                        <p className="text-xs text-zinc-400 line-clamp-3 mb-2">{f.mensagem_planejada}</p>
                      )}
                      <p className="text-[10px] text-zinc-600">
                        {formatDate(f.data_followup)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Campanhas;
