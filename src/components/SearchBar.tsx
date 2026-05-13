import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Search, MapPin, Tag } from 'lucide-react';
import type { Lead } from '@/pages/Kanban';

type Props = {
  onSelectLead?: (lead: Lead) => void;
};

const SearchBar = ({ onSelectLead }: Props) => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const searchLeads = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const { data } = await supabase
      .from('leads')
      .select('*')
      .or(`empresa.ilike.%${searchQuery}%,whatsapp.ilike.%${searchQuery}%,segmento.ilike.%${searchQuery}%,cidade.ilike.%${searchQuery}%,nome.ilike.%${searchQuery}%`)
      .limit(8);

    setResults(data || []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchLeads(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchLeads]);

  const handleSelect = (lead: Lead) => {
    setOpen(false);
    setQuery('');
    if (onSelectLead) {
      onSelectLead(lead);
    } else {
      navigate('/funil');
    }
  };

  const faseColor: Record<string, string> = {
    primeiro_contato: 'bg-slate-500/20 text-slate-300',
    curiosidade: 'bg-blue-500/20 text-blue-300',
    interesse: 'bg-violet-500/20 text-violet-300',
    qualificacao: 'bg-pink-500/20 text-pink-300',
    objecao: 'bg-amber-500/20 text-amber-300',
    pronto_handoff: 'bg-emerald-500/20 text-emerald-300',
    descartado: 'bg-red-500/20 text-red-300',
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-white/15 transition-all text-zinc-400 text-sm w-72 group"
      >
        <Search size={15} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        <span className="flex-1 text-left">Buscar lead...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="bg-[#0f0f11] border border-white/8">
          <CommandInput
            placeholder="Buscar por empresa, WhatsApp, segmento, cidade..."
            value={query}
            onValueChange={setQuery}
            className="text-white"
          />
          <CommandList className="max-h-80">
            <CommandEmpty className="text-zinc-500 text-sm py-8 text-center">
              {query.length < 2 ? 'Digite pelo menos 2 caracteres...' : 'Nenhum lead encontrado.'}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Leads">
                {results.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    value={`${lead.empresa} ${lead.whatsapp}`}
                    onSelect={() => handleSelect(lead)}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/5"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {lead.empresa ? lead.empresa.substring(0, 2).toUpperCase() : <Building2 size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {lead.empresa || 'Sem nome'}
                        </span>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${faseColor[lead.fase_funil] || 'bg-zinc-500/20 text-zinc-300'}`}>
                          {lead.fase_funil.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {lead.whatsapp && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Phone size={10} /> {lead.whatsapp}
                          </span>
                        )}
                        {(lead as any).segmento && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Tag size={10} /> {(lead as any).segmento}
                          </span>
                        )}
                        {(lead as any).cidade && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin size={10} /> {(lead as any).cidade}
                          </span>
                        )}
                      </div>
                    </div>
                    {lead.score !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (lead.score ?? 0) >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                        (lead.score ?? 0) >= 50 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {lead.score}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default SearchBar;
