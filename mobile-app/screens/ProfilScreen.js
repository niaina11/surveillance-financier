import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { wp, hp, rf } from '../utils/responsive';

const menuItems = [
  { label: 'Notifications', emoji: '🔔' },
  { label: 'Aide & Support', emoji: '❓' },
];

export default function ProfilScreen({onLogout}) {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [agence, setAgence] = useState('');
  const [telephone, setTelephone] = useState('');
  const infos = [
  { label: 'Email', value: email },
  { label: 'Téléphone', value: telephone },
  { label: 'Rôle', value: "Agent d'Agence" },
  { label: 'Statut', value: 'Actif ✅' },
];

  const chargerUSer = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedNom = await AsyncStorage.getItem('nom');
      const storedPrenom = await AsyncStorage.getItem('prenom');
      const storedAgence = await AsyncStorage.getItem('nom_agence');
      const storedTelephone = await AsyncStorage.getItem('telephone');
      if (storedEmail) {
        setEmail(storedEmail);
      }
      if (storedNom) {
        setNom(storedNom);
      }
      if (storedPrenom) {
        setPrenom(storedPrenom);
      }
      if (storedAgence) {
        setAgence(storedAgence);
      }
      if (storedTelephone) {
        setTelephone(storedTelephone);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations de l'utilisateur :", error);
    }
  };

  useEffect(() => {
    chargerUSer();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Mon Profil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.profileName}>{prenom} {nom}</Text>
          <Text style={styles.profileRole}>Agent d'Agence</Text>
          <Text style={styles.profileAgence}>🏢 {agence}</Text>
        </View>

        <View style={styles.infoCard}>
          {infos.map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuCard}>
          {menuItems.map(({ label, emoji }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]}
            >
              <Text style={styles.menuEmoji}>{emoji}</Text>
              <Text style={styles.menuLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutEmoji}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: wp(5) },
  pageTitle: { fontSize: rf(20), fontWeight: '800', color: '#1a3a5c', marginBottom: hp(2.5) },
  profileCard: {
    backgroundColor: 'white', borderRadius: wp(5), padding: wp(5),
    alignItems: 'center', marginBottom: hp(2.5), elevation: 2,
  },
  avatar: {
    width: wp(18), height: wp(18), borderRadius: wp(9),
    backgroundColor: '#dbeafe', alignItems: 'center',
    justifyContent: 'center', marginBottom: hp(1.5),
  },
  avatarEmoji: { fontSize: rf(36) },
  profileName: { fontSize: rf(18), fontWeight: '800', color: '#1a3a5c' },
  profileRole: { color: '#64748b', fontSize: rf(13), marginTop: hp(0.3) },
  profileAgence: { color: '#2980b9', fontSize: rf(13), fontWeight: '600', marginTop: hp(1) },
  infoCard: { backgroundColor: 'white', borderRadius: wp(5), padding: wp(5), marginBottom: hp(2.5) },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: hp(1.2), borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: rf(13), color: '#94a3b8' },
  infoValue: { fontSize: rf(13), fontWeight: '600', color: '#1e293b' },
  menuCard: { backgroundColor: 'white', borderRadius: wp(5), overflow: 'hidden', marginBottom: hp(2.5) },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: wp(3.5), padding: wp(4) },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuEmoji: { fontSize: rf(20) },
  menuLabel: { fontSize: rf(14), color: '#1e293b', fontWeight: '500' },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: wp(3.5), padding: wp(4),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2.5),
  },
  logoutEmoji: { fontSize: rf(20) },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: rf(15) },
});