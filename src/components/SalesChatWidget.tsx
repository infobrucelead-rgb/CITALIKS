"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { PRICING_PLANS } from "@/config/pricing";

export default function SalesChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, id: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/chat-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirigir a la pasarela de Stripe
      } else {
        alert(data.error || "Error al procesar el pago");
      }
    } catch (err) {
      alert("Error de conexión con la pasarela.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: inputValue, id: Date.now().toString() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.text || "Hubo un error al procesar tu mensaje.",
        id: (Date.now() + 1).toString()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error de conexión temporal. Por favor, inténtalo de nuevo.",
        id: (Date.now() + 1).toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        } fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-black shadow-2xl flex items-center justify-center transition-all duration-300 z-50 glow-hover flex-shrink-0 animate-bounce`}
        aria-label="Abrir chat de soporte"
      >
        <MessageCircle size={28} />
      </button>

      {/* Ventana de Chat */}
      <div
        className={`${
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-8 opacity-0 pointer-events-none"
        } fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] glass border border-white/10 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 shadow-2xl shadow-violet-900/20`}
      >
        {/* Cabecera */}
        <div className="bg-primary/10 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot size={18} className="text-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Asesor CitaLiks</h3>
              <p className="text-[10px] text-emerald-400 font-medium">En línea</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Historial de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
          {messages.length === 0 && (
            <div className="text-center mt-6">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-sm text-white/50">
                ¡Hola! Soy tu asesor virtual. Pregúntame cómo CitaLiks puede 
                evitar que pierdas reservas por no contestar el teléfono.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const hasCheckout = m.role === "assistant" && m.content.includes("[CREATE_CHECKOUT_BUTTONS]");
            const displayContent = m.content.replace("[CREATE_CHECKOUT_BUTTONS]", "").trim();

            return (
              <div key={m.id} className="flex flex-col gap-3">
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-black rounded-tr-sm font-semibold"
                        : "bg-white/10 text-white/90 rounded-tl-sm border border-white/5"
                    }`}
                  >
                    {displayContent}
                  </div>
                </div>

                {hasCheckout && (
                  <div className="flex flex-col gap-2 mt-1 mr-4 ml-6">
                    <p className="text-xs text-white/50 mb-1">Elige tu plan para empezar (20 días gratis):</p>
                    {PRICING_PLANS.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        disabled={isLoading}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          plan.popular 
                            ? 'border-primary/50 bg-primary/10 hover:bg-primary/20' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 right-0">  
                            <span className="text-[9px] bg-primary text-black px-2 py-0.5 rounded-bl-lg font-black shadow-lg">RECOMENDADO</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">{plan.name}</span>
                        </div>
                        <p className="text-[11px] text-white/60 mb-2 leading-tight">{plan.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{plan.priceMonthly}€<span className="text-[10px] font-normal text-white/50">/mes</span></span>
                          {plan.setupFee > 0 ? (
                            <span className="text-[10px] text-white/40">+{plan.setupFee}€ setup</span>
                          ) : (
                            <span className="text-[10px] text-primary font-black tracking-wide uppercase">¡Setup Gratis!</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Formulario */}
        <div className="p-3 bg-black/60 border-t border-white/10">
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-violet-500/50 transition-colors"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              placeholder="Escribe tu duda aquí..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-3 text-primary hover:text-green-400 disabled:opacity-50 disabled:hover:text-primary transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
