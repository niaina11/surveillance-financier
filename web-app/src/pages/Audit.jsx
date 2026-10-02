import React, { useState, useEffect } from 'react';

export default function Audit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 1. On s'assure que la limite est bien fixée à 10
  const [itemsPerPage] = useState(10); 

  const fetchAuditLogs = async () => {
    try {
      // La requête partira bien avec ?page=X&limit=10
      const response = await fetch(`http://localhost:3000/api/audit/getAudits?page=${currentPage}&limit=${itemsPerPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setAuditLogs(result.data);
        setTotalPages(result.pagination?.totalPages || 1); 
      } else {
        setError(result.message);
      }
    }
    catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Erreur lors de la récupération des journaux d\'audit.');
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {error && <div className="p-4 text-sm text-red-600 bg-red-50 border-b">{error}</div>}
      
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['Action', 'Utilisateur', 'Agence', 'Module', 'Description', 'Date'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {auditLogs.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Aucun journal d'audit trouvé.</td>
            </tr>
          ) : (
            /* 2. SÉCURITÉ : .slice(0, 10) garantit que React ne rendra jamais plus de 10 lignes 
               même si le serveur fait une erreur et renvoie tout le tableau */
            auditLogs.slice(0, itemsPerPage).map((l, i) => (
              <tr key={l.id || i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{l.action}</td>
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {l.utilisateur ? `${l.utilisateur.prenom || ''} ${l.utilisateur.nom || ''}`.trim() : 'N/A'}
                </td>
                <td className="px-4 py-3 text-gray-500">{l.agence?.nom || 'N/A'}</td>
                <td className="px-4 py-3 text-red-400">{l.module}</td>
                <td className="px-4 py-3 text-green-600">{l.description}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  {l.date_action ? new Date(l.date_action).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Barre de contrôle */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
        <div>
          Page <span className="font-semibold text-gray-900">{currentPage}</span> sur{' '}
          <span className="font-semibold text-gray-900">{totalPages}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-lg bg-white font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Précédent
          </button>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-lg bg-white font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
