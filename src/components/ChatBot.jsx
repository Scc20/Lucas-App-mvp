import { useState } from "react";
import { db, APP_ID } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import Icon from "./Icon";
import toast from "react-hot-toast";

const ChatBot = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "¡Epa Bray! LUCAS en línea. ¿Qué operación anotamos?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const callAI = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Solo para desarrollo, mover a backend en producción
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Eres LUCAS. Extrae: {"item": string, "monto": number, "tasa": "BCV" | "BINANCE" | "EURO"}. Texto: "${userMessage}"`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      const data = await response.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `¿Registro ${parsed.item} ($${parsed.monto}) a tasa ${parsed.tasa}?`,
          action: parsed,
        },
      ]);
    } catch (error) {
      toast.error("Error al procesar mensaje");
      setMessages((prev) => [...prev, { role: "bot", text: "Error neural. Intenta de nuevo." }]);
    } finally {
      setTyping(false);
    }
  };

  const confirmAction = async (action) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/expenses`), {
        name: action.item,
        usd: action.monto,
        type: action.tasa,
        createdAt: new Date().toISOString(),
      });
      setMessages((prev) => [...prev, { role: "bot", text: "Operación inyectada en la bóveda." }]);
      toast.success("Gasto registrado");
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50">
      {isOpen ? (
        <div
          className={`w-80 sm:w-96 h-[550px] border rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500 ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <header className="bg-teal-400 p-6 text-black flex justify-between items-center shadow-lg relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black rounded-xl text-teal-400 shadow-lg">
                <Icon name="Zap" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">Lucas AI Assistant</span>
                <span className="text-[8px] font-bold uppercase opacity-60 tracking-[0.2em]">Neural Link v14.7</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:scale-125 transition-all bg-black/5 p-2 rounded-full">
              <Icon name="X" size={22} />
            </button>
          </header>
          <div className={`flex-1 p-6 overflow-y-auto space-y-5 scrollbar-hide ${isDarkMode ? 'bg-black/40' : 'bg-slate-50'}`}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-5 rounded-[2rem] text-[11px] shadow-xl ${
                    msg.role === 'user'
                      ? 'bg-teal-500 text-black font-black uppercase italic shadow-teal-500/20'
                      : isDarkMode
                      ? 'bg-slate-900 text-slate-300 border border-slate-700'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
                  } leading-relaxed`}
                >
                  {msg.text}
                  {msg.action && (
                    <button
                      onClick={() => confirmAction(msg.action)}
                      className="mt-5 block w-full bg-teal-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-black/40"
                    >
                      Confirmar en el Núcleo
                    </button>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-3 items-center text-[10px] text-teal-400 font-black uppercase animate-pulse italic">
                <Icon name="RefreshCcw" size={14} className="animate-spin" /> Procesando datos de Bray...
              </div>
            )}
          </div>
          <div className={`p-6 border-t flex gap-4 ${isDarkMode ? 'bg-black/80 border-slate-800' : 'bg-white border-slate-200'}`}>
            <input
              className={`flex-1 rounded-2xl px-6 py-4 text-xs outline-none focus:border-teal-400 transition-all ${
                isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 shadow-inner'
              }`}
              placeholder="Ej: 'Anota 45 de Cantv'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && callAI()}
            />
            <button
              onClick={callAI}
              className="p-4 bg-teal-400 text-black rounded-2xl shadow-xl active:scale-90 transition-all hover:bg-teal-300"
            >
              <Icon name="Send" size={22} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(45,212,191,0.5)] hover:scale-110 hover:rotate-12 transition-all text-black border-[6px] border-black group p-6"
        >
          <Icon name="Bot" size={40} className="group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default ChatBot;