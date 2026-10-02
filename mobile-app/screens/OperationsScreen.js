import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, SafeAreaView, StyleSheet, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { url } from '../utils/api';
import { wp, hp, rf } from '../utils/responsive';

export default function OperationsScreen() {
  const [ops, setOps] = useState([]);
  const [modalAjout, setModalAjout] = useState(false);
  const [modalModif, setModalModif] = useState(false);
  const [modalFacture, setModalFacture] = useState(false);
  const [selectedOp, setSelectedOp] = useState(null);
  const [type, setType] = useState('DECAISSEMENT');
  const [montant, setMontant] = useState('');
  const [idOperation, setIdOperation] = useState("");
  const [description, setDescription] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [prenomClient, setPrenomClient] = useState('');
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [numero, setNumero] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prenom, setPrenom] = useState('');

  const genererFacturePDF = async () => {
    if (!selectedOp) {
      Alert.alert('Erreur', 'Aucune opération sélectionnée.');
      return;
    }

    try {
      const montantVal = Number(selectedOp.montant || 0);
      const signe = selectedOp.type_operation === 'ENCAISSEMENT' ? '+' : '-';
      const couleur = selectedOp.type_operation === 'ENCAISSEMENT' ? '#27ae60' : '#e74c3c';
      const dateOperation = selectedOp.date_operation
        ? new Date(selectedOp.date_operation).toLocaleString('fr-FR')
        : '';

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
        .facture {
          border: 1px solid #ddd;
          padding: 35px;
        }
        .header {
          text-align: center;
        }
        .title {
          font-size: 25px;
          font-weight: bold;
          color: #1f2937;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
        }
        .divider {
          border-top: 1px solid #ddd;
          margin: 20px 0;
        }
        .reference {
          font-size: 16px;
          font-weight: bold;
        }
        .date {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
        }
        .row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .label {
          width: 35%;
          font-weight: bold;
          color: #555;
        }
        .value {
          width: 65%;
          text-align: right;
        }
        .total {
          display: flex;
          justify-content: space-between;
          padding: 18px;
          background: #f5f5f5;
          margin-top: 20px;
        }
        .total-label {
          font-size: 17px;
          font-weight: bold;
        }
        .total-value {
          font-size: 22px;
          font-weight: bold;
          color: ${couleur};
        }
        .footer {
          text-align: center;
          margin-top: 35px;
          font-size: 11px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="facture">
        <div class="header">
          <div class="title">Surveillance Financière</div>
          <div class="subtitle">Agence 3 — Antananarivo</div>
        </div>
        <div class="divider"></div>
        <div class="reference">FACTURE N° ${selectedOp.id_operation || ''}</div>
        <div class="date">Date : ${dateOperation}</div>
        <div class="divider"></div>
        <div class="row">
          <div class="label">Type</div>
          <div class="value">${selectedOp.type_operation || ''}</div>
        </div>
        <div class="row">
          <div class="label">Description</div>
          <div class="value">${selectedOp.description || ''}</div>
        </div>
        <div class="row">
          <div class="label">Agent</div>
          <div class="value">${prenom || ''}</div>
        </div>
        <div class="row">
          <div class="label">Statut</div>
          <div class="value">${selectedOp.statut || ''}</div>
        </div>
        <div class="divider"></div>
        <div class="total">
          <div class="total-label">MONTANT TOTAL</div>
          <div class="total-value">${signe}${montantVal.toLocaleString('fr-FR')} Ar</div>
        </div>
        <div class="divider"></div>
        <div class="footer">
          Document généré automatiquement par le Système de Surveillance Financière
        </div>
      </div>
    </body>
    </html>
    `;


      const { base64 } = await Print.printToFileAsync({ html, base64: true });

      if (!base64) {
        throw new Error('Le module Print n\'a pas renvoyé de contenu base64.');
      }

      const destUri = `${FileSystem.cacheDirectory}facture_${selectedOp.id_operation || Date.now()}.pdf`;

      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Partager ce fichier
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager ou enregistrer la facture PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas disponible sur cet appareil.");
      }

      setModalFacture(false);

    } catch (err) {
      console.error('Erreur génération PDF:', err);
      Alert.alert('Erreur', "Impossible de générer ou de partager la facture PDF.");
    }
  };

  const chargerUser = async () => {
    try {
      const storedPrenom = await AsyncStorage.getItem('prenom');
      if (storedPrenom) {
        setPrenom(storedPrenom);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du prénom de l'utilisateur :", error);
    }
  };

  const onChange = (event, selectedDate) => {
    setShow(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAjouter = async () => {
    if (!montant || !description || !nomClient || !numero) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${url}/api/agence/operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type_operation: type,
          montant: parseInt(montant),
          description: description,
          nom_client: nomClient,
          prenom_client: prenomClient,
          numero_client: numero,
          date_operation: date.toISOString()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'ajout de l\'opération');
      }

      setOps([result.data, ...ops]);
      setMontant('');
      setDescription('');
      setNomClient('');
      setNumero('');
      setPrenomClient('');
      setModalAjout(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const openModif = (op) => {
    setSelectedOp(op);
    setIdOperation(op.id_operation);
    setMontant(op.montant.toString());
    setDescription(op.desc);
    setModalModif(true);
    console.log("Selected Operation for Modification:", op);
  };
  const handleModifier = async () => {
    if (!montant || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${url}/api/agence/demandes/modification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_operation: idOperation,
          nouveau_montant: parseInt(montant),
          motif: description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'envoi de la demande');
      }

      Alert.alert(
        '✅ Demande envoyée',
        'Votre demande de modification a été transmise à l\'administrateur.'
      );

      setModalModif(false);
      setSelectedOp(null);
      setMontant('');
      setDescription('');

    } catch (err) {
      setError(err.message);
      Alert.alert('Erreur', err.message);
    }
  };

  const handleSupprimer = (op) => {
    Alert.alert(
      'Suppression',
      `La suppression de ${op.ref} nécessite la validation de l'administrateur. Envoyer la demande ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer demande',
          style: 'destructive',
          onPress: () => {
            setOps(ops.map(o => o.id === op.id ? { ...o, statut: 'SUPPRESSION_DEMANDÉE' } : o));
          },
        },
      ]
    );
  };

  const openFacture = (op) => {
    setSelectedOp(op);
    setModalFacture(true);
  };

  const fetchOperations = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${url}/api/agence/operations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la récupération des opérations');
      }

      setOps(result.data);
    } catch (error) {
      setError(error.message);
    }
  };
  useEffect(() => {
    fetchOperations();
    chargerUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{ops.length} opérations</Text>
        <TouchableOpacity onPress={() => setModalAjout(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* {
          error && (
            <Text style={{ color: 'red', marginBottom: 10 }}>
              {error.Error || error.message || 'Une erreur est survenue'}
            </Text>)
        } */}
        {ops.map((op) => (
          <View key={op.id_operation} style={styles.opCard}>
            <View style={styles.opRow}>
              <Text style={[styles.opType, { color: op.type_operation === 'Recette' ? '#27ae60' : '#e74c3c' }]}>
                {op.type_operation}
              </Text>
              <Text style={[styles.opMontant, { color: op.type_operation === 'ENCAISSEMENT' ? '#27ae60' : '#e74c3c' }]}>
                {op.type_operation === 'ENCAISSEMENT' ? '+' : '-'}{op.montant.toLocaleString()} Ar
              </Text>
            </View>
            <Text style={styles.opDesc}>{op.description}</Text>
            <View style={styles.opRow}>
              <Text style={styles.opRef}>{op.id_operation} — {op.date_operation}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => openModif(op)} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openFacture(op)} style={[styles.actionBtn, styles.actionBtnGreen]}>
                <Text style={styles.actionBtnText}>🧾 Facture</Text>
              </TouchableOpacity>
              {op.statut !== 'SUPPRESSION_DEMANDÉE' && (
                <TouchableOpacity onPress={() => handleSupprimer(op)} style={[styles.actionBtn, styles.actionBtnRed]}>
                  <Text style={styles.actionBtnText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal Ajout */}
      <Modal visible={modalAjout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Opération</Text>
              <TouchableOpacity onPress={() => setModalAjout(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {error && (
              <Text style={{ color: 'red', marginBottom: 10 }}>
                {error}
              </Text>
            )}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {['DECAISSEMENT', 'ENCAISSEMENT', 'TRANSFERT'].map((t) => (
                <TouchableOpacity
                  key={t} onPress={() => setType(t)}
                  style={[styles.typeBtn, type === t && {
                    backgroundColor: t === 'DECAISSEMENT' ? '#dcfce7' : '#fee2e2',
                    borderColor: t === 'DECAISSEMENT' ? '#27ae60' : '#e74c3c',
                  }]}
                >
                  <Text style={[styles.typeBtnText, { color: type === t ? (t === 'DECAISSEMENT' ? '#27ae60' : '#e74c3c') : '#94a3b8' }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Montant (Ar)</Text>
            <TextInput value={montant} onChangeText={setMontant} placeholder="Ex: 1500000" keyboardType="numeric" style={styles.textInput} />
            <Text style={styles.fieldLabel}>Nom Client </Text>
            <TextInput value={nomClient} onChangeText={setNomClient} placeholder="Ex: Jean" style={styles.textInput} />
            <Text style={styles.fieldLabel}>Prénom Client </Text>
            <TextInput value={prenomClient} onChangeText={setPrenomClient} placeholder="Ex: Dupont" style={styles.textInput} />
            <Text style={styles.fieldLabel}>Numéro Téléphone</Text>
            <TextInput value={numero} onChangeText={setNumero} placeholder="Ex: 0340010001" keyboardType="numeric" style={styles.textInput} />
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity
              onPress={() => setShow(true)}
              style={styles.textInput}
            >
              <Text>{date.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>

            {show && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
              />
            )}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Motif..." multiline style={[styles.textInput, styles.textArea]} />
            <TouchableOpacity onPress={handleAjouter} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Modification */}
      <Modal visible={modalModif} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier — {selectedOp?.ref}</Text>
              <TouchableOpacity onPress={() => setModalModif(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Nouveau montant (Ar)</Text>
            <TextInput value={montant} onChangeText={setMontant} keyboardType="numeric" style={styles.textInput} />
            <Text style={styles.fieldLabel}>Motif de la modification</Text>
            <TextInput value={description} onChangeText={setDescription} multiline style={[styles.textInput, styles.textArea]} />
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ Toute modification sera journalisée</Text>
            </View>
            <TouchableOpacity onPress={handleModifier} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Envoyer le demande de modification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Facture */}
      <Modal visible={modalFacture} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Facture</Text>
              <TouchableOpacity onPress={() => setModalFacture(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedOp && (
              <View style={styles.factureBox}>
                <View style={styles.factureHeader}>
                  <Text style={styles.factureTitle}>🛡️ Surveillance Financière</Text>
                  <Text style={styles.factureSubtitle}>Agence 3 — Antananarivo</Text>
                </View>
                <View style={styles.factureDivider} />
                <Text style={styles.factureRef}>FACTURE N° {selectedOp.id_operation}</Text>
                <Text style={styles.factureDate}>Date : {selectedOp.date_operation}</Text>
                <View style={styles.factureDivider} />
                <View style={styles.factureRow}>
                  <Text style={styles.factureLabel}>Type</Text>
                  <Text style={styles.factureValue}>{selectedOp.type_operation}</Text>
                </View>
                <View style={styles.factureRow}>
                  <Text style={styles.factureLabel}>Description</Text>
                  <Text style={styles.factureValue}>{selectedOp.description}</Text>
                </View>
                <View style={styles.factureRow}>
                  <Text style={styles.factureLabel}>Agent</Text>
                  <Text style={styles.factureValue}>{prenom}</Text>
                </View>
                <View style={styles.factureRow}>
                  <Text style={styles.factureLabel}>Statut</Text>
                  <Text style={styles.factureValue}>{selectedOp.statut}</Text>
                </View>
                <View style={styles.factureDivider} />
                <View style={styles.factureTotalRow}>
                  <Text style={styles.factureTotalLabel}>MONTANT TOTAL</Text>
                  <Text style={[styles.factureTotalValue, { color: selectedOp.type_operation === 'ENCAISSEMENT' ? '#27ae60' : '#e74c3c' }]}>
                    {selectedOp.type_operation === 'ENCAISSEMENT' ? '+' : '-'}{selectedOp.montant.toLocaleString()} Ar
                  </Text>
                </View>
                <View style={styles.factureDivider} />
                <Text style={styles.factureFooter}>
                  Document généré automatiquement par le Système de Surveillance Financière
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={genererFacturePDF}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>
                📥 Télécharger la facture
              </Text>
            </TouchableOpacity>
          </View>
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
  opCard: { backgroundColor: 'white', borderRadius: wp(4), padding: wp(4), marginBottom: hp(1.5), elevation: 1 },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(0.8) },
  opType: { fontSize: rf(13), fontWeight: '700' },
  opMontant: { fontSize: rf(16), fontWeight: '800' },
  opDesc: { fontSize: rf(13), color: '#475569', marginBottom: hp(0.8) },
  opRef: { fontSize: rf(11), color: '#94a3b8' },
  opStatut: { fontSize: rf(11), fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: wp(2), marginTop: hp(1.2) },
  actionBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: wp(2), paddingVertical: hp(1), alignItems: 'center' },
  actionBtnGreen: { backgroundColor: '#dcfce7' },
  actionBtnRed: { backgroundColor: '#fee2e2' },
  actionBtnText: { fontSize: rf(12), fontWeight: '600', color: '#374151' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: 'white', borderTopLeftRadius: wp(6), borderTopRightRadius: wp(6), padding: wp(6), maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(2.5) },
  modalTitle: { fontSize: rf(18), fontWeight: '800', color: '#1a3a5c' },
  closeBtn: { fontSize: rf(22), color: '#94a3b8' },
  fieldLabel: { fontSize: rf(13), fontWeight: '600', color: '#374151', marginBottom: hp(1) },
  typeRow: { flexDirection: 'row', gap: wp(2.5), marginBottom: hp(2) },
  typeBtn: { flex: 1, paddingVertical: hp(1.2), borderRadius: wp(2.5), alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnText: { fontWeight: '700', fontSize: rf(12) },
  textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: wp(3), paddingHorizontal: wp(4), paddingVertical: hp(1.5), fontSize: rf(14), marginBottom: hp(2) },
  textArea: { height: hp(10), textAlignVertical: 'top' },
  warningBox: { backgroundColor: '#fef3c7', borderRadius: wp(2.5), padding: wp(2.5), marginBottom: hp(2) },
  warningText: { color: '#92400e', fontSize: rf(12) },
  saveBtn: { backgroundColor: '#1a3a5c', borderRadius: wp(3.5), paddingVertical: hp(2), alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: rf(15) },
  factureBox: { backgroundColor: '#f8fafc', borderRadius: wp(4), padding: wp(5), marginBottom: hp(2) },
  factureHeader: { alignItems: 'center', marginBottom: hp(1.5) },
  factureTitle: { fontSize: rf(16), fontWeight: '800', color: '#1a3a5c' },
  factureSubtitle: { fontSize: rf(12), color: '#64748b', marginTop: hp(0.3) },
  factureDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: hp(1.5) },
  factureRef: { fontSize: rf(15), fontWeight: '800', color: '#1a3a5c', marginBottom: hp(0.5) },
  factureDate: { fontSize: rf(12), color: '#64748b', marginBottom: hp(0.5) },
  factureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1) },
  factureLabel: { fontSize: rf(13), color: '#94a3b8' },
  factureValue: { fontSize: rf(13), fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right' },
  factureTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factureTotalLabel: { fontSize: rf(14), fontWeight: '800', color: '#1a3a5c' },
  factureTotalValue: { fontSize: rf(20), fontWeight: '800' },
  factureFooter: { fontSize: rf(10), color: '#94a3b8', textAlign: 'center', marginTop: hp(0.5) },
});