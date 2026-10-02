import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet, TextInput, Modal, Alert
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { wp, hp, rf } from '../utils/responsive';

const TYPES_RAPPORT = [
  { id: 'DEFAILLANCE_MATERIEL', label: 'Défaillance Matériel', emoji: '🔧', color: '#e74c3c', bg: '#fee2e2' },
  { id: 'INCIDENT_FINANCIER', label: 'Incident Financier', emoji: '💸', color: '#f39c12', bg: '#fef3c7' },
  { id: 'ABSENCE_AGENT', label: 'Absence Agent', emoji: '👤', color: '#2980b9', bg: '#dbeafe' },
  { id: 'ANOMALIE_SYSTEME', label: 'Anomalie Système', emoji: '⚠️', color: '#8e44ad', bg: '#f3e8ff' },
];

const NIVEAUX = ['FAIBLE', 'MOYEN', 'ÉLEVÉ', 'CRITIQUE'];

const niveauColor = {
  FAIBLE: '#27ae60',
  MOYEN: '#f39c12',
  ÉLEVÉ: '#e67e22',
  CRITIQUE: '#e74c3c',
};

export default function RapportScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [rapports, setRapports] = useState([]);
  const [form, setForm] = useState({
    type: 'DEFAILLANCE_MATERIEL',
    titre: '',
    description: '',
    niveau: 'MOYEN',
    lieu: '',
    responsable: '',
  });


  const handleGenererRapport = async (rapport) => {
  try {
    const typeInfo = TYPES_RAPPORT.find(t => t.id === rapport.type);
    const now = new Date().toLocaleString('fr-FR');
    const couleurNiveau = niveauColor[rapport.niveau];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 40px;
            color: #222;
            background: white;
          }
          .rapport { border: 1px solid #ddd; padding: 35px; }
          .header { text-align: center; }
          .title { font-size: 25px; font-weight: bold; color: #1a3a5c; }
          .subtitle { font-size: 14px; color: #666; margin-top: 8px; }
          .divider { border-top: 1px solid #ddd; margin: 20px 0; }
          .badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            background: ${typeInfo?.bg};
            color: ${typeInfo?.color};
            border: 1px solid ${typeInfo?.color};
            margin: 10px 0;
          }
          .niveau {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 13px;
            background: ${couleurNiveau}22;
            color: ${couleurNiveau};
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
          }
          .row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .label { width: 35%; font-weight: bold; color: #555; font-size: 13px; }
          .value { width: 65%; text-align: right; font-size: 13px; }
          .desc-box {
            background: #f8fafc;
            border-radius: 10px;
            padding: 16px;
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.6;
            color: #475569;
          }
          .footer {
            text-align: center;
            margin-top: 35px;
            font-size: 11px;
            color: #888;
          }
          .ref { font-size: 12px; color: #64748b; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="rapport">
          <div class="header">
            <div class="title">🛡️ Surveillance Financière</div>
            <div class="subtitle">Agence 3 — Antananarivo</div>
            <div class="ref">Rapport N° ${rapport.id} — Généré le ${now}</div>
          </div>

          <div class="divider"></div>

          <div style="text-align:center;">
            <span class="badge">${typeInfo?.emoji} ${typeInfo?.label}</span>
          </div>

          <div class="divider"></div>

          <div class="section-title">Informations générales</div>
          <div class="row">
            <div class="label">Titre</div>
            <div class="value">${rapport.titre}</div>
          </div>
          <div class="row">
            <div class="label">Type</div>
            <div class="value">${typeInfo?.label}</div>
          </div>
          <div class="row">
            <div class="label">Niveau de gravité</div>
            <div class="value"><span class="niveau">${rapport.niveau}</span></div>
          </div>
          <div class="row">
            <div class="label">Lieu / Zone</div>
            <div class="value">${rapport.lieu || 'Non précisé'}</div>
          </div>
          <div class="row">
            <div class="label">Responsable</div>
            <div class="value">${rapport.responsable || 'Non précisé'}</div>
          </div>
          <div class="row">
            <div class="label">Date</div>
            <div class="value">${rapport.date}</div>
          </div>

          <div class="divider"></div>

          <div class="section-title">Description détaillée</div>
          <div class="desc-box">${rapport.description}</div>

          <div class="footer">
            Document généré automatiquement par le Système de Surveillance Financière<br/>
            Ce rapport est confidentiel et destiné uniquement à l'usage interne.
          </div>
        </div>
      </body>
      </html>
    `;

    // ✅ Même méthode que la facture qui marche
    const { base64 } = await Print.printToFileAsync({ html, base64: true });

    if (!base64) {
      throw new Error('Aucun contenu base64 retourné.');
    }

    const destUri = `${FileSystem.cacheDirectory}rapport_${rapport.id}_${Date.now()}.pdf`;

    await FileSystem.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(destUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager ou enregistrer le rapport PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('✅ Succès', `Rapport sauvegardé : ${destUri}`);
    }

  } catch (err) {
    console.error('Erreur génération rapport PDF:', err);
    Alert.alert('Erreur', 'Impossible de générer le rapport PDF.');
  }
};
  const handleSoumettre = () => {
    if (!form.titre || !form.description) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et la description');
      return;
    }
    const newRapport = {
      ...form,
      id: `RPT-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR'),
      statut: 'SOUMIS',
    };
    setRapports([newRapport, ...rapports]);
    setForm({ type: 'DEFAILLANCE_MATERIEL', titre: '', description: '', niveau: 'MOYEN', lieu: '', responsable: '' });
    setModalVisible(false);
    Alert.alert('✅ Rapport créé', 'Voulez-vous générer le PDF ?', [
      { text: 'Plus tard', style: 'cancel' },
      { text: 'Générer PDF', onPress: () => handleGenererRapport(newRapport) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{rapports.length} rapport(s)</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {rapports.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>Aucun rapport créé</Text>
            <Text style={styles.emptySub}>Appuyez sur + Nouveau pour créer un rapport</Text>
          </View>
        )}

        {rapports.map((r) => {
          const typeInfo = TYPES_RAPPORT.find(t => t.id === r.type);
          return (
            <View key={r.id} style={[styles.card, { borderLeftColor: typeInfo?.color, borderLeftWidth: 4 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{typeInfo?.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitre}>{r.titre}</Text>
                  <Text style={styles.cardType}>{typeInfo?.label}</Text>
                </View>
                <View style={[styles.niveauBadge, { backgroundColor: niveauColor[r.niveau] + '22' }]}>
                  <Text style={[styles.niveauText, { color: niveauColor[r.niveau] }]}>{r.niveau}</Text>
                </View>
              </View>

              <Text style={styles.cardDesc} numberOfLines={2}>{r.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>📅 {r.date}</Text>
                {r.lieu ? <Text style={styles.cardDate}>📍 {r.lieu}</Text> : null}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleGenererRapport(r)}
                  style={styles.pdfBtn}
                >
                  <Text style={styles.pdfBtnText}>📥 Exporter PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal création rapport */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouveau Rapport</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Type */}
              <Text style={styles.fieldLabel}>Type de rapport</Text>
              <View style={styles.typeGrid}>
                {TYPES_RAPPORT.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setForm({ ...form, type: t.id })}
                    style={[
                      styles.typeCard,
                      form.type === t.id && { backgroundColor: t.bg, borderColor: t.color }
                    ]}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, form.type === t.id && { color: t.color, fontWeight: '700' }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Titre */}
              <Text style={styles.fieldLabel}>Titre *</Text>
              <TextInput
                value={form.titre}
                onChangeText={(v) => setForm({ ...form, titre: v })}
                placeholder="Ex: Panne serveur principal"
                style={styles.textInput}
              />

              {/* Niveau */}
              <Text style={styles.fieldLabel}>Niveau de gravité</Text>
              <View style={styles.niveauRow}>
                {NIVEAUX.map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setForm({ ...form, niveau: n })}
                    style={[
                      styles.niveauBtn,
                      form.niveau === n && { backgroundColor: niveauColor[n] + '22', borderColor: niveauColor[n] }
                    ]}
                  >
                    <Text style={[styles.niveauBtnText, form.niveau === n && { color: niveauColor[n], fontWeight: '700' }]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lieu */}
              <Text style={styles.fieldLabel}>Lieu / Zone</Text>
              <TextInput
                value={form.lieu}
                onChangeText={(v) => setForm({ ...form, lieu: v })}
                placeholder="Ex: Salle serveur, Agence 3"
                style={styles.textInput}
              />

              {/* Responsable */}
              <Text style={styles.fieldLabel}>Responsable</Text>
              <TextInput
                value={form.responsable}
                onChangeText={(v) => setForm({ ...form, responsable: v })}
                placeholder="Ex: Pierre Rakoto"
                style={styles.textInput}
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Description détaillée *</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="Décrivez l'incident en détail..."
                multiline
                numberOfLines={4}
                style={[styles.textInput, styles.textArea]}
              />

              <TouchableOpacity onPress={handleSoumettre} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>✅ Créer le rapport</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topBar: { padding: wp(4), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: rf(13), color: '#64748b' },
  addBtn: { backgroundColor: '#1a3a5c', borderRadius: wp(3), paddingHorizontal: wp(4), paddingVertical: hp(1.2) },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: rf(14) },
  scroll: { padding: wp(4) },
  emptyBox: { alignItems: 'center', marginTop: hp(8) },
  emptyEmoji: { fontSize: rf(56), marginBottom: hp(1.5) },
  emptyText: { fontSize: rf(16), fontWeight: '700', color: '#1a3a5c' },
  emptySub: { fontSize: rf(13), color: '#94a3b8', marginTop: hp(0.8), textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: wp(4), padding: wp(4), marginBottom: hp(1.5), elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), marginBottom: hp(1) },
  cardEmoji: { fontSize: rf(24) },
  cardTitre: { fontSize: rf(14), fontWeight: '800', color: '#1a3a5c' },
  cardType: { fontSize: rf(12), color: '#64748b', marginTop: hp(0.3) },
  niveauBadge: { paddingHorizontal: wp(2.5), paddingVertical: hp(0.5), borderRadius: wp(5) },
  niveauText: { fontSize: rf(11), fontWeight: '700' },
  cardDesc: { fontSize: rf(13), color: '#475569', marginBottom: hp(1) },
  cardFooter: { flexDirection: 'row', gap: wp(4), marginBottom: hp(1.2) },
  cardDate: { fontSize: rf(11), color: '#94a3b8' },
  actionRow: { flexDirection: 'row', gap: wp(2) },
  pdfBtn: { flex: 1, backgroundColor: '#1a3a5c', borderRadius: wp(2.5), paddingVertical: hp(1.2), alignItems: 'center' },
  pdfBtnText: { color: 'white', fontWeight: '700', fontSize: rf(13) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: wp(6), borderTopRightRadius: wp(6), padding: wp(6) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(2.5) },
  modalTitle: { fontSize: rf(18), fontWeight: '800', color: '#1a3a5c' },
  closeBtn: { fontSize: rf(22), color: '#94a3b8' },
  fieldLabel: { fontSize: rf(13), fontWeight: '600', color: '#374151', marginBottom: hp(1) },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2.5), marginBottom: hp(2) },
  typeCard: {
    width: wp(40), padding: wp(3), borderRadius: wp(3),
    borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', alignItems: 'center',
  },
  typeEmoji: { fontSize: rf(24), marginBottom: hp(0.5) },
  typeLabel: { fontSize: rf(12), color: '#64748b', textAlign: 'center' },
  niveauRow: { flexDirection: 'row', gap: wp(2), marginBottom: hp(2) },
  niveauBtn: {
    flex: 1, paddingVertical: hp(1), borderRadius: wp(2),
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  niveauBtnText: { fontSize: rf(11), color: '#94a3b8', fontWeight: '600' },
  textInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: wp(3),
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    fontSize: rf(14), marginBottom: hp(2),
  },
  textArea: { height: hp(12), textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#1a3a5c', borderRadius: wp(3.5), paddingVertical: hp(2), alignItems: 'center', marginBottom: hp(2.5) },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: rf(15) },
});