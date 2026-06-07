import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, RefreshCcw, ShieldCheck, Play, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

export function AdminStatusView() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime updates on sync_logs
    const channel = supabase
      .channel('public:sync_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_logs' },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTrigger = async (fnName: string) => {
    setTriggering(prev => ({ ...prev, [fnName]: true }));
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      if (!response.ok) {
        throw new Error(`Execution failed: HTTP ${response.status}`);
      }
      alert(t('adminStatus.triggerSuccess', `Sincronización '${fnName}' ejecutada con éxito.`).replace('{fnName}', fnName));
      fetchLogs();
    } catch (e: any) {
      console.error(e);
      alert(t('adminStatus.triggerFailed', `Error ejecutando '${fnName}': ${e.message}`).replace('{fnName}', fnName).replace('{message}', e.message));
    } finally {
      setTriggering(prev => ({ ...prev, [fnName]: false }));
    }
  };

  // Compute aggregate statistics
  const apiCallsLast24h = logs.reduce((acc, log) => acc + (log.api_calls_count || 0), 0);
  const totalErrors = logs.filter(log => log.status === 'error').length;
  const avgLatency = logs.length > 0
    ? Math.round(logs.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / logs.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="space-y-0.5 border-b border-border/50 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            {t('adminStatus.title')}
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t('adminStatus.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 bg-secondary/50 p-2 rounded-lg border border-border">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500">{t('adminStatus.healthStatus')}</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('adminStatus.operational')}
            </span>
          </div>
        </div>
      </header>

      {/* Grid: Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('adminStatus.quotaConsumed')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-white font-mono">{apiCallsLast24h} <span className="text-xs font-normal text-slate-400">{t('adminStatus.requests')}</span></div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-primary h-full" style={{ width: `${Math.min(100, (apiCallsLast24h / 100) * 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('adminStatus.avgLatency')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-white font-mono">{avgLatency} <span className="text-xs font-normal text-slate-400">ms</span></div>
            <div className="text-[10px] text-slate-500 mt-2">{t('adminStatus.denoSpeed')}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('adminStatus.successRate')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-white font-mono">
              {logs.length > 0 ? `${Math.round(((logs.length - totalErrors) / logs.length) * 100)}%` : '100%'}
            </div>
            <div className="text-[10px] text-slate-500 mt-2">{totalErrors} {t('adminStatus.errorsDetected')}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Realtime WebSockets</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-emerald-400 font-mono">{t('adminStatus.realtimeActive')}</div>
            <div className="text-[10px] text-slate-500 mt-2">{t('adminStatus.realtimeDesc')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sync Trigger Controls */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="p-4 border-b border-border/50 bg-secondary/30">
              <CardTitle className="text-xs font-black uppercase text-slate-200">{t('adminStatus.forceSync')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { name: 'sync-fixtures', label: 'Calendario y Equipos', desc: 'Sincroniza estadios, selecciones clasificados y fixture general.' },
                { name: 'sync-live-matches', label: 'Partidos en Vivo', desc: 'Actualiza marcadores, alineaciones, estadísticas y eventos de juegos activos.' },
                { name: 'sync-rankings', label: 'FIFA / ELO Rankings', desc: 'Recalcula ratings ELO dinámicos y actualiza rachas de victorias.' },
                { name: 'sync-standings', label: 'Standings de Grupos', desc: 'Recompila tablas de posiciones en base a resultados almacenados.' },
              ].map(fn => (
                <div key={fn.name} className="p-3 bg-secondary/50 border border-white/5 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-white">{fn.label}</h4>
                      <p className="text-[9px] text-slate-400 mt-1">{fn.desc}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleTrigger(fn.name)}
                    disabled={triggering[fn.name]}
                    className="w-full text-[9px] font-bold uppercase h-8"
                  >
                    {triggering[fn.name] ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : (
                      <Play className="w-3.5 h-3.5 mr-2" />
                    )}
                    {triggering[fn.name] ? t('adminStatus.triggering', 'Triggering...') : `${t('ops.run', 'Run')} ${fn.name}`}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Realtime Executions Log table */}
        <div className="lg:col-span-8">
          <Card className="bg-card border-border flex flex-col h-full">
            <CardHeader className="p-4 border-b border-border/50 bg-secondary/30">
              <CardTitle className="text-xs font-black uppercase text-slate-200">Realtime Executions Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCcw className="w-4 h-4 animate-spin text-primary" /> {t('adminStatus.loadingLogs')}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">{t('adminStatus.noLogs')}</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-[9px] text-slate-500 uppercase tracking-wider bg-black/10">
                      <th className="p-3">{t('adminStatus.function')}</th>
                      <th className="p-3">{t('adminStatus.status')}</th>
                      <th className="p-3 text-center">{t('adminStatus.updated')}</th>
                      <th className="p-3 text-center">{t('adminStatus.apiCalls')}</th>
                      <th className="p-3 text-center">{t('adminStatus.latency')}</th>
                      <th className="p-3 text-right">{t('adminStatus.timestamp')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-mono text-[10px]">
                    {logs.map((log) => {
                      const isErr = log.status === 'error';
                      return (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-sans font-bold text-white">{log.function_name}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${isErr ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                              {isErr ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              {log.status}
                            </span>
                            {isErr && (
                              <div className="text-[9px] text-red-400 mt-1 max-w-[200px] truncate" title={log.error_message}>
                                {log.error_message}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-300">{log.records_updated}</td>
                          <td className="p-3 text-center text-slate-300">{log.api_calls_count}</td>
                          <td className="p-3 text-center text-slate-300">{log.execution_time_ms} ms</td>
                          <td className="p-3 text-right text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
