import { useState, useEffect } from "react";
import { db, APP_ID } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { safeNum } from "../utils/helpers";
import Icon from "./Icon";
import toast from "react-hot-toast";

const History = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const colRef = collection(db, `artifacts/${APP_ID}/users/${user.uid}/history`);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHistory(data.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)));
    });
    return unsubscribe;
  }, [user]);

  const deleteHistoryItem = async (id) => {
    try {
      await deleteDoc(doc(db, `artifacts/${APP_ID}/users/${user.uid}/history/${id}`));
      toast.success("Registro eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className={`border rounded-[3rem] overflow-hidden shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} animate-in slide-in-from-bottom-8 duration-700`}>
      <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-teal-400/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-teal-400 rounded-2xl text-black shadow-lg">
            <Icon name="History" size={24} />
          </div>
          <h3 className={`text-sm font-black uppercase tracking-[0.3em] italic ${isDarkMode ? 'text-teal-400' : 'text-slate-900'}`}>
            Auditoría Lucas Core
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-teal-500 rounded-full animate-ping"></span>
          <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">Registros en la Nube</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase text-slate-600 border-b border-slate-800/50 font-black tracking-widest">
              <th className="p-10">Transacción / Fecha</th>
              <th className="p-10 text-center">Periodo</th>
              <th className="p-10 text-right">Monto USD</th>
              <th className="p-10 text-right">Tasa Cierre</th>
              <th className="p-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-40 text-center text-slate-700 uppercase font-black text-[12px] tracking-[1em] italic opacity-30">
                  No Data Available
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id} className={`transition-all duration-300 group ${isDarkMode ? 'hover:bg-teal-500/5' : 'hover:bg-slate-50'}`}>
                  <td className="p-10">
                    <p className={`font-black text-lg uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {h.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase italic flex items-center gap-2">
                      <Icon name="Calendar" size={12} /> {new Date(h.paidAt).toLocaleString('es-VE')}
                    </p>
                  </td>
                  <td className="p-10 text-center">
                    <span className={`text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest border shadow-inner ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {h.monthTag}
                    </span>
                  </td>
                  <td className="p-10 text-right font-mono font-black text-teal-400 text-2xl tracking-tighter">
                    ${safeNum(h.usd).toFixed(2)}
                  </td>
                  <td className="p-10 text-right font-mono text-slate-500 text-sm font-bold">
                    {safeNum(h.appliedRate).toFixed(2)} Bs.
                  </td>
                  <td className="p-10 text-right">
                    <button
                      onClick={() => deleteHistoryItem(h.id)}
                      className="p-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-2xl"
                    >
                      <Icon name="Trash2" size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;