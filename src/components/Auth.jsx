import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import Icon from "./Icon";
import toast from "react-hot-toast";

const Auth = ({ isDarkMode }) => {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("¡Bienvenido!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Cuenta creada");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-700 ${isDarkMode ? 'bg-black' : 'bg-slate-100'}`}>
      <div className={`w-full max-w-md p-10 rounded-[3rem] border shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <header className="text-center mb-10">
          <h1 className={`text-4xl font-black mb-2 tracking-tighter italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            LUCAS<span className="text-teal-400">.</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Digital Asset Manager</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className={`w-full rounded-2xl py-4 px-6 text-sm outline-none border focus:border-teal-400 transition-all ${isDarkMode ? 'bg-black border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Clave"
            className={`w-full rounded-2xl py-4 px-6 text-sm outline-none border focus:border-teal-400 transition-all ${isDarkMode ? 'bg-black border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 py-4 rounded-2xl font-black text-black uppercase transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Procesando..." : authMode === "login" ? "ACCEDER" : "RECLUTAR"}
          </button>
        </form>
        <button
          onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); }}
          className="w-full mt-8 text-[10px] text-slate-500 font-bold uppercase text-center hover:text-teal-400 transition-colors"
        >
          {authMode === "login" ? "¿Eres nuevo? Regístrate" : "¿Ya tienes cuenta? Login"}
        </button>
      </div>
    </div>
  );
};

export default Auth;