import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, MessageCircle } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

const titles = {
  dashboard: 'Tableau de Bord',
  agences: 'Gestion des Agences',
  operations: 'Opérations',
  alertes: 'Alertes',
  audit: 'Journal d\'Audit',
  rapports: 'Rapports',
  parametres: 'Paramètres & Seuils',
};

export default function Header({ page }) {
  const navigate = useNavigate();
  const { notifications, retirerNotification } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
  const [nombreMessagesNonLus, setNombreMessagesNonLus] = useState(0);
  const dropdownRef = useRef(null);

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    // 1. Marque comme lue côté backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/admin/${notif.id_notification}/lire`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Erreur marquage lu :', err);
    }

    // 2. Retire de la liste affichée immédiatement (optimiste)
    retirerNotification(notif.id_notification);
    setDropdownOpen(false);

    // 3. Redirige selon le contenu de la notification
    if (notif.id_operation) {
      navigate('/operations');
    } else if (notif.id_alerte) {
      navigate('/alertes');
    } else if (notif.type === "CREATION") {
      navigate('/utilisateur');
    } else {
      // Pas d'id_operation ni id_alerte → c'est une demande
      navigate('/parametres');
    }
  };
  useEffect(() => {
  const fetchNombreMessagesNonLus = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:3000/api/messagerie/conversations/cmu53dpj70000gronbtgvmjuu/messages/non-lus',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setNombreMessagesNonLus(data.data.non_lus);
        console.log('Nombre de messages non lus :', data);
      }
    } catch (err) {
      console.error(
        'Erreur récupération messages non lus :',
        err
      );
    }
  };

  fetchNombreMessagesNonLus();
}, []);

  return (
  <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
    {/* Titre de la page en Bleu Paositra */}
    <h2 className="font-display text-xl font-black text-[#0033A0]">
      {titles[page]}
    </h2>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2" ref={dropdownRef}>
        
        {/* Bouton Notification */}
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="relative p-2 text-gray-500 hover:text-[#0033A0] transition-colors rounded-lg hover:bg-gray-50"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Bouton Messagerie */}
        <button
          onClick={() => {
            navigate('/messagerie');
            setNombreMessagesNonLus(0);
          }}
          className="relative p-2 text-gray-500 hover:text-[#0033A0] transition-colors rounded-lg hover:bg-gray-50"
        >
          <MessageCircle size={20} />
          {nombreMessagesNonLus > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {nombreMessagesNonLus}
            </span>
          )}
        </button>

        {/* Dropdown des Notifications */}
        {dropdownOpen && (
          <div className="absolute right-24 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto top-14">
            <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm text-[#0033A0] bg-gray-50/50">
              Notifications {notifications.length > 0 && `(${notifications.length})`}
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Aucune notification</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id_notification}
                  onClick={() => handleNotificationClick(notif)}
                  className="w-full text-left px-4 py-3 hover:bg-[#FFD100]/10 border-b border-gray-50 last:border-b-0 transition-colors"
                >
                  <p className="text-sm font-bold text-gray-800 hover:text-[#0033A0]">{notif.titre}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {new Date(notif.createdAt).toLocaleString('fr-FR')}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Profil Utilisateur / Administrateur aux couleurs de la Paositra */}
      <div className="flex items-center gap-3 text-sm pl-4 border-l border-gray-200">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center font-black shadow-sm text-sm"
          style={{ backgroundColor: '#0033A0', color: '#FFD100' }}
        >
          A
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 leading-tight">Administrateur</span>
          <span className="text-[11px] text-gray-400">Paositra Malagasy</span>
        </div>
      </div>
    </div>
  </header>
);
}