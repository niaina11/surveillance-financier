import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Paperclip, Users, Plus, X, Download, MessageSquare } from 'lucide-react';

const API = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

export default function Messagerie() {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [convActive, setConvActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState('');
  const [fichier, setFichier] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [modalNouv, setModalNouv] = useState(false);
  const [modalGroupe, setModalGroupe] = useState(false);
  const [nomGroupe, setNomGroupe] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [typing, setTyping] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const token = localStorage.getItem('token');
  const moi = localStorage.getItem('id_utilisateur');

  // ─── Init Socket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // ─── Events Socket ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (msg) => {
      if (convActive && msg.id_conversation === convActive.id_conversation) {
        setMessages(prev => [...prev, msg]);
      }
      fetchConversations();
    });

    socket.on('notif_message', () => {
      fetchConversations();
    });

    socket.on('user_typing', (data) => {
      setTyping(`${data.prenom} ${data.nom} est en train d'écrire...`);
    });

    socket.on('user_stop_typing', () => setTyping(null));

    return () => {
      socket.off('new_message');
      socket.off('notif_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, convActive]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/messagerie/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setConversations(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Fetch utilisateurs ─────────────────────────────────────────────────────
  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch(`${API}/messagerie/utilisateurs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUtilisateurs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUtilisateurs();
  }, []);

  // ─── Ouvrir conversation ────────────────────────────────────────────────────
  const fetchMessages = async (conv) => {
    setConvActive(conv);
    socket?.emit('join_conversations', [conv.id_conversation]);
    try {
      const res = await fetch(
        `${API}/messagerie/conversations/${conv.id_conversation}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Envoyer message ────────────────────────────────────────────────────────
  const handleEnvoyer = async () => {
    if (!contenu.trim() && !fichier) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (contenu.trim()) formData.append('contenu', contenu);
      if (fichier) formData.append('fichier', fichier);

      await fetch(
        `${API}/messagerie/conversations/${convActive.id_conversation}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      setContenu('');
      setFichier(null);
      socket?.emit('stop_typing', { id_conversation: convActive.id_conversation });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Nouvelle conversation ──────────────────────────────────────────────────
  const handleNouvelleConv = async (id_destinataire) => {
    try {
      const res = await fetch(`${API}/messagerie/conversations/privee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // ✅ Envoyer id_destinataire, pas moi
        body: JSON.stringify({ id_destinataire })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Erreur:', data.message);
        return;
      }

      await fetchConversations();
      fetchMessages(data.data);
      setModalNouv(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Créer groupe ───────────────────────────────────────────────────────────
  const handleCreerGroupe = async () => {
    if (!nomGroupe || selectedUsers.length === 0) return;
    try {
      const res = await fetch(`${API}/messagerie/conversations/groupe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomGroupe, participants: selectedUsers })
      });
      const data = await res.json();
      await fetchConversations();
      fetchMessages(data.data);
      setModalGroupe(false);
      setNomGroupe('');
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getNomConv = (conv) => {
    if (conv.type === 'GROUPE') return conv.nom;
    const autre = conv.participants.find(p => p.utilisateur.id_utilisateur !== moi);
    return autre ? `${autre.utilisateur.prenom} ${autre.utilisateur.nom}` : 'Conversation';
  };

  const getInitiales = (nom) =>
    nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const formatHeure = (date) =>
    new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date) => {
    const d = new Date(date);
    const auj = new Date();
    if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div
      className="flex bg-gray-100 rounded-xl overflow-hidden border shadow-sm"
      style={{ height: 'calc(100vh - 130px)' }}
    >
      {/* ── Liste conversations ─────────────────────────────────────────────── */}
      <div className="w-80 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-base">💬 Messages</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setModalNouv(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title="Nouveau message"
              >
                <Plus size={17} className="text-gray-600" />
              </button>
              <button
                onClick={() => setModalGroupe(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title="Créer un groupe"
              >
                <Users size={17} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              Aucune conversation.<br />Cliquez sur + pour commencer.
            </div>
          ) : (
            conversations.map(conv => {
              const dernierMsg = conv.messages?.[0];
              const nom = getNomConv(conv);
              const isActive = convActive?.id_conversation === conv.id_conversation;
              return (
                <button
                  key={conv.id_conversation}
                  onClick={() => fetchMessages(conv)}
                  className={`w-full flex items-center gap-3 p-3 border-b text-left transition ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: conv.type === 'GROUPE' ? '#8e44ad' : '#1a3a5c' }}
                  >
                    {conv.type === 'GROUPE' ? <Users size={16} /> : getInitiales(nom)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.non_lus > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {nom}
                      </p>
                      {conv.non_lus > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {conv.non_lus}
                        </span>
                      )}
                    </div>
                    {dernierMsg && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {dernierMsg.contenu || '📎 Fichier'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Zone messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!convActive ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-4">💬</p>
              <p className="font-semibold text-gray-600">Sélectionnez une conversation</p>
              <p className="text-sm mt-1 text-gray-400">ou créez-en une nouvelle</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header conversation */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: convActive.type === 'GROUPE' ? '#8e44ad' : '#1a3a5c' }}
              >
                {convActive.type === 'GROUPE' ? <Users size={15} /> : getInitiales(getNomConv(convActive))}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{getNomConv(convActive)}</p>
                <p className="text-xs text-gray-400">
                  {convActive.type === 'GROUPE'
                    ? `${convActive.participants.length} participants`
                    : convActive.participants.find(p => p.utilisateur.id_utilisateur !== moi)?.utilisateur.role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, idx) => {
                const estMoi = msg.id_expediteur === moi;
                const msgPrecedent = messages[idx - 1];
                const nouvelleDate = !msgPrecedent ||
                  formatDate(msg.created_at) !== formatDate(msgPrecedent.created_at);

                return (
                  <div key={msg.id_message}>
                    {nouvelleDate && (
                      <div className="text-center my-3">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${estMoi ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!estMoi && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {msg.expediteur.prenom?.[0]}{msg.expediteur.nom?.[0]}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md flex flex-col ${estMoi ? 'items-end' : 'items-start'}`}>
                        {!estMoi && convActive.type === 'GROUPE' && (
                          <p className="text-xs text-gray-400 mb-1 ml-1">
                            {msg.expediteur.prenom} {msg.expediteur.nom}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm ${estMoi
                            ? 'text-white rounded-br-sm'
                            : 'bg-white border text-gray-800 rounded-bl-sm'}`}
                          style={estMoi ? { backgroundColor: '#1a3a5c' } : {}}
                        >
                          {msg.contenu && (
                            <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
                          )}
                          {msg.fichier_url && (
                            <a
                              href={`http://localhost:3000${msg.fichier_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 mt-1.5 text-xs font-medium underline ${estMoi ? 'text-blue-200' : 'text-blue-600'}`}
                            >
                              <Download size={13} />
                              {msg.fichier_nom || 'Fichier joint'}
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 mx-1">
                          {formatHeure(msg.created_at)}
                          {estMoi && (
                            <span className="ml-1">{msg.lu ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Indicateur typing */}
            {typing && (
              <div className="px-4 py-1.5 bg-white border-t">
                <p className="text-xs text-gray-400 italic">✍️ {typing}</p>
              </div>
            )}

            {/* Fichier sélectionné */}
            {fichier && (
              <div className="px-4 py-2 bg-blue-50 border-t flex items-center justify-between">
                <p className="text-xs text-blue-700 font-medium">📎 {fichier.name}</p>
                <button onClick={() => setFichier(null)} className="text-blue-400 hover:text-blue-600">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t p-3 flex items-end gap-2 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition flex-shrink-0"
              >
                <Paperclip size={19} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => setFichier(e.target.files[0])}
              />
              <textarea
                value={contenu}
                onChange={e => {
                  setContenu(e.target.value);
                  socket?.emit('typing', { id_conversation: convActive.id_conversation });
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    socket?.emit('stop_typing', { id_conversation: convActive.id_conversation });
                  }, 2000);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnvoyer();
                  }
                }}
                placeholder="Écrire un message... (Entrée pour envoyer)"
                rows={1}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleEnvoyer}
                disabled={isLoading || (!contenu.trim() && !fichier)}
                className="p-2.5 rounded-xl text-white disabled:opacity-40 transition flex-shrink-0"
                style={{ backgroundColor: '#1a3a5c' }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {modalNouv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Nouvelle conversation</h3>
              <button onClick={() => setModalNouv(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {utilisateurs.map(u => (
                <button
                  key={u.id_utilisateur}
                  onClick={() => handleNouvelleConv(u.id_utilisateur)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border transition text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: '#1a3a5c' }}
                  >
                    {u.prenom?.[0]}{u.nom?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-gray-400">{u.role} — {u.agence?.nom || 'Admin'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal créer groupe ──────────────────────────────────────────────── */}
      {modalGroupe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Créer un groupe</h3>
              <button onClick={() => setModalGroupe(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <input
              value={nomGroupe}
              onChange={e => setNomGroupe(e.target.value)}
              placeholder="Nom du groupe..."
              className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              Participants
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
              {utilisateurs.map(u => (
                <label
                  key={u.id_utilisateur}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id_utilisateur)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, u.id_utilisateur]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== u.id_utilisateur));
                      }
                    }}
                    className="rounded w-4 h-4"
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: '#1a3a5c' }}
                  >
                    {u.prenom?.[0]}{u.nom?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-gray-400">{u.agence?.nom || 'Admin'}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleCreerGroupe}
              disabled={!nomGroupe || selectedUsers.length === 0}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              Créer ({selectedUsers.length} participants)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}