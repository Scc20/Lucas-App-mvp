import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import Icon from "./Icon";
import toast from "react-hot-toast";

const Navbar = ({ isDarkMode, setIsDarkMode, activeTab, setActiveTab }) => {
  const tabs = ["operaciones", "historial", "dashboard"];

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success("Hasta luego");
  };

  return (
    <nav className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center text-black font-black italic shadow-lg shadow-teal-500/20">
          L
        </div>
        <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          LUCAS<span className="text-teal-400">.</span>
        </h2>
      </div>

      <div className={`flex gap-1 p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-teal-400 text-black shadow-lg'
                : 'text-slate-500 hover:text-teal-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-2xl border transition-all ${
            isDarkMode
              ? 'border-slate-800 text-yellow-400 hover:bg-slate-900'
              : 'border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Icon name={isDarkMode ? "Sun" : "Moon"} size={20} />
        </button>
        <button
          onClick={handleSignOut}
          className="p-3 rounded-2xl border border-slate-800 text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <Icon name="LogOut" size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;