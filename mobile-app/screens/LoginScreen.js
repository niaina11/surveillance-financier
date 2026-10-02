import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { url } from '../utils/api';
import { wp, hp, rf } from '../utils/responsive';

export default function LoginScreen({ onLogin, onInscription }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          mot_de_passe: password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la connexion');
      }

      await AsyncStorage.setItem('token', result.data.token);
      await AsyncStorage.setItem('id_utilisateur', result.data.id_utilisateur.toString());
      await AsyncStorage.setItem('nom', result.data.nom);
      await AsyncStorage.setItem('prenom', result.data.prenom);
      await AsyncStorage.setItem('role', result.data.role);
      await AsyncStorage.setItem('id_agence', result.data.id_agence.toString());
      await AsyncStorage.setItem('nom_agence', result.data.nom_agence || '');
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('telephone', result.data.telephone || '');
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* En-tête avec Logo Postal */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>📦</Text>
          </View>
          <Text style={styles.title}>PAOSITRA MALAGASY</Text>
          <Text style={styles.subtitle}>Surveillance Financière</Text>
        </View>

        {/* Formulaire de Connexion */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="agent@paositra.mg"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>

          {/* Zone d'erreur stylisée */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Bouton de Connexion Jaune Paositra */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.button, isLoading && { opacity: 0.7 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#0033A0" size="small" />
            ) : (
              <Text style={styles.buttonText}>Se connecter au réseau</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Bouton d'Inscription aux contours Bleus */}
          <TouchableOpacity onPress={onInscription} style={styles.inscriptionBtn}>
            <Text style={styles.inscriptionText}>Créer un compte agent</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          🛡️ L'inscription nécessite l'approbation de la Direction Générale.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 📱 Styles Mobile aux Normes Paositra Malagasy
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001A50' }, // Bleu Paositra Officiel
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: wp(6) },
  logoContainer: { alignItems: 'center', marginBottom: hp(3.5) },
  logoBox: {
    width: wp(18), height: wp(18), backgroundColor: '#FFD100', // Jaune Paositra
    borderRadius: wp(4.5), alignItems: 'center',
    justifyContent: 'center', marginBottom: hp(1.5),
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4
  },
  logoEmoji: { fontSize: rf(30) },
  title: { color: '#FFD100', fontSize: rf(20), fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#FFFFFF', fontSize: rf(14), fontWeight: '600', marginTop: hp(0.2), opacity: 0.9 },
  
  form: { 
    backgroundColor: 'white', 
    borderRadius: wp(5), 
    padding: wp(6),
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8
  },
  inputGroup: { marginBottom: hp(1.8) },
  label: { fontSize: rf(12), fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', tracking: 0.5, marginBottom: hp(0.6) },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: wp(3),
    paddingHorizontal: wp(4), paddingVertical: hp(1.4), fontSize: rf(14), color: '#1f2937',
    backgroundColor: '#f9fafb', fontWeight: '500'
  },
  
  // Bouton Jaune avec texte Bleu Officiel
  button: {
    backgroundColor: '#FFD100', borderRadius: wp(3),
    paddingVertical: hp(1.6), alignItems: 'center', marginTop: hp(0.5),
    shadowColor: '#FFD100', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2
  },
  buttonText: { color: '#0033A0', fontWeight: '900', fontSize: rf(14), textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginVertical: hp(2) },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { color: '#9ca3af', fontSize: rf(12), fontWeight: '600' },
  
  inscriptionBtn: {
    borderWidth: 1.5, borderColor: '#0033A0', borderRadius: wp(3),
    paddingVertical: hp(1.6), alignItems: 'center',
  },
  inscriptionText: { color: '#0033A0', fontWeight: '800', fontSize: rf(14) },
  
  errorBox: {
    backgroundColor: '#fef2f2', borderHorizontalWidth: 1, borderColor: '#fee2e2',
    padding: wp(3), borderRadius: wp(2.5), marginBottom: hp(1.5)
  },
  errorText: { color: '#b91c1c', fontSize: rf(12), fontWeight: '700', textAlign: 'center' },
  note: { color: '#FFFFFF', fontSize: rf(11), textAlign: 'center', marginTop: hp(3), fontWeight: '600', opacity: 0.8 },
});
