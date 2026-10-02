import React, { useState, useEffect } from 'react';
import { Download, FileText, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = 'http://localhost:3000/api';

export default function Rapports() {
  const [modalOpen, setModalOpen] = useState(false);
  const [periode, setPeriode] = useState('mois');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agenceId, setAgenceId] = useState('toutes');
  const [agences, setAgences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rapportsGeneres, setRapportsGeneres] = useState([]);

  // Charger les agences
  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/admin/getAgences`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAgences(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAgences();
  }, []);

  const genererPDF = (rapport, agenceNom) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // En-tête
    doc.setFillColor(26, 58, 92);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(18, 16, 8, 'F');
    doc.setTextColor(26, 58, 92);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('SF', 18, 19, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Surveillance Financière', 32, 14);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const periodeLabel = periode === 'jour' ? 'Journalier' : periode === 'semaine' ? 'Hebdomadaire' : 'Mensuel';
    doc.text(
      `Rapport ${periodeLabel} — ${new Date(rapport.date_debut).toLocaleDateString('fr-FR')} au ${new Date(rapport.date_fin).toLocaleDateString('fr-FR')}`,
      32, 22
    );
    doc.text(`Agence : ${agenceNom}`, 32, 29);

    let y = 44;

    // Résumé soldes entrant / sortant
    doc.setTextColor(26, 58, 92);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Résumé des soldes', 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['💰 Total Encaissements (Entrant)', `${(rapport.resume.total_recettes || 0).toLocaleString('fr-FR')} Ar`],
        ['💸 Total Décaissements (Sortant)', `${(rapport.resume.total_depenses || 0).toLocaleString('fr-FR')} Ar`],
        ['📊 Solde Net', `${(rapport.resume.solde_net || 0).toLocaleString('fr-FR')} Ar`],
        ["🔢 Nombre d'opérations", rapport.resume.nombre_operations || 0],
      ],
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 92] },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { halign: 'right' }
      },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;

    // Évolution par période
    if (rapport.evolution?.length) {
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 58, 92);
      doc.text('Évolution des soldes', 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Période', 'Encaissements', 'Décaissements', 'Solde Net']],
        body: rapport.evolution.map(e => [
          e.periode,
          `${(e.encaissements || 0).toLocaleString('fr-FR')} Ar`,
          `${(e.decaissements || 0).toLocaleString('fr-FR')} Ar`,
          `${(e.solde_net || 0).toLocaleString('fr-FR')} Ar`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [26, 58, 92] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 12;
    }

    // Détail par agence si "toutes"
    if (rapport.detail_agences?.length) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 58, 92);
      doc.text('Détail par agence', 14, 18);

      autoTable(doc, {
        startY: 24,
        head: [['Agence', 'Encaissements', 'Décaissements', 'Solde Net', 'Nb Opérations']],
        body: rapport.detail_agences.map(a => [
          a.agence,
          `${(a.recettes || 0).toLocaleString('fr-FR')} Ar`,
          `${(a.depenses || 0).toLocaleString('fr-FR')} Ar`,
          `${(a.solde || 0).toLocaleString('fr-FR')} Ar`,
          a.nombre_operations || 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [26, 58, 92] },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
    }

    // Demandes
    if (rapport.demandes?.length) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 58, 92);
      doc.text('Demandes', 14, 18);

      autoTable(doc, {
        startY: 24,
        head: [['Statut', 'Nombre']],
        body: rapport.demandes.map(d => [d.statut, d.nombre]),
        theme: 'grid',
        headStyles: { fillColor: [26, 58, 92] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
    }

    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Généré le ${new Date().toLocaleString('fr-FR')} — Page ${i}/${pageCount}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    const agenceSlug = agenceNom.toLowerCase().replace(/\s/g, '_');
    doc.save(`rapport_${periode}_${agenceSlug}_${date}.pdf`);
  };

  const handleGenerer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        periode,
        date,
        ...(agenceId !== 'toutes' && { id_agence: agenceId })
      });

      const response = await fetch(`${API}/admin/rapports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erreur lors de la génération');

      const agenceNom = agenceId === 'toutes'
        ? 'Toutes les agences'
        : agences.find(a => String(a.id_agence) === String(agenceId))?.nom || 'Agence';

      genererPDF(result.data, agenceNom);

      const periodeLabel = periode === 'jour' ? 'Journalier' : periode === 'semaine' ? 'Hebdomadaire' : 'Mensuel';
      setRapportsGeneres(prev => [
        {
          titre: `Rapport ${periodeLabel} — ${agenceNom}`,
          periode: periodeLabel,
          agence: agenceNom,
          date: new Date().toLocaleDateString('fr-FR'),
          dateRef: date,
        },
        ...prev
      ]);
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton générer */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Rapports</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
          style={{ backgroundColor: '#1a3a5c' }}
        >
          <Download size={16} /> Générer un rapport
        </button>
      </div>

      {/* Liste rapports générés */}
      {rapportsGeneres.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun rapport généré pour l'instant</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {rapportsGeneres.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">{r.titre}</p>
                  <p className="text-xs text-gray-400">
                    {r.dateRef} — Généré le {r.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  r.periode === 'Journalier' ? 'bg-blue-100 text-blue-600' :
                  r.periode === 'Hebdomadaire' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {r.periode}
                </span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600">PDF</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-gray-800">Générer un rapport</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Période */}
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              Type de période
            </label>
            <div className="flex gap-2 mb-4">
              {[
                { id: 'jour', label: 'Journalier' },
                { id: 'semaine', label: 'Hebdomadaire' },
                { id: 'mois', label: 'Mensuel' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriode(p.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    periode === p.id
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                  style={periode === p.id ? { backgroundColor: '#1a3a5c' } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Agence */}
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              Agence
            </label>
            <select
              value={agenceId}
              onChange={e => setAgenceId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="toutes">Toutes les agences</option>
              {agences.map(a => (
                <option key={a.id_agence} value={a.id_agence}>{a.nom}</option>
              ))}
            </select>

            {/* Date */}
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              {periode === 'jour' ? 'Choisir le jour' :
               periode === 'semaine' ? 'Choisir un jour de la semaine' :
               'Choisir un jour du mois'}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 font-medium">
                {periode === 'jour' && '📅 Rapport des encaissements et décaissements du jour sélectionné'}
                {periode === 'semaine' && '📅 Rapport de la semaine contenant le jour sélectionné (Lun → Dim)'}
                {periode === 'mois' && '📅 Rapport du mois complet du jour sélectionné'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerer}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
                style={{ backgroundColor: '#1a3a5c' }}
              >
                {isLoading ? '⏳ Génération...' : '📥 Générer PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}