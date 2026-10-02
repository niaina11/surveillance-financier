// hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
    const [notifications, setNotifications] = useState([]);

    // Charge les notifications non lues déjà en base au montage
    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('http://localhost:3000/api/admin/mes_notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok) setNotifications(result.data);
            } catch (err) {
                console.error('Erreur chargement notifications :', err);
            }
        };
        fetchNotifications();
    }, []);

    // Connexion socket pour le temps réel
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io('http://localhost:3000', { auth: { token } });

        socket.on('nouvelle_notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
        });

        return () => socket.disconnect();
    }, []);

    const retirerNotification = (id_notification) => {
        setNotifications(prev => prev.filter(n => n.id_notification !== id_notification));
    };

    return { notifications, retirerNotification };
}