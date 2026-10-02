import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

const API = 'http://localhost:3000/api/auth';

export default function Utilisateurs() {
  const [comptes, setComptes] = useState([]);
  const [filter, setFilter] = useState('EN_ATTENTE');
  const [notifCount, setNotifCount] = useState(0);

  const fetchComptes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/comptes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComptes(data.data || []);
      setNotifCount((data.data || []).filter(c => c.statut === 'EN_ATTENTE').length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleValider = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/comptes/${id}/valider`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchComptes();
  };

  const handleRejeter = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/comptes/${id}/rejeter`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchComptes();
  };

  useEffect(() => {
    fetchComptes();
    // Polling toutes les 30 secondes pour les nouvelles demandes
    const interval = setInterval(fetchComptes, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'TOUS' ? comptes : comptes.filter(c => c.statut === filter);

  const statutStyle = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    APPROUVE: 'bg-green-100 text-green-700',
    REJETE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      {/* Notification banner */}
      {notifCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-yellow-600" />
          <p className="text-yellow-700 font-semibold text-sm">
            🔔 {notifCount} nouvelle{notifCount > 1 ? 's' : ''} demande{notifCount > 1 ? 's' : ''} d'inscription en attente de validation
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        {['TOUS', 'EN_ATTENTE', 'APPROUVE', 'REJETE'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f ? 'bg-[#0033A0] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {f === 'EN_ATTENTE' ? `⏳ En attente (${notifCount})` : f}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nom', 'Email', 'Téléphone', 'Agence', 'Rôle', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id_utilisateur} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {c.prenom} {c.nom}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.telephone || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{c.agence?.nom || 'Admin'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                    {c.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statutStyle[c.statut]}`}>
                    {c.statut}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.statut === 'EN_ATTENTE' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValider(c.id_utilisateur)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        <CheckCircle size={14} /> Approuver
                      </button>
                      <button
                        onClick={() => handleRejeter(c.id_utilisateur)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600"
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucun compte trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}