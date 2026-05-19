import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, KanbanSquare, MessageSquare, Settings, Send, Zap
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [iaCount, setIaCount] = useState(0);
  const [followupCount, setFollowupCount] = useState(0);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchBadges = async () => {
    const [iaRes, followRes] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('pausar_ia', true),
      supabase.from('followups').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    ]);
    setIaCount(iaRes.count || 0);
    setFollowupCount(followRes.count || 0);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/funil', label: 'Funil SDR', icon: KanbanSquare },
    { path: '/chat', label: 'Conversas', icon: MessageSquare, badge: iaCount > 0 ? iaCount : null, badgeColor: 'bg-amber-500/20 text-amber-400' },
    { path: '/campanhas', label: 'Campanhas', icon: Send, badge: followupCount > 0 ? followupCount : null, badgeColor: 'bg-indigo-500/20 text-indigo-400' },
    { path: '/configuracao', label: 'Configuração', icon: Settings },
  ];

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#0f0f11] border-r border-white/5">
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <h1 className="text-xl font-bold">
          <span className="text-gradient-primary">UpProdutora</span>
        </h1>
        <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest">CRM • SDR Agent</p>
      </div>

      <Separator className="bg-white/5 mx-4" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} delayDuration={600}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-300 transition-colors'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className={`text-[10px] px-1.5 py-0 h-4 min-w-[20px] justify-center ${item.badgeColor}`}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-900 border-zinc-700 text-zinc-200 text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="bg-white/5 mx-4" />

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
            <Zap size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Agente B2B</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
