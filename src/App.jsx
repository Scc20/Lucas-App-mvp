import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Toaster } from "react-hot-toast";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Expenses from "./components/Expenses";
import History from "./components/History";
import ChatBot from "./components/ChatBot";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("operaciones");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Inicio anónimo automático (si no hay usuario)
    if (!user && !loading) {
      signInAnonymously(auth).catch(console.error);
    }

    return unsubscribe;
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-teal-400 font-black">
        Cargando LUCAS...
      </div>
    );
  }

  if (!user) {
    return <Auth isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black text-slate-200" : "bg-slate-50 text-slate-800"} transition-colors duration-500`}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {activeTab === "operaciones" && <Expenses isDarkMode={isDarkMode} />}
        {activeTab === "historial" && <History isDarkMode={isDarkMode} />}
        {activeTab === "dashboard" && <Dashboard isDarkMode={isDarkMode} />}
      </main>
      <ChatBot isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;