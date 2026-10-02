import React, { useEffect, useState } from 'react';
import { Plus, Search, Eye, Edit, X, Building2 } from 'lucide-react';

const API = 'http://localhost:3000/api';
const token = () => localStorage.getItem('token');

const defaultForm = {
  nom: '', adresse: '', telephone: '',
  fonds_minimum: '', fonds_maximum: '', seuil_alerte: ''
};

export default function Agences() {
  const [search, setSearch] = useState('');
  const [listeAgences, setListeAgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  // ─── Modals ───────────────────────────────────────────────────────────────
  const [modalForm, setModalForm] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [agenceSelectionnee, setAgenceSelectionnee] = useState(null);

  // ─── Fetch agences ────────────────────────────────────────────────────────
  const fetchAgence = async () => {
    try {
      const idAdmin = localStorage.getItem('id_utilisateur');
      const res = await fetch(
        `${API}/admin/getAgences?id_utilisateur_admin=${idAdmin}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const result = await res.json();
      setListeAgences(result.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAgence(); }, []);

  // ─── Ouvrir modal ajout ───────────────────────────────────────────────────
  const ouvrirAjout = () => {
    setModeEdit(false);
    setAgenceSelectionnee(null);
    setFormData(defaultForm);
    setError(null);
    setModalForm(true);
  };

  // ─── Ouvrir modal modification ────────────────────────────────────────────
  const ouvrirModif = (agence) => {
    setModeEdit(true);
    setAgenceSelectionnee(agence);
    setFormData({
      id_agence: agence.id_agence,
      nom: agence.nom || '',
      adresse: agence.adresse || '',
      telephone: agence.telephone || '',
      fonds_minimum: agence.parametre?.fonds_minimum || '',
      fonds_maximum: agence.parametre?.fonds_maximum || '',
      seuil_alerte: agence.parametre?.seuil_alerte || '',
    });
    setError(null);
    setModalForm(true);
  };

  // ─── Ouvrir modal détail ──────────────────────────────────────────────────
  const ouvrirDetail = (agence) => {
    setAgenceSelectionnee(agence);
    setModalDetail(true);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ─── Submit ajout ou modif ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const idAdmin = localStorage.getItem('id_utilisateur');
      let res;

      if (modeEdit) {
        // ✅ Modification
        res = await fetch(
          `${API}/admin/update-agence/${agenceSelectionnee.id_agence}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token()}`
            },
            body: JSON.stringify({
              nom: formData.nom,
              adresse: formData.adresse,
              telephone: formData.telephone,
              fonds_minimum: parseFloat(formData.fonds_minimum),
              fonds_maximum: parseFloat(formData.fonds_maximum),
              seuil_alerte: parseFloat(formData.seuil_alerte),
            })
          }
        );
      } else {
        // ✅ Création
        res = await fetch(`${API}/admin/agences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token()}`
          },
          body: JSON.stringify({
            id_utilisateur_admin: idAdmin,
            nom: formData.nom,
            adresse: formData.adresse,
            telephone: formData.telephone,
            fonds_minimum: parseFloat(formData.fonds_minimum),
            fonds_maximum: parseFloat(formData.fonds_maximum),
            seuil_alerte: parseFloat(formData.seuil_alerte),
          })
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erreur');

      setModalForm(false);
      setFormData(defaultForm);
      fetchAgence();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = listeAgences.filter(a =>
    a.nom?.toLowerCase().includes(search.toLowerCase()) ||
    a.adresse?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 relative">

      {/* ── Barre d'outils ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une agence..."
            className="pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
          />
        </div>
        <button
          onClick={ouvrirAjout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: '#1a3a5c' }}
        >
          <Plus size={16} /> Nouvelle Agence
        </button>
      </div>

      {/* ── Tableau ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nom', 'Adresse', 'Solde actuel (Ar)', 'Fonds Min', 'Fonds Max', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Aucune agence trouvée
                </td>
              </tr>
            )}
            {filtered.map(a => {
              const solde = a.solde?.montant_actuel || 0;
              const seuilAlerte = a.parametre?.seuil_alerte || 0;
              const estEnAlerte = solde <= seuilAlerte;

              return (
                <tr key={a.id_agence} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-700">{a.nom}</td>
                  <td className="px-4 py-3 text-gray-500">{a.adresse || '—'}</td>
                  <td className={`px-4 py-3 font-bold ${solde < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {solde.toLocaleString()} Ar
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.parametre?.fonds_minimum?.toLocaleString() || '—'} Ar
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.parametre?.fonds_maximum?.toLocaleString() || '—'} Ar
                  </td>
                  <td className="px-4 py-3">
                    <span className='px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600'>
                      Actif
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => ouvrirDetail(a)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Voir détail"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => ouvrirModif(a)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Ajout / Modification ───────────────────────────────────────── */}
      {modalForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {modeEdit ? `Modifier — ${agenceSelectionnee?.nom}` : 'Ajouter une nouvelle agence'}
              </h2>
              <button onClick={() => setModalForm(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                1. Informations Générales
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Nom de l'agence</label>
                  <input
                    required name="nom" value={formData.nom} onChange={handleChange}
                    placeholder="Ex: Agence Centrale"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Adresse physique</label>
                  <input
                    required name="adresse" value={formData.adresse} onChange={handleChange}
                    placeholder="Ex: Lot IVG 24 Analakely"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Téléphone de contact</label>
                  <input
                    required name="telephone" value={formData.telephone} onChange={handleChange}
                    placeholder="Ex: +261 34 00 000 00"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider pt-2">
                2. Paramètres de Trésorerie (Ar)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Fonds Minimum</label>
                  <input
                    required type="number" name="fonds_minimum" value={formData.fonds_minimum} onChange={handleChange}
                    placeholder="Ex: 5000000"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Fonds Maximum</label>
                  <input
                    required type="number" name="fonds_maximum" value={formData.fonds_maximum} onChange={handleChange}
                    placeholder="Ex: 50000000"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600">Seuil de déclenchement d'alerte</label>
                  <input
                    required type="number" name="seuil_alerte" value={formData.seuil_alerte} onChange={handleChange}
                    placeholder="Ex: 10000000"
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button" onClick={() => setModalForm(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1a3a5c' }}
                >
                  {loading ? 'Enregistrement...' : modeEdit ? 'Enregistrer les modifications' : 'Valider la création'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détail ─────────────────────────────────────────────────────── */}
      {modalDetail && agenceSelectionnee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

            <div className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: '#1a3a5c' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{agenceSelectionnee.nom}</h2>
                  <p className="text-xs text-blue-200">{agenceSelectionnee.adresse}</p>
                </div>
              </div>
              <button onClick={() => setModalDetail(false)} className="text-white/70 hover:text-white p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Solde */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Solde actuel</p>
                <p className={`text-2xl font-bold ${(agenceSelectionnee.solde?.montant_actuel || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(agenceSelectionnee.solde?.montant_actuel || 0).toLocaleString()} Ar
                </p>
              </div>

              {/* Infos générales */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Informations</p>
                {[
                  { label: 'Téléphone', value: agenceSelectionnee.telephone || '—' },
                  { label: 'Adresse', value: agenceSelectionnee.adresse || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>

              {/* Paramètres financiers */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Paramètres Financiers</p>
                {[
                  { label: 'Fonds Minimum', value: `${agenceSelectionnee.parametre?.fonds_minimum?.toLocaleString() || '—'} Ar` },
                  { label: 'Fonds Maximum', value: `${agenceSelectionnee.parametre?.fonds_maximum?.toLocaleString() || '—'} Ar` },
                  { label: 'Seuil d\'alerte', value: `${agenceSelectionnee.parametre?.seuil_alerte?.toLocaleString() || '—'} Ar` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>

              {/* Statut */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-400">Statut</span>
                {(() => {
                  const solde = agenceSelectionnee.solde?.montant_actuel || 0;
                  const seuil = agenceSelectionnee.parametre?.seuil_alerte || 0;
                  const alerte = solde <= seuil;
                  return (
                    <span className='px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600'>
                      ✅ Actif
                    </span>
                  );
                })()}
              </div>

              {/* Bouton modifier depuis détail */}
              <button
                onClick={() => { setModalDetail(false); ouvrirModif(agenceSelectionnee); }}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold mt-2 transition hover:opacity-90"
                style={{ backgroundColor: '#1a3a5c' }}
              >
                ✏️ Modifier cette agence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}