import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, Check, Copy, HelpCircle, Loader2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

function cleanLatexForMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\$\$([^$]+)\$\$/g, (_, eq) => `\n> ${eq.trim()}\n`)
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\%/g, '%');
}

export const GeminiAssistant: React.FC<Props> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: '¡Hola! Soy **PorcIA**, tu **IA de Escritorio y Asistente Técnico** de la Unidad Didáctico-Productiva **«Pozo del Carril · La Aguada» (UNRC - FCE)**.\n\nPoseo **doble capacidad** para acompañarte:\n• **IA de Escritorio Universal:** Puedes consultarme sobre **cualquier tema** que quieras averiguar (cultura general, ciencia, historia, geografía, redacción, matemática, programación, economía general, resúmenes, etc.).\n• **Especialista Situado en el Sistema Porcino:** Estoy 100% ubicado en este modelo de ciclo completo a campo: manejo zootécnico (partos, destetes, recría, engorde), raciones e ICA, cotizaciones de mercado (ROSPORC, maíz, soja), valuación VNR de existencias de capones, indicador CMI A5 de visitas estudiantiles o cómo operar cada módulo del sistema.\n\n¿Qué te gustaría consultar o resolver hoy?',
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sugerencias = [
    '¿Dónde estamos y qué modelo porcino gestiona este sistema?',
    '¿Quién descubrió la penicilina y en qué año?',
    '¿Cómo se utiliza el modelo de gestión porcina paso a paso?',
    '¿Qué mide el indicador A5 y cómo se registran las visitas?',
    '¿Cómo se calcula el VNR de capones a faena?',
    'Explícame la diferencia entre recría y terminación',
    'Escribe un breve resumen de los hitos de la inteligencia artificial'
  ];

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: '¡Conversación reiniciada! ¿Qué consulta, tema general o del sistema porcino te gustaría explorar ahora?',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = async (texto?: string) => {
    const consulta = (texto || prompt).trim();
    if (!consulta || loading) return;

    const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', text: consulta, time: horaActual };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const historyToSend = messages.slice(1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: consulta,
          history: historyToSend 
        }),
      });
      
      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        text: data.text || 'Sin respuesta del asistente.',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        role: 'assistant',
        text: 'Ocurrió un inconveniente al conectar con el servicio de IA. Por favor intente nuevamente.',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] max-h-[680px] shadow-2xl border border-[#d8e2d7] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Cabecera */}
        <div className="bg-[#0b1f14] text-white p-4 flex items-center justify-between border-b border-[#1b442b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1b5e37] border border-[#2d8350] flex items-center justify-center text-[#7ee7a9] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-tight">
                  PorcIA · IA de Escritorio & Gestión Porcina
                </h3>
                <span className="text-[10px] bg-[#164428] text-[#7ee7a9] px-2 py-0.5 rounded-full font-semibold border border-[#2a6b43] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7ee7a9] animate-pulse"></span>
                  IA en Tiempo Real
                </span>
              </div>
              <p className="text-[11px] text-[#9fc4ac]">
                Establecimiento Pozo del Carril · UNRC & IA Universal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-[#9fc4ac] hover:text-white hover:bg-[#163b25] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Reiniciar conversación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Reiniciar</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9fc4ac] hover:text-white hover:bg-[#163b25] transition-colors cursor-pointer"
              title="Cerrar Asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf8]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index} 
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#143a24] text-[#7ee7a9] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                    isUser 
                      ? 'bg-[#1b5e37] text-white rounded-tr-xs' 
                      : 'bg-white text-[#193323] border border-[#dce6dc] rounded-tl-xs prose prose-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-line">{msg.text}</div>
                  ) : (
                    <div className="markdown-content space-y-1.5">
                      <ReactMarkdown>
                        {cleanLatexForMarkdown(msg.text)}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className={`flex items-center justify-between gap-4 mt-2 pt-1 border-t ${isUser ? 'border-[#2d7d4f] text-[#b6e3c6]' : 'border-[#edf2ed] text-[#789182]'}`}>
                    <span className="text-[10px]">{msg.time}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        className="text-[10px] flex items-center gap-1 hover:text-[#1b5e37] cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-[#16a34a]" />
                            <span className="text-[#16a34a]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#2b6b47] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#143a24] text-[#7ee7a9] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#dce6dc] rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2 text-xs text-[#486353]">
                <Loader2 className="w-4 h-4 animate-spin text-[#1b5e37]" />
                <span>Analizando consulta con Gemini...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sugerencias Rápidas */}
        <div className="p-2.5 bg-[#f0f5f1] border-t border-[#dce7dc] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-[#597463] font-semibold shrink-0 px-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Sugerencias:
          </span>
          {sugerencias.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              className="bg-white hover:bg-[#e4ede5] text-[#1c472d] border border-[#cbdacd] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium text-[11px]"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Barra de Entrada */}
        <div className="p-3 bg-white border-t border-[#dce6dc]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pregúntame cualquier cosa (cultura general, ciencia, redacción, matemática, o el sistema porcino)..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-[#f8faf8] border border-[#cbdacd] rounded-xl text-xs text-[#173322] focus:outline-none focus:ring-2 focus:ring-[#1b5e37]/30 focus:border-[#1b5e37] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2.5 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
