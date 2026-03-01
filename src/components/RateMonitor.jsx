import { useState } from "react";
import { db, APP_ID } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import Icon from "./Icon";
import toast from "react-hot-toast";

const RateMonitor = ({ isDarkMode, rates, setRates }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveRates = async () => {
    if (!user || user.isAnonymous) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, `artifacts/${APP_ID}/users/${user.uid}/settings/global`),
        { rates },
        { merge: true }
      );
      toast.success("Tasas guardadas");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setRates((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-5 shadow-2xl`}>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Monitor de Tasas</p>
        <button
          onClick={saveRates}
          className={`p-2.5 rounded-xl transition-all ${
            saving ? 'bg-teal-500 text-black' : 'bg-slate-800/20 text-teal-400 hover:bg-teal-400/10'
          }`}
        >
          <Icon name={saving ? "RefreshCcw" : "Save"} size={16} className={saving ? "animate-spin" : ""} />
        </button>
      </div>
      {["bcv", "binance", "euro"].map((key) => (
        <div
          key={key}
          className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
            isDarkMode
              ? 'bg-black/40 border-slate-800 hover:border-teal-500/30'
              : 'bg-slate-50 border-slate-100 hover:border-teal-500/30'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{key}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-600 font-bold">Bs.</span>
            <input
              type="number"
              value={rates[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="bg-transparent text-right font-mono font-black text-xl text-teal-400 outline-none w-24 focus:text-teal-300"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RateMonitor;