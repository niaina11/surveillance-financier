import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, StyleSheet, ActivityIndicator
} from 'react-native';
import { url } from '../utils/api';
import { wp, hp, rf } from '../utils/responsive';

export default function InscriptionScreen({ onBack }) {
  const [listeAgencesBDD, setListeAgencesBDD] = useState([]);
  const [loadingAgences, setLoadingAgences] = useState(true);

  // Correction de la double déclaration de la clé 'telephone'
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', 
    id_agence: '', password: '', confirm: '',
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les agences depuis la BDD
  useEffect(() => {
    const chargerAgences = async () => {
      try {
        const response = await fetch(`${url}/api/auth/getAgencesPublic`); 
        const result = await response.json();
        
        if (response.ok) {
          setListeAgencesBDD(result.data || []);
        } else {
          console.warn("Réponse d'erreur du serveur :", result.message);
        }
      } catch (err) {
        console.error("Erreur chargement agences:", err.message);
      } finally {
        setLoadingAgences(false);
      }
    };

    chargerAgences();
  }, []);

  // 2. Soumission de l'inscription
  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.password || !form.id_agence) {
      setError("Veuillez remplir tous les champs obligatoires (*) et choisir une agence.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      const response = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          role: "AGENT",
          id_agence: form.id_agence,
          mot_de_passe: form.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Échec de l'inscription.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Vue de succès après soumission
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successEmoji}>✉️</Text>
          <Text style={styles.successTitle}>Demande transmise !</Text>
          <Text style={styles.successText}>
            Votre demande d'inscription a bien été affectée à votre agence.
            Votre accès réseau sera débloqué dès validation par la Direction Générale.
          </Text>
          <TouchableOpacity onPress={onBack} style={styles.successBackBtn}>
            <Text style={styles.successBackBtnText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Lien de Retour en Bleu Paositra */}
        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Retour à l'identification</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Rejoindre le Réseau Agent</Text>
          <Text style={styles.subtitle}>
            Remplissez vos informations professionnelles pour demander votre accès au système de surveillance.
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {[
            { key: 'nom', label: 'Nom *', placeholder: 'Rakoto' },
            { key: 'prenom', label: 'Prénom', placeholder: 'Pierre' },
            { key: 'email', label: 'Email Professionnel *', placeholder: 'pierre.r@paositra.mg', type: 'email-address' },
            { key: 'telephone', label: 'Téléphone Agent', placeholder: '034 00 000 00', type: 'phone-pad' },
          ].map(({ key, label, placeholder, type }) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={(v) => setForm({ ...form, [key]: v })}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={type || 'default'}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                style={styles.input}
              />
            </View>
          ))}

          {/* Grille de sélection d'agence aux couleurs de la marque */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sélectionnez votre Bureau de Poste *</Text>
            {loadingAgences ? (
              <ActivityIndicator color="#0033A0" style={{ marginVertical: hp(2) }} />
            ) : (
              <View style={styles.agenceGrid}>
                {listeAgencesBDD.map((agence) => (
                  <TouchableOpacity
                    key={agence.id_agence}
                    onPress={() => setForm({ ...form, id_agence: agence.id_agence })}
                    style={[
                      styles.agenceBtn, 
                      form.id_agence === agence.id_agence && styles.agenceBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.agenceBtnText, 
                      form.id_agence === agence.id_agence && styles.agenceBtnTextActive
                    ]}>
                      {agence.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <TextInput
              value={form.confirm}
              onChangeText={(v) => setForm({ ...form, confirm: v })}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Bouton de soumission Jaune Paositra */}
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={loadingSubmit} 
            style={[styles.submitBtn, loadingSubmit && styles.submitBtnDisabled]}
          >
            {loadingSubmit ? (
              <ActivityIndicator color="#0033A0" />
            ) : (
              <Text style={styles.submitBtnText}>Envoyer ma demande</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 📱 Styles Mobile aux Normes Paositra Malagasy
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: wp(5) },
  backLink: { marginBottom: hp(2) },
  backLinkText: { color: '#0033A0', fontWeight: '800', fontSize: rf(13) },
  header: { marginBottom: hp(2.5) },
  title: { fontSize: rf(21), fontWeight: '900', color: '#0033A0', letterSpacing: 0.5 },
  subtitle: { color: '#4b5563', fontSize: rf(13), marginTop: hp(0.5), fontWeight: '500', leadingLine: hp(2) },
  
  form: { 
    backgroundColor: 'white', 
    borderRadius: wp(5), 
    padding: wp(5),
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 1
  },
  inputGroup: { marginBottom: hp(2) },
  label: { fontSize: rf(12), fontWeight: '800', color: '#1f2937', uppercase: true, marginBottom: hp(0.6) },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: wp(3),
    paddingHorizontal: wp(4), paddingVertical: hp(1.4), fontSize: rf(14), color: '#1f2937',
    backgroundColor: '#f9fafb', fontWeight: '500'
  },
  
  // Design des boutons de sélection d'agence (Inversion de marque)
  agenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2), marginTop: hp(0.5) },
  agenceBtn: {
    backgroundColor: '#f3f4f6', paddingHorizontal: wp(3), paddingVertical: hp(1.2),
    borderRadius: wp(2.5), borderWidth: 1, borderColor: '#e5e7eb'
  },
  agenceBtnActive: { backgroundColor: '#0033A0', borderColor: '#0033A0' },
  agenceBtnText: { color: '#4b5563', fontWeight: '700', fontSize: rf(12) },
  agenceBtnTextActive: { color: '#FFD100', fontWeight: '900' },

  // Bouton de Validation Principal Jaune
  submitBtn: {
    backgroundColor: '#FFD100', borderRadius: wp(3), paddingVertical: hp(1.8),
    alignItems: 'center', marginTop: hp(1), shadowColor: '#FFD100', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 2
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#0033A0', fontWeight: '900', fontSize: rf(14), textTransform: 'uppercase' },


  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a3a5c', marginBottom: 12 },
  successText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  backBtn: {
    backgroundColor: '#1a3a5c', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: 24,
  },
  backBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
