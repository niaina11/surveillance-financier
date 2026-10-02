import React from 'react';
import { Building2, Users, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';


const agencesData = [
  { name: 'Ag1', solde: 12 }, { name: 'Ag2', solde: 8 }, { name: 'Ag3', solde: 15 },
  { name: 'Ag4', solde: -3 }, { name: 'Ag5', solde: 10 }, { name: 'Ag6', solde: 7 },
];

// const recentAlerts = [
//   { type: 'Dépassement de plafond', description: 'Dépense de 8 500 000 Ar — Agence 7', level: 'CRITIQUE', date: '10:45' },
//   { type: 'Modification d\'opération', description: 'OP-2024-015 modifiée — Agence 3', level: 'ÉLEVÉ', date: '10:30' },
//   { type: 'Solde faible', description: 'Agence 12 — solde < seuil minimum', level: 'MOYEN', date: '09:50' },
// ];

export default function Dashboard() {
  const [nbAgences, setNbAgences] = React.useState(0);
  const [nbAgents, setNbAgents] = React.useState(0);
  const [recette, setRecette] = React.useState(0);
  const [depense, setDepense] = React.useState(0);
  const [lineData, setLineData] = React.useState([]);
  const [soldeParAgence, setSoldeParAgence] = React.useState([]);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const [agencesRes, agentsRes, recetteRes, depenseRes, evolutionRes, soldeRes] = await Promise.all([
          fetch('http://localhost:3000/api/admin/nombreAgences', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/admin/nombreAgents', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/admin/recette', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/admin/depense', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/admin/evolution-mensuelle', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/admin/soldeParAgence', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        const agencesData = await agencesRes.json();
        const agentsData = await agentsRes.json();
        const recetteData = await recetteRes.json();
        const depenseData = await depenseRes.json();
        const evolutionData = await evolutionRes.json();
        const soldeData = await soldeRes.json();
        setNbAgences(agencesData.data?.nombreAgences || 0);
        setNbAgents(agentsData.data?.nombreAgents || 0);
        setRecette(recetteData.data?.recette || 0);
        setDepense(depenseData.data?.depense || 0);
        setLineData(evolutionData.data || []);
        setSoldeParAgence(soldeData.data || []);
        console.log("Solde par agence :", soldeData.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques :', err);
      }
    };
    fetchStats();
  }, []);


  return (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Agences" value={nbAgences} sub="Toutes actives" color="blue" icon={Building2} />
      <StatCard title="Utilisateurs" value={nbAgents} sub="Agents connectés" color="yellow" icon={Users} />
      <StatCard title="Total Recettes" value={`${recette.toLocaleString()} Ar`} sub="Ce mois" color="green" icon={TrendingUp} />
      <StatCard title="Total Dépenses" value={`${depense.toLocaleString()} Ar`} sub="Ce mois" color="red" icon={TrendingDown} />
    </div>

    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#0033A0]" />
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Solde Global Consolidé</p>
      <p className="font-display text-3xl font-black text-[#0033A0]">
        {(recette - depense).toLocaleString()} Ar
      </p>
    </div>

    {/* Graphe évolution Recettes / Dépenses */}
    <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-black text-[#0033A0] text-sm uppercase tracking-wider mb-4">
        Évolution Recettes / Dépenses
      </h3>
      {lineData.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center font-medium">Aucune donnée disponible</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
            {/* Vert financier moderne et Rouge financier moderne */}
            <Line type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>

    {/* Solde par agence - Intégration de la couleur Bleu Paositra */}
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-black text-[#0033A0] text-sm uppercase tracking-wider mb-4">
        Solde par Agence (en M Ar)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={soldeParAgence}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="agence.nom" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6' }} />
          {/* Les barres d'agences s'affichent fièrement avec le Bleu Officiel de la Poste */}
          <Bar dataKey="montant_actuel" fill="#0033A0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
}
