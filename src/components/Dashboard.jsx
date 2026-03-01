import { useState, useEffect } from "react";
import { db, APP_ID } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { safeNum } from "../utils/helpers";
import Icon from "./Icon";

const Dashboard = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [rates, setRates] = useState({ bcv: 41.11, binance: 61.3, euro: 44.5 });

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const fetchData = async () => {
      // Obtener historial
      const historyCol = collection(db, `artifacts/${APP_ID}/users/${user.uid}/history`);
      const historySnap = await getDocs(historyCol);
      setHistory(historySnap.docs.map((doc) => doc.data()));

      // Obtener tasas
      const settingsRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/settings/global`);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && settingsSnap.data().rates) {
        setRates(settingsSnap.data().rates);
      }
    };
    fetchData();
  }, [user]);

  const totalSpentUSD = history.reduce((acc, h) => acc + safeNum(h.usd), 0);
  const totalSpentBs = history.reduce(
    (acc, h) => acc + safeNum(h.usd) * safeNum(h.appliedRate),
    0
  );
  const arbitrageSaving = history.reduce(
    (acc, h) => acc + safeNum(h.usd) * rates.binance - safeNum(h.usd) * safeNum(h.appliedRate),
    0
  );
  const power = 250 * rates.binance / (rates.bcv || 1); // mismo cálculo que en expenses

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-700">
      <div className={`p-12 rounded-[4rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-12 opacity-5 text-teal-400 rotate-12">
          <Icon name="BarChart3" size={200} />
        </div>
        <h3 className={`text-xs font-black uppercase text-teal-400 mb-16 flex items-center gap-4 tracking-[0.3em]`}>
          <Icon name="Activity" size={20} /> Análisis de Salud
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="relative w-56 h-56 group">
            <div className="absolute inset-0 bg-teal-400/20 blur-[50px] rounded-full group-hover:bg-teal-400/40 transition-all duration-1000"></div>
            <svg className="w-full h-full transform -rotate-90 relative z-10">
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="18"
                fill="transparent"
                className={isDarkMode ? 'text-slate-800' : 'text-slate-100'}
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="18"
                fill="transparent"
                strokeDasharray={628}
                strokeDashoffset={628 - (628 * Math.min(totalSpentUSD / 250, 1))}
                className="text-teal-400 transition-all duration-[2000ms] ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className={`text-5xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {Math.min((totalSpentUSD / 250) * 100, 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Ejecución</span>
            </div>
          </div>
          <div className="flex-1 space-y-8 w-full">
            <div className="group border-l-4 border-slate-800 pl-6 py-2 hover:border-teal-500 transition-all">
              <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-1">Poder Real Mercado</p>
              <p className="text-3xl font-black text-teal-400">${power.toFixed(2)}</p>
            </div>
            <div className="group border-l-4 border-slate-800 pl-6 py-2 hover:border-teal-500 transition-all">
              <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-1">Ahorro Arbitraje</p>
              <p className="text-3xl font-black text-indigo-400">
                Bs. {arbitrageSaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;