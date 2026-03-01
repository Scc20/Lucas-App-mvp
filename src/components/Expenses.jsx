import { useState, useEffect, useMemo } from "react";
import { db, APP_ID } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { safeNum } from "../utils/helpers";
import Icon from "./Icon";
import RateMonitor from "./RateMonitor";
import toast from "react-hot-toast";

const Expenses = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [rates, setRates] = useState({ bcv: 41.11, binance: 61.3, euro: 44.5 });
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    name: "",
    usd: "",
    type: "BCV",
    date: new Date().toISOString().split("T")[0],
  });

  // Cargar tasas guardadas (si existen)
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const fetchRates = async () => {
      const settingsRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/settings/global`);
      const snap = await getDoc(settingsRef);
      if (snap.exists() && snap.data().rates) {
        setRates(snap.data().rates);
      }
    };
    fetchRates();
  }, [user]);

  // Escuchar gastos en tiempo real
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const colRef = collection(db, `artifacts/${APP_ID}/users/${user.uid}/expenses`);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user]);

  const metrics = useMemo(() => {
    const income = 250 * safeNum(rates.binance); // supuesto ingreso fijo
    const power = income / (safeNum(rates.bcv) || 1);
    const totalBs = expenses.reduce(
      (acc, exp) =>
        acc +
        safeNum(exp.usd) *
          (exp.type === "BINANCE" ? rates.binance : exp.type === "EURO" ? rates.euro : rates.bcv),
      0
    );
    const restaBs = income - totalBs;
    return { restaBs, restaUSD: restaBs / (safeNum(rates.bcv) || 1), power };
  }, [rates, expenses]);

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.usd) {
      toast.error("Completa los campos");
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/expenses`), {
        ...newExpense,
        usd: safeNum(newExpense.usd),
        createdAt: new Date().toISOString(),
      });
      setNewExpense({ name: "", usd: "", type: "BCV", date: new Date().toISOString().split("T")[0] });
      toast.success("Gasto agregado");
    } catch (error) {
      toast.error("Error al agregar");
    }
  };

  const markPaid = async (exp) => {
    const rate = exp.type === "BINANCE" ? rates.binance : exp.type === "EURO" ? rates.euro : rates.bcv;
    const month = new Date().toLocaleString("es-ES", { month: "long" });
    try {
      // Mover a history
      await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/history`), {
        ...exp,
        paidAt: new Date().toISOString(),
        appliedRate: rate,
        monthTag: month,
      });
      // Eliminar de expenses
      await deleteDoc(doc(db, `artifacts/${APP_ID}/users/${user.uid}/expenses/${exp.id}`));
      toast.success("Gasto pagado");
    } catch (error) {
      toast.error("Error al marcar pagado");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, `artifacts/${APP_ID}/users/${user.uid}/expenses/${id}`));
      toast.success("Eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="lg:col-span-4 space-y-6">
        <div className="bg-teal-500 p-8 rounded-[3rem] text-black shadow-2xl relative overflow-hidden group border border-teal-400/20">
          <Icon name="ArrowUpRight" size={160} className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 opacity-70 flex items-center gap-2">
            Saldo Neto Real <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
          </h3>
          <p className="text-7xl font-black tracking-tighter italic">${metrics.restaUSD.toFixed(2)}</p>
          <div className="mt-8 pt-8 border-t border-black/10 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">Caja en Bs.</p>
              <p className="text-3xl font-black">
                {metrics.restaBs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase opacity-60 mb-1">Bono Arbitraje</p>
              <p className="text-xl font-black text-black/80">
                +${(metrics.power - 250).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <RateMonitor isDarkMode={isDarkMode} rates={rates} setRates={setRates} />
      </section>

      <section className={`lg:col-span-8 p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl flex flex-col`}>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 shadow-inner">
              <Icon name="Target" size={24} />
            </div>
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Lucas Pendientes
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 bg-black/20 px-5 py-2 rounded-full border border-slate-800 tracking-widest">
            {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto max-h-[450px] pr-4 scrollbar-hide mb-10">
          {expenses.length === 0 && (
            <div className="py-32 text-center text-slate-600 uppercase font-black text-[11px] tracking-[0.8em] italic opacity-40">
              Bóveda Vacía
            </div>
          )}
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className={`flex justify-between items-center p-6 rounded-[2.2rem] border group transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black/30 border-slate-800 hover:border-teal-500/50 shadow-lg shadow-black/20'
                  : 'bg-slate-50 border-slate-100 hover:border-teal-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner ${
                    exp.type === 'BINANCE'
                      ? 'bg-teal-500/10 text-teal-400'
                      : exp.type === 'EURO'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  <Icon name={exp.type === 'EURO' ? 'Euro' : 'DollarSign'} size={22} />
                </div>
                <div>
                  <p className={`font-black text-base uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {exp.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                      {exp.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <p className={`font-mono font-black text-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  ${safeNum(exp.usd).toFixed(2)}
                </p>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={() => markPaid(exp)}
                    className="p-4 bg-teal-500/20 text-teal-400 rounded-2xl hover:bg-teal-500 hover:text-black transition-all shadow-xl"
                  >
                    <Icon name="CheckCircle" size={22} />
                  </button>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Icon name="Trash2" size={22} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`p-8 bg-black/40 border border-slate-800 rounded-[2.8rem] grid grid-cols-1 md:grid-cols-12 gap-5 items-end shadow-inner transition-all ${isDarkMode ? 'opacity-100' : 'opacity-90'}`}>
          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-3 mb-2 block tracking-[0.2em]">Concepto</label>
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white focus:border-teal-400 outline-none transition-all"
              placeholder="Pago Internet"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-3 mb-2 block tracking-[0.2em]">Monto $</label>
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white focus:border-teal-400 outline-none transition-all"
              type="number"
              placeholder="0.00"
              value={newExpense.usd}
              onChange={(e) => setNewExpense({ ...newExpense, usd: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-3 mb-2 block tracking-[0.2em]">Fecha</label>
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-[10px] text-white focus:border-teal-400 outline-none transition-all uppercase font-black"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-3 mb-2 block tracking-[0.2em]">Tasa</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 text-xs text-white outline-none cursor-pointer font-black appearance-none"
              value={newExpense.type}
              onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
            >
              <option value="BCV">Oficial BCV</option>
              <option value="BINANCE">P2P Binance</option>
              <option value="EURO">Oficial Euro</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button
              onClick={handleAddExpense}
              className="w-full h-[52px] bg-teal-500 hover:bg-teal-400 text-black rounded-2xl flex justify-center items-center shadow-[0_10px_20px_rgba(45,212,191,0.3)] transition-all active:scale-90"
            >
              <Icon name="Plus" size={24} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Expenses;