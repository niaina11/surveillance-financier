import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const API = 'http://localhost:3000/api';

export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [filter, setFilter] = useState('TOUS');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDemandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/demandes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDemandes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTraiter = async (id, statut) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/demandes/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchDemandes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const filtered = filter === 'TOUS'
    ? demandes
    : demandes.filter(d => d.statut === filter);

  const statutStyle = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    VALIDEE: 'bg-green-100 text-green-700',
    REFUSEE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-2">
        {['TOUS', 'EN_ATTENTE', 'VALIDEE', 'REFUSEE'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f ? 'text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
            style={filter === f ? { backgroundColor: '#1a3a5c' } : {}}
          >
            {f === 'EN_ATTENTE'
              ? `⏳ En attente (${demandes.filter(d => d.statut === 'EN_ATTENTE').length})`
              : f}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Agent', 'Agence', 'Type', 'Motif', 'Nouveau Montant', 'Date', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Aucune demande trouvée
                </td>
              </tr>
            )}
            {filtered.map(d => (
              <tr key={d.id_demande} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {d.agent?.prenom} {d.agent?.nom}
                </td>
                <td className="px-4 py-3 text-gray-500">{d.agence?.nom}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                    {d.type || 'AUTRE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                  {d.motif || d.description}
                </td>
                <td className="px-4 py-3 font-bold text-orange-600">
                  {d.montant_demande?.toLocaleString()} Ar
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(d.date_demande).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statutStyle[d.statut]}`}>
                    {d.statut}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {d.statut === 'EN_ATTENTE' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTraiter(d.id_demande, 'VALIDEE')}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={13} /> Valider
                      </button>
                      <button
                        onClick={() => handleTraiter(d.id_demande, 'REFUSEE')}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                      >
                        <XCircle size={13} /> Refuser
                      </button>
                    </div>
                  )}
                  {d.statut !== 'EN_ATTENTE' && (
                    <span className="text-xs text-gray-400 italic">Traitée</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}