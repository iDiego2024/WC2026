import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, BrainCircuit, Activity, Calculator, RefreshCcw, Database, FileText, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isWidget?: boolean;
  widgetType?: 'simulation' | 'comparison' | 'standings';
};

export function AssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu Analista Táctico Asistido por IA. Estoy conectado en tiempo real a la base de datos del Mundial, simulador Monte Carlo y registros históricos. ¿Qué deseas analizar hoy?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Mock AI response logic
    setTimeout(() => {
      setIsTyping(false);
      
      let aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ''
      };

      const lowerInput = userMessage.content.toLowerCase();

      if (lowerInput.includes('clasifica') || lowerInput.includes('necesita') || lowerInput.includes('empata')) {
        aiResponse.content = 'He ejecutado el motor de reglas (WASM) para el Grupo A. Si Argentina empata con México, llegarían a 4 puntos. Necesitarían que Canadá venza o empate con Perú para asegurar el segundo lugar del grupo. Aquí tienes la tabla calculada en vivo:';
        aiResponse.isWidget = true;
        aiResponse.widgetType = 'standings';
      } else if (lowerInput.includes('favorito') || lowerInput.includes('probabilidad') || lowerInput.includes('simulaciones')) {
        aiResponse.content = 'Basado en 1,000,000 iteraciones del motor Monte Carlo actualizadas hasta hace 5 minutos, este es el análisis predictivo actual para el campeonato. Francia se ha posicionado como el nuevo líder estadístico.';
        aiResponse.isWidget = true;
        aiResponse.widgetType = 'simulation';
      } else if (lowerInput.includes('comparar') || lowerInput.includes('vs')) {
        aiResponse.content = 'He cruzado los datos técnicos y tácticos. España domina en retención y pases progresivos (xP), mientras que Alemania presenta mayor intensidad en presión alta (PPDA) y transiciones rápidas.';
        aiResponse.isWidget = true;
        aiResponse.widgetType = 'comparison';
      } else {
        aiResponse.content = 'He consultado la base de datos histórica (RAG). Entiendo lo que dices. Puedo correr una simulación si lo deseas, u obtener estadísticas de jugadores específicos.';
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 pb-4">
      <header className="space-y-0.5 mb-2 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />
          AI Tactical Assistant
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Powered by RAG, Live DB & Monte Carlo Engine</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Main Chat Area */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl flex flex-col overflow-hidden relative shadow-xl">
          {/* Internal Headers */}
          <div className="p-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between z-10 shrink-0">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">System Online</span>
               </div>
               <div className="hidden sm:flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-slate-400 gap-1"><Database className="w-3 h-3 text-blue-400"/> Live SQL</Badge>
                  <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-slate-400 gap-1"><BrainCircuit className="w-3 h-3 text-purple-400"/> Vectors Active</Badge>
                  <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-slate-400 gap-1"><Calculator className="w-3 h-3 text-orange-400"/> WASM Engine</Badge>
               </div>
             </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
             {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border-2 shadow-md ${msg.role === 'user' ? 'bg-secondary border-white/20' : 'bg-primary border-primary'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-background" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} min-w-0`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-secondary text-white rounded-tr-sm border border-white/5' : 'bg-primary/10 text-slate-200 rounded-tl-sm border border-primary/20 shadow-sm'}`}>
                      {msg.content}
                    </div>

                    {/* Rich Widgets */}
                    {msg.isWidget && msg.widgetType === 'standings' && (
                      <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden mt-1 shadow-lg">
                        <div className="bg-secondary/50 px-3 py-2 border-b border-border/50 text-[10px] font-black uppercase text-white flex items-center gap-2"><Calculator className="w-3.5 h-3.5 text-blue-400"/> Live Calculated Group A</div>
                        <div className="p-3">
                          <table className="w-full text-left text-xs font-mono">
                            <tbody className="divide-y divide-border/50">
                              <tr><td className="py-1 text-emerald-400 font-bold">1. CAN</td><td className="py-1 text-right">3P</td><td className="py-1 text-right font-bold text-white">7 Pts</td></tr>
                              <tr className="bg-primary/10"><td className="py-1 text-primary font-bold">2. ARG</td><td className="py-1 text-right">3P</td><td className="py-1 text-right font-bold text-white">4 Pts</td></tr>
                              <tr className="opacity-50"><td className="py-1 text-slate-400">3. MEX</td><td className="py-1 text-right">3P</td><td className="py-1 text-right">3 Pts</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {msg.isWidget && msg.widgetType === 'simulation' && (
                      <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden mt-1 shadow-lg">
                        <div className="bg-secondary/50 px-3 py-2 border-b border-border/50 text-[10px] font-black uppercase text-white flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-emerald-400"/> Monte Carlo Probabilities</div>
                        <div className="p-3 space-y-2">
                           <div className="flex justify-between items-center text-xs">
                             <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/fr.png" className="w-4" alt=""/> <span className="font-bold text-white">France</span></div>
                             <span className="font-mono text-emerald-400 font-bold">22.4%</span>
                           </div>
                           <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full w-[22.4%]"></div></div>
                           
                           <div className="flex justify-between items-center text-xs mt-3">
                             <div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/br.png" className="w-4" alt=""/> <span className="font-bold text-white">Brazil</span></div>
                             <span className="font-mono text-emerald-400 font-bold">18.5%</span>
                           </div>
                           <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full w-[18.5%]"></div></div>
                        </div>
                      </div>
                    )}

                    {msg.isWidget && msg.widgetType === 'comparison' && (
                      <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden mt-1 shadow-lg">
                        <div className="bg-secondary/50 px-3 py-2 border-b border-border/50 text-[10px] font-black uppercase text-white flex items-center gap-2"><BrainCircuit className="w-3.5 h-3.5 text-purple-400"/> Tactical Vector Analysis</div>
                        <div className="p-4 grid grid-cols-3 gap-2 text-center items-center">
                           <div>
                             <img src="https://flagcdn.com/w40/es.png" className="w-8 h-5.5 mx-auto rounded shadow" alt="ESP"/>
                             <div className="text-[10px] font-black text-white mt-2">ESP</div>
                           </div>
                           <div className="text-[10px] font-mono text-slate-400 uppercase font-bold space-y-2">
                             <div>xG <br/><span className="text-white">1.8 - 1.6</span></div>
                             <div>Poss <br/><span className="text-primary">64% - 52%</span></div>
                           </div>
                           <div>
                             <img src="https://flagcdn.com/w40/de.png" className="w-8 h-5.5 mx-auto rounded shadow" alt="GER"/>
                             <div className="text-[10px] font-black text-white mt-2">GER</div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
             ))}
             
             {isTyping && (
               <div className="flex items-start gap-4 max-w-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary border-2 border-primary flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-background" />
                  </div>
                  <div className="bg-primary/10 px-4 py-4 rounded-2xl rounded-tl-sm border border-primary/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
               </div>
             )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-secondary/20 border-t border-border/50 shrink-0">
             <div className="relative flex items-center">
                <Sparkles className="absolute left-4 w-5 h-5 text-primary opacity-50" />
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregunta sobre probabilidades, qué pasa si, tácticas o historial..."
                  className="w-full bg-background border border-border rounded-full pl-12 pr-14 py-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 rounded-full w-10 h-10 transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </Button>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Context & Suggestions */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-4 pr-1">
           
           <div className="bg-card border border-border rounded-xl p-4">
             <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
               <FileText className="w-3.5 h-3.5 text-primary" /> Prompts Sugeridos
             </h3>
             <div className="space-y-2">
               {[
                 "¿Qué pasa si Argentina empata y Canadá gana?",
                 "Compara el mediocampo de España vs Alemania.",
                 "¿Según las simulaciones, quién es el campeón más probable?",
                 "Dame estadísticas históricas de los enfrentamientos Brasil vs Francia."
               ].map((prompt, i) => (
                 <div 
                   key={i} 
                   onClick={() => setInputValue(prompt)}
                   className="p-3 rounded-lg bg-secondary/50 border border-white/5 hover:border-primary/50 hover:bg-primary/5 text-xs text-slate-300 cursor-pointer transition-colors leading-relaxed"
                 >
                   "{prompt}"
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-card border border-border rounded-xl p-4">
             <h3 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
               <Database className="w-3.5 h-3.5 text-blue-400" /> Contexto Inyectado
             </h3>
             <div className="space-y-3 font-mono text-[9px]">
               <div>
                 <div className="text-slate-500 font-bold uppercase mb-1">RAG Indexes</div>
                 <div className="flex flex-wrap gap-1">
                   <Badge variant="outline" className="text-[8px] bg-secondary border-border text-slate-300">players_tactical_v4</Badge>
                   <Badge variant="outline" className="text-[8px] bg-secondary border-border text-slate-300">wc_history_records</Badge>
                 </div>
               </div>
               <div>
                 <div className="text-slate-500 font-bold uppercase mb-1">Live Tools</div>
                 <ul className="text-slate-400 list-disc pl-4 space-y-1">
                   <li><span className="text-emerald-400">getLiveStandings()</span></li>
                   <li><span className="text-emerald-400">runMonteCarlo(args)</span></li>
                   <li><span className="text-emerald-400">predictMatch(id)</span></li>
                 </ul>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
