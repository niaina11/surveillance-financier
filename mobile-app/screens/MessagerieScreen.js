import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StyleSheet, Modal, FlatList,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import * as DocumentPicker from 'expo-document-picker';
import { wp, hp, rf } from '../utils/responsive';
import { url } from '../utils/api';
import * as FileSystem from 'expo-file-system/legacy';
const API = 'http://192.168.50.243:3000/api';
const SOCKET_URL = 'http://192.168.1.77:3000';

export default function MessagerieScreen() {
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
  const [moi, setMoi] = useState(null);
  const [token, setToken] = useState(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id_utilisateur');
      setToken(t);
      setMoi(id);

      const s = io(SOCKET_URL, { auth: { token: t } });
      setSocket(s);

      s.on('new_message', (msg) => {
        setMessages(prev => {
          if (prev.find(m => m.id_message === msg.id_message)) return prev;
          return [...prev, msg];
        });
        fetchConversations(t);
      });

      s.on('notif_message', () => fetchConversations(t));

      s.on('user_typing', (data) => {
        setTyping(`${data.prenom} est en train d'écrire...`);
      });

      s.on('user_stop_typing', () => setTyping(null));

      fetchConversations(t);
      fetchUtilisateurs(t);
    };
    init();
    return () => socket?.disconnect();
  }, []);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // ─── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = async (t) => {
    try {
      const tk = t || token;
      const res = await fetch(`${url}/api/messagerie/conversations`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const data = await res.json();
      setConversations(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUtilisateurs = async (t) => {
    try {
      const tk = t || token;
      const res = await fetch(`${url}/api/messagerie/utilisateurs`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const data = await res.json();
      setUtilisateurs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Ouvrir conversation ────────────────────────────────────────────────────
  const ouvrirConv = async (conv) => {
    setConvActive(conv);
    socket?.emit('join_conversations', [conv.id_conversation]);
    try {
      const res = await fetch(
        `${url}/api/messagerie/conversations/${conv.id_conversation}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };


  const handleEnvoyer = async () => {
    if (!contenu.trim() && !fichier) return;

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        if (contenu.trim()) {
          formData.append('contenu', contenu.trim());
        }

        if (fichier) {
          formData.append('fichier', {
            uri: fichier.uri, // ✅ documentDirectory — accessible
            name: fichier.name,
            type: fichier.mimeType || 'application/octet-stream',
          });
        }

        xhr.open(
          'POST',
          `${url}/api/messagerie/conversations/${convActive.id_conversation}/messages`
        );
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Erreur serveur : ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.send(formData);
      });

      setContenu('');
      setFichier(null);
      socket?.emit('stop_typing', { id_conversation: convActive.id_conversation });

    } catch (err) {
      console.error('Erreur envoi:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  const handleFichier = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true, // ✅ déjà activé
        multiple: false
      });

      if (!result.canceled && result.assets?.[0]) {
        const f = result.assets[0];

        // ✅ Copier vers un endroit accessible
        const destination = `${FileSystem.documentDirectory}${f.name}`;
        await FileSystem.copyAsync({
          from: f.uri,
          to: destination
        });

        setFichier({
          uri: destination, // ✅ URI accessible
          name: f.name,
          mimeType: f.mimeType || 'application/octet-stream',
          size: f.size
        });
      }
    } catch (err) {
      console.error('Erreur sélection fichier:', err);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  // ─── Nouvelle conversation ──────────────────────────────────────────────────
  const handleNouvelleConv = async (id_destinataire) => {
    try {
      const res = await fetch(`${url}/api/messagerie/conversations/privee`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_destinataire })
      });
      const data = await res.json();
      await fetchConversations(token);
      ouvrirConv(data.data);
      setModalNouv(false);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  };

  // ─── Créer groupe ───────────────────────────────────────────────────────────
  const handleCreerGroupe = async () => {
    if (!nomGroupe || selectedUsers.length === 0) return;
    try {
      const res = await fetch(`${url}/api/messagerie/conversations/groupe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomGroupe, participants: selectedUsers })
      });
      const data = await res.json();
      await fetchConversations(token);
      ouvrirConv(data.data);
      setModalGroupe(false);
      setNomGroupe('');
      setSelectedUsers([]);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getNomConv = (conv) => {
    if (conv.type === 'GROUPE') return conv.nom;
    const autre = conv.participants.find(p => p.utilisateur.id_utilisateur !== moi);
    return autre ? `${autre.utilisateur.prenom} ${autre.utilisateur.nom}` : 'Conv';
  };

  const getInitiales = (nom) =>
    nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const formatHeure = (date) =>
    new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // ─── Vue liste conversations ────────────────────────────────────────────────
  if (!convActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💬 Messages</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setModalNouv(true)} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>＋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalGroupe(true)} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>👥</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView>
          {conversations.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>Aucune conversation</Text>
              <Text style={styles.emptySub}>Appuyez sur + pour commencer</Text>
            </View>
          )}
          {conversations.map(conv => {
            const nom = getNomConv(conv);
            const dernierMsg = conv.messages?.[0];
            return (
              <TouchableOpacity
                key={conv.id_conversation}
                onPress={() => ouvrirConv(conv)}
                style={styles.convItem}
              >
                <View style={[styles.avatar, { backgroundColor: conv.type === 'GROUPE' ? '#8e44ad' : '#1a3a5c' }]}>
                  <Text style={styles.avatarText}>{getInitiales(nom)}</Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convRow}>
                    <Text style={[styles.convNom, conv.non_lus > 0 && styles.convNomBold]}>
                      {nom}
                    </Text>
                    {conv.non_lus > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{conv.non_lus}</Text>
                      </View>
                    )}
                  </View>
                  {dernierMsg && (
                    <Text style={styles.convDernier} numberOfLines={1}>
                      {dernierMsg.contenu || '📎 Fichier'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Modal nouvelle conversation */}
        <Modal visible={modalNouv} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle conversation</Text>
                <TouchableOpacity onPress={() => setModalNouv(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: hp(50) }}>
                {utilisateurs.map(u => (
                  <TouchableOpacity
                    key={u.id_utilisateur}
                    onPress={() => handleNouvelleConv(u.id_utilisateur)}
                    style={styles.userItem}
                  >
                    <View style={[styles.avatar, styles.avatarSm]}>
                      <Text style={styles.avatarText}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{u.prenom} {u.nom}</Text>
                      <Text style={styles.userRole}>{u.role} — {u.agence?.nom || 'Admin'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal groupe */}
        <Modal visible={modalGroupe} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Créer un groupe</Text>
                <TouchableOpacity onPress={() => setModalGroupe(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={nomGroupe}
                onChangeText={setNomGroupe}
                placeholder="Nom du groupe..."
                style={styles.groupeInput}
              />
              <Text style={styles.fieldLabel}>Participants</Text>
              <ScrollView style={{ maxHeight: hp(35) }}>
                {utilisateurs.map(u => (
                  <TouchableOpacity
                    key={u.id_utilisateur}
                    onPress={() => {
                      if (selectedUsers.includes(u.id_utilisateur)) {
                        setSelectedUsers(selectedUsers.filter(id => id !== u.id_utilisateur));
                      } else {
                        setSelectedUsers([...selectedUsers, u.id_utilisateur]);
                      }
                    }}
                    style={[styles.userItem, selectedUsers.includes(u.id_utilisateur) && styles.userItemSelected]}
                  >
                    <View style={[styles.avatar, styles.avatarSm, selectedUsers.includes(u.id_utilisateur) && { backgroundColor: '#27ae60' }]}>
                      <Text style={styles.avatarText}>{u.prenom?.[0]}{u.nom?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.prenom} {u.nom}</Text>
                      <Text style={styles.userRole}>{u.agence?.nom || 'Admin'}</Text>
                    </View>
                    {selectedUsers.includes(u.id_utilisateur) && (
                      <Text style={{ color: '#27ae60', fontWeight: '700' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={handleCreerGroupe}
                disabled={!nomGroupe || selectedUsers.length === 0}
                style={[styles.saveBtn, (!nomGroupe || selectedUsers.length === 0) && { opacity: 0.4 }]}
              >
                <Text style={styles.saveBtnText}>
                  Créer ({selectedUsers.length} participants)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─── Vue messages ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.convHeader}>
        <TouchableOpacity onPress={() => setConvActive(null)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={[styles.avatar, styles.avatarSm, { backgroundColor: convActive.type === 'GROUPE' ? '#8e44ad' : '#1a3a5c' }]}>
          <Text style={styles.avatarText}>{getInitiales(getNomConv(convActive))}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.convHeaderNom}>{getNomConv(convActive)}</Text>
          <Text style={styles.convHeaderSub}>
            {convActive.type === 'GROUPE'
              ? `${convActive.participants.length} participants`
              : convActive.participants.find(p => p.utilisateur.id_utilisateur !== moi)?.utilisateur.role}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesScroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => {
            const estMoi = msg.id_expediteur === moi;
            return (
              <View
                key={msg.id_message}
                style={[styles.msgWrapper, estMoi ? styles.msgRight : styles.msgLeft]}
              >
                {!estMoi && convActive.type === 'GROUPE' && (
                  <Text style={styles.msgSender}>
                    {msg.expediteur.prenom} {msg.expediteur.nom}
                  </Text>
                )}
                <View style={[styles.msgBubble, estMoi ? styles.msgBubbleMoi : styles.msgBubbleAutre]}>
                  {msg.contenu && (
                    <Text style={[styles.msgTexte, estMoi && { color: 'white' }]}>
                      {msg.contenu}
                    </Text>
                  )}
                  {msg.fichier_nom && (
                    <Text style={[styles.msgFichier, estMoi && { color: '#93c5fd' }]}>
                      📎 {msg.fichier_nom}
                    </Text>
                  )}
                </View>
                <Text style={[styles.msgHeure, estMoi && { textAlign: 'right' }]}>
                  {formatHeure(msg.created_at)} {estMoi && (msg.lu ? '✓✓' : '✓')}
                </Text>
              </View>
            );
          })}

          {typing && (
            <Text style={styles.typingText}>✍️ {typing}</Text>
          )}
        </ScrollView>

        {/* Fichier sélectionné */}
        {fichier && (
          <View style={styles.fichierBox}>
            <Text style={styles.fichierNom}>📎 {fichier.name}</Text>
            <TouchableOpacity onPress={() => setFichier(null)}>
              <Text style={{ color: '#2980b9', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handleFichier} style={styles.inputAction}>
            <Text style={{ fontSize: rf(20) }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            value={contenu}
            onChangeText={v => {
              setContenu(v);
              socket?.emit('typing', { id_conversation: convActive.id_conversation });
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                socket?.emit('stop_typing', { id_conversation: convActive.id_conversation });
              }, 2000);
            }}
            placeholder="Écrire un message..."
            style={styles.inputText}
            multiline
          />
          <TouchableOpacity
            onPress={handleEnvoyer}
            disabled={!contenu.trim() && !fichier}
            style={[styles.sendBtn, (!contenu.trim() && !fichier) && { opacity: 0.4 }]}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(4), backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: rf(18), fontWeight: '800', color: '#1a3a5c' },
  headerActions: { flexDirection: 'row', gap: wp(2) },
  headerBtn: { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: rf(18), color: '#1a3a5c' },
  emptyBox: { alignItems: 'center', marginTop: hp(10) },
  emptyEmoji: { fontSize: rf(48), marginBottom: hp(1.5) },
  emptyText: { fontSize: rf(16), fontWeight: '700', color: '#1a3a5c' },
  emptySub: { fontSize: rf(13), color: '#94a3b8', marginTop: hp(0.5) },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: wp(3), padding: wp(4), backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  convInfo: { flex: 1 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convNom: { fontSize: rf(14), fontWeight: '600', color: '#1e293b' },
  convNomBold: { fontWeight: '800' },
  convDernier: { fontSize: rf(12), color: '#94a3b8', marginTop: hp(0.3) },
  avatar: { width: wp(12), height: wp(12), borderRadius: wp(6), alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a3a5c' },
  avatarSm: { width: wp(10), height: wp(10), borderRadius: wp(5) },
  avatarText: { color: 'white', fontWeight: '700', fontSize: rf(14) },
  badge: { backgroundColor: '#e74c3c', borderRadius: wp(3), paddingHorizontal: wp(1.5), paddingVertical: hp(0.2) },
  badgeText: { color: 'white', fontSize: rf(11), fontWeight: '700' },
  convHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(3), padding: wp(4), backgroundColor: '#1a3a5c' },
  backBtn: { padding: wp(1) },
  backBtnText: { color: 'white', fontSize: rf(22) },
  convHeaderNom: { color: 'white', fontWeight: '800', fontSize: rf(15) },
  convHeaderSub: { color: '#93c5fd', fontSize: rf(12) },
  messagesScroll: { padding: wp(4), paddingBottom: hp(2) },
  msgWrapper: { marginBottom: hp(1.5) },
  msgRight: { alignItems: 'flex-end' },
  msgLeft: { alignItems: 'flex-start' },
  msgSender: { fontSize: rf(11), color: '#94a3b8', marginBottom: hp(0.4), marginLeft: wp(1) },
  msgBubble: { maxWidth: '80%', paddingHorizontal: wp(4), paddingVertical: hp(1.2), borderRadius: wp(4) },
  msgBubbleMoi: { backgroundColor: '#1a3a5c', borderBottomRightRadius: wp(1) },
  msgBubbleAutre: { backgroundColor: 'white', borderBottomLeftRadius: wp(1), borderWidth: 1, borderColor: '#e2e8f0' },
  msgTexte: { fontSize: rf(14), color: '#1e293b' },
  msgFichier: { fontSize: rf(12), color: '#64748b', marginTop: hp(0.5) },
  msgHeure: { fontSize: rf(10), color: '#94a3b8', marginTop: hp(0.4), marginHorizontal: wp(1) },
  typingText: { fontSize: rf(12), color: '#94a3b8', fontStyle: 'italic', marginBottom: hp(1) },
  fichierBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dbeafe', padding: wp(3), borderTopWidth: 1, borderTopColor: '#bfdbfe' },
  fichierNom: { fontSize: rf(12), color: '#1d4ed8', fontWeight: '600', flex: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: wp(2), padding: wp(3), backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  inputAction: { padding: wp(2) },
  inputText: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: wp(5), paddingHorizontal: wp(4), paddingVertical: hp(1.2), fontSize: rf(14), maxHeight: hp(12), backgroundColor: '#f8fafc' },
  sendBtn: { width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: '#1a3a5c', alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: 'white', fontSize: rf(16) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: wp(6), borderTopRightRadius: wp(6), padding: wp(6), maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(2) },
  modalTitle: { fontSize: rf(18), fontWeight: '800', color: '#1a3a5c' },
  closeBtn: { fontSize: rf(22), color: '#94a3b8' },
  userItem: { flexDirection: 'row', alignItems: 'center', gap: wp(3), padding: wp(3), borderRadius: wp(3), marginBottom: hp(0.5) },
  userItemSelected: { backgroundColor: '#f0fdf4' },
  userName: { fontSize: rf(14), fontWeight: '600', color: '#1e293b' },
  userRole: { fontSize: rf(12), color: '#94a3b8' },
  groupeInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: wp(3), paddingHorizontal: wp(4), paddingVertical: hp(1.5), fontSize: rf(14), marginBottom: hp(2) },
  fieldLabel: { fontSize: rf(13), fontWeight: '600', color: '#374151', marginBottom: hp(1) },
  saveBtn: { backgroundColor: '#1a3a5c', borderRadius: wp(3.5), paddingVertical: hp(1.8), alignItems: 'center', marginTop: hp(2) },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: rf(15) },
});