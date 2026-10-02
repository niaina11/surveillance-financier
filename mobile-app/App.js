import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Activity, Bell, User } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import InscriptionScreen from './screens/InscriptionScreen';
import AccueilScreen from './screens/AccueilScreen';
import OperationsScreen from './screens/OperationsScreen';
import ApprobationsScreen from './screens/ApprobationsScreen';
import ProfilScreen from './screens/ProfilScreen';
import RapportScreen from './screens/RapportScreen';
import MessagerieScreen from './screens/MessagerieScreen';
import { hp, wp, rf } from './utils/responsive';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function Sidebar({ currentTab, onNavigate, onLogout }) {
  const items = [
    { name: 'Accueil', emoji: '🏠' },
    { name: 'Opérations', emoji: '💰' },
    { name: 'Approbations', emoji: '📋' },
    { name: 'Profil', emoji: '👤' },
    { name: 'Rapports', emoji: '📋' },
    { name: 'Messages', emoji: '💬' }
  ];

  return (
    <View style={sidebarStyles.container}>
      <View style={sidebarStyles.logoBox}>
        <Text style={sidebarStyles.logoEmoji}>📦</Text>
        <Text style={sidebarStyles.logoTitle}>PAOSITRA</Text>
        <Text style={sidebarStyles.logoSub}>Surveillance Financière</Text>
      </View>
      {items.map(({ name, emoji }) => (
        <TouchableOpacity
          key={name}
          onPress={() => onNavigate(name)}
          style={[sidebarStyles.item, currentTab === name && sidebarStyles.itemActive]}
        >
          <Text style={sidebarStyles.itemEmoji}>{emoji}</Text>
          <Text style={[sidebarStyles.itemLabel, currentTab === name && sidebarStyles.itemLabelActive]}>
            {name}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={onLogout} style={sidebarStyles.logoutBtn}>
        <Text style={sidebarStyles.logoutEmoji}>🚪</Text>
        <Text style={sidebarStyles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainApp({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('Accueil');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderScreen = () => {
    switch (currentTab) {
      case 'Accueil': return <AccueilScreen />;
      case 'Opérations': return <OperationsScreen />;
      case 'Approbations': return <ApprobationsScreen />;
      case 'Rapports': return <RapportScreen />;
      case 'Messages': return <MessagerieScreen />;
      case 'Profil': return <ProfilScreen onLogout={onLogout} />;
      default: return <AccueilScreen />;
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA' }}>
      {/* Sidebar - Identité forte Jaune & Bleu */}
      {sidebarOpen && (
        <Sidebar
          currentTab={currentTab}
          onNavigate={(name) => { setCurrentTab(name); setSidebarOpen(false); }}
          onLogout={onLogout}
        />
      )}

      {/* Contenu principal */}
      <View style={{ flex: 1 }}>
        {/* Topbar Propre et Claire */}
        <View style={appStyles.topbar}>
          <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={appStyles.menuBtn}>
            <Text style={appStyles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={appStyles.topbarTitle}>{currentTab}</Text>
          <TouchableOpacity style={appStyles.messageBtn}>
            <Text style={appStyles.messageIcon}>🔔</Text> 
          </TouchableOpacity>
        </View>

        {/* Page courante */}
        <View style={{ flex: 1 }}>
          {renderScreen()}
        </View>

        {/* Bottom Navigation aux couleurs de la marque */}
        <View style={appStyles.bottomNav}>
          {[
            { name: 'Accueil', emoji: '🏠' },
            { name: 'Opérations', emoji: '💰' },
            { name: 'Approbations', emoji: '📋' },
            { name: 'Profil', emoji: '👤' },
          ].map(({ name, emoji }) => (
            <TouchableOpacity
              key={name}
              onPress={() => setCurrentTab(name)}
              style={appStyles.bottomItem}
            >
              <Text style={[appStyles.bottomEmoji, currentTab === name && appStyles.bottomEmojiActive]}>{emoji}</Text>
              <Text style={[appStyles.bottomLabel, currentTab === name && appStyles.bottomLabelActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('login');

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={() => setScreen('main')}
        onInscription={() => setScreen('inscription')}
      />
    );
  }
  if (screen === 'inscription') {
    return (
      <InscriptionScreen
        onBack={() => setScreen('login')}
      />
    );
  }
  return <MainApp onLogout={() => setScreen('login')} />;
}

// 📱 Styles de la Sidebar (Jaune Officiel Paositra)
const sidebarStyles = StyleSheet.create({
  container: {
    width: wp(58),
    backgroundColor: '#FFD100', // Jaune Paositra Officiel
    paddingTop: hp(6),
    paddingHorizontal: wp(4),
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 51, 160, 0.1)',
  },
  logoBox: { alignItems: 'center', marginBottom: hp(4) },
  logoEmoji: { fontSize: rf(32), marginBottom: hp(0.5) },
  logoTitle: { color: '#0033A0', fontSize: rf(18), fontWeight: '900', letterSpacing: 1 }, // Bleu Paositra
  logoSub: { color: '#0033A0', fontSize: rf(11), fontWeight: '600', opacity: 0.8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: wp(3),
    paddingVertical: hp(1.4), paddingHorizontal: wp(3),
    borderRadius: wp(2.5), marginBottom: hp(0.5),
  },
  itemActive: { backgroundColor: '#0033A0' }, // Inversion : fond Bleu sur le lien sélectionné
  itemEmoji: { fontSize: rf(16) },
  itemLabel: { color: '#0033A0', fontSize: rf(14), fontWeight: '750' },
  itemLabelActive: { color: '#FFD100', fontWeight: '900' }, // Le texte devient Jaune sur fond Bleu
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(3),
    paddingVertical: hp(1.4), paddingHorizontal: wp(3),
    borderRadius: wp(2.5),
    position: 'absolute', bottom: hp(5), left: wp(4), right: wp(4),
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutEmoji: { fontSize: rf(16) },
  logoutText: { color: '#b91c1c', fontSize: rf(14), fontWeight: '700' },
});

// 📱 Styles Généraux de l'Application (Fond Épuré / Accents Bleus)
const appStyles = StyleSheet.create({
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', paddingTop: hp(6),
    paddingBottom: hp(1.8), paddingHorizontal: wp(5),
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
  },
  menuBtn: { width: wp(10), justifyContent: 'center' },
  messageBtn : { width: wp(10), alignItems: 'flex-end' },
  menuIcon: { color: '#0033A0', fontSize: rf(22), fontWeight: 'bold' },
  messageIcon: { color: '#0033A0', fontSize: rf(20) },
  topbarTitle: { color: '#0033A0', fontSize: rf(16), fontWeight: '900', letterSpacing: 0.5 },
  bottomNav: {
    flexDirection: 'row', backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    paddingBottom: hp(2), paddingTop: hp(1.2),
  },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomEmoji: { fontSize: rf(18), opacity: 0.6 },
  bottomEmojiActive: { opacity: 1 },
  bottomLabel: { fontSize: rf(10), color: '#94a3b8', marginTop: hp(0.4), fontWeight: '500' },
  bottomLabelActive: { color: '#0033A0', fontWeight: '900' },
});
