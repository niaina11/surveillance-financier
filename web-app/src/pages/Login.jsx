import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]= useState(null);
  const [isLoading, setIsLoading]= useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          mot_de_passe: password
        })
      })

      const result = await response.json();

      if(!response.ok){
        throw new Error(result.message || 'Erreur lors de login')
      }

      localStorage.setItem('token', result.data.token);
      localStorage.setItem('role', result.data.role);
      localStorage.setItem('id_utilisateur', result.data.id_utilisateur);
      navigate('/dashboard');
      
      
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }

  };

  return (
  <div 
    className="min-h-screen flex items-center justify-center p-4" 
    style={{ background: 'linear-gradient(135deg, #0033A0 0%, #001A50 100%)' }}
  >
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10">
      
      {/* En-tête du Formulaire */}
      <div className="flex flex-col items-center mb-8">
        {/* Badge d'icône aux couleurs inversées Paositra */}
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-[#0033A0]/10"
          style={{ backgroundColor: '#FFD100' }}
        >
          <ShieldCheck size={32} style={{ color: '#0033A0' }} />
        </div>
        <h1 className="font-display text-2xl font-black text-[#0033A0] tracking-tight">
          Surveillance Financière
        </h1>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-1">
          Paositra Malagasy
        </p>

        {/* Message d'erreur s'il existe */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl w-full text-center">
            {error}
          </div>
        )}
      </div>

      {/* Formulaire de Connexion */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
            Adresse Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="votre.nom@paositra.mg"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent font-medium shadow-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent font-medium shadow-sm transition-all"
          />
        </div>

        {/* Bouton d'action principal Jaune avec texte Bleu */}
        <button
          disabled={isLoading}
          type="submit"
          className="w-full py-3.5 rounded-xl font-black text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          style={{ 
            backgroundColor: '#FFD100', 
            color: '#0033A0',
            boxShadow: '0 4px 14px -4px rgba(255, 209, 0, 0.6)'
          }}
        >
          {isLoading ? 'Authentification...' : 'Se connecter au système'}
        </button>
      </form>
    </div>
  </div>
);

}