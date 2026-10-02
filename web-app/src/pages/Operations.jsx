import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export default function Operations() {
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState([]);

  const fetchAllOpertion = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/agence/all_operations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setOperation(result.data);
    } catch (err) {
      console.error('Error fetching operations:', err);
    }
  };

  useEffect(() => {
    fetchAllOpertion();
  }, []);

  // Trie par date croissante, puis attribue un numéro stable à chaque opération.
  // On garde ça dans une Map (id_operation -> référence) pour que le numéro
  // ne bouge pas quand on filtre/recherche ensuite.
  const referencesParId = useMemo(() => {
    const trie = [...operation].sort(
      (a, b) => new Date(a.date_operation) - new Date(b.date_operation)
    );
    const map = new Map();
    trie.forEach((o, index) => {
      const numero = String(index + 1).padStart(2, '0'); // OP-01, OP-02, ... OP-100+
      map.set(o.id_operation, `OP-${numero}`);
    });
    return map;
  }, [operation]);

  const filtered = operation.filter(o =>
    referencesParId.get(o.id_operation)?.toLowerCase().includes(search.toLowerCase()) ||
    o.agence?.nom?.toLowerCase().includes(search.toLowerCase())
  );

 return (
  <div className="space-y-4">
    {/* Barre de recherche avec focus Bleu Paositra */}
    <div className="flex items-center justify-between">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une opération..."
          className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent w-72 shadow-sm font-medium transition-all"
        />
      </div>
    </div>

    {/* Structure de la Table aux normes de l'institution */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0033A0]/5 border-b border-gray-200">
          <tr>
            {['Référence', 'Type', 'Montant', 'Agence', 'Agent', 'Client', 'Date'].map(h => (
              <th 
                key={h} 
                className="px-4 py-3.5 text-left text-xs font-black text-[#0033A0] uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map(o => (
            <tr key={o.id_operation} className="hover:bg-gray-50/80 transition-colors">
              {/* Référence */}
              <td className="px-4 py-3.5 font-mono text-xs text-gray-600 font-semibold">
                {referencesParId.get(o.id_operation)}
              </td>
              {/* Type d'opération (Vert / Rouge financier propre) */}
              <td className={`px-4 py-3.5 text-xs font-black tracking-wide`}>
                <span className={`px-2 py-1 rounded-md text-xs ${
                  o.type_operation === 'ENCAISSEMENT' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {o.type_operation}
                </span>
              </td>
              {/* Montant */}
              <td className="px-4 py-3.5 font-extrabold text-gray-800">
                {o.montant.toLocaleString()} Ar
              </td>
              {/* Agence (Mise en valeur subtile en bleu pour le réseau postal) */}
              <td className="px-4 py-3.5 font-semibold text-[#0033A0]/90">
                {o.agence?.nom || 'N/A'}
              </td>
              {/* Agent */}
              <td className="px-4 py-3.5 text-gray-600 font-medium">
                {o.agent?.nom || 'N/A'}
              </td>
              {/* Client */}
              <td className="px-4 py-3.5 text-gray-600 font-medium">
                {o.nom_client || 'N/A'}
              </td>
              {/* Date */}
              <td className="px-4 py-3.5 text-gray-400 font-medium text-xs">
                {new Date(o.date_operation).toLocaleString("fr-FR", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

}