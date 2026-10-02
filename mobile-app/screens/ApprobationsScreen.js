import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet, Modal, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { url } from '../utils/api';

const typeStyles = {
  SUPPRESSION: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', emoji: '🗑️' },
  MODIFICATION: { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', emoji: '✏️' },
  INSCRIPTION: { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', emoji: '👤' },
};

const statutStyles = {
  EN_ATTENTE: { bg: '#fef3c7', text: '#92400e' },
  VALIDEE: { bg: '#dcfce7', text: '#166534' },
  REFUSEE: { bg: '#fee2e2', text: '#991b1b' },
};

export default function ApprobationsScreen() {
  const [filter, setFilter] = useState('TOUS');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [idAgence, setIdAgence] = useState('');
  const [idAgent, setIdAgent] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [allDemandes, setAllDemandes] = useState([]);

  const filters = ['TOUS', 'EN_ATTENTE', 'VALIDEE', 'REJETÉE'];
  const filtered = filter === 'TOUS' ? allDemandes : allDemandes.filter(d => d.statut === filter);

  const handleNouvelleDemandeSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (!montant || !motif) {
        setError("Veuillez remplir tous les champs.");
        return;
      }
      setIdAgence(await AsyncStorage.getItem('id_agence')); // Remplacez par l'ID réel de l'agence connectée
      setIdAgent(await AsyncStorage.getItem('id_utilisateur'));
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${url}/api/agence/demandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          montant_demande: montant,
          description: motif,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la soumission de la demande');
      }
      setMontant('');
      setMotif('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDemandes = async () => {
    try{
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${url}/api/agence/demandes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      console.log("Réponse fetchDemandes :", result);
      if (!response.ok) {
        throw new Error(result.message || "Erreur lors du chargement des demandes");
      }
      setAllDemandes(result.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.subtitle}>{allDemandes.filter(d => d.statut === 'EN_ATTENTE').length} en attente</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Demande</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.map((d) => {
          const ss = statutStyles[d.statut];
          return (
            <View key={d.id_demande} style={[styles.card]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}><Ionicons name="document-text-outline" size={24} color="#1a3a5c" /></Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardType]}>{d.description}</Text>
                  <Text style={styles.cardRef}>{d.id_demande}</Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.statutText, { color: ss.text }]}>{d.statut}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardDetail}>👤 {d.agent?.prenom} {d.agent?.nom} — {d.agence?.nom}</Text>
                {d.montant_demande > 0 && (
                  <Text style={styles.cardDetail}>💰 {d.montant_demande.toLocaleString()} Ar</Text>
                )}
                <Text style={styles.cardDate}>📅 {new Date(d.date_demande).toLocaleDateString()}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal nouvelle demande */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Demande</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* <Text style={styles.fieldLabel}>Type de demande</Text>
            <View style={styles.typeGrid}>
              {['SUPPRESSION', 'MODIFICATION', 'AUTRE'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewDemande({ ...newDemande, type: t })}
                  style={[styles.typeBtn, newDemande.type === t && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, newDemande.type === t && styles.typeBtnTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View> */}

            <Text style={styles.fieldLabel}>Montant demandé</Text>
            <TextInput
              value={montant}
              onChangeText={(v) => setMontant(v)}
              placeholder="Ex: 200000 Ar"
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Motif</Text>
            <TextInput
              value={motif}
              onChangeText={(v) => setMotif(v)}
              placeholder="Expliquez la raison de votre demande..."
              multiline
              style={[styles.textInput, styles.textArea]}
            />

            <TouchableOpacity onPress={handleNouvelleDemandeSubmit} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Envoyer la demande</Text>
            </TouchableOpacity>
            {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topBar: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { fontSize: 13, color: '#64748b' },
  addBtn: { backgroundColor: '#1a3a5c', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  filterScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 48 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 20, backgroundColor: 'white', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0'},
  filterBtnActive: { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  scroll: { padding: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardEmoji: { fontSize: 24 },
  cardType: { fontSize: 14, fontWeight: '800' },
  cardRef: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statutText: { fontSize: 11, fontWeight: '700' },
  cardBody: { gap: 4 },
  cardDetail: { fontSize: 13, color: '#475569' },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a3a5c' },
  closeBtn: { fontSize: 22, color: '#94a3b8' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnActive: { backgroundColor: '#dbeafe', borderColor: '#1a3a5c' },
  typeBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  typeBtnTextActive: { color: '#1a3a5c' },
  textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#1a3a5c', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});