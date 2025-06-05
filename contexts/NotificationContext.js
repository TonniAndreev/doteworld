import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // In a real app, this would fetch from Firestore
      // For demo, we'll use mock data
      const mockNotifications = [
        {
          id: '1',
          type: 'achievement',
          title: 'New Achievement Unlocked!',
          message: 'You earned the "Early Bird" badge for walking before 8am.',
          read: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        {
          id: '2',
          type: 'friend',
          title: 'Friend Request',
          message: 'Sarah Miller sent you a friend request.',
          read: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: '3',
          type: 'territory',
          title: 'Territory Alert',
          message: 'You claimed a new territory of 0.5 km²!',
          read: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      
      // In a real app, we would set up a real-time listener
      // const unsubscribe = firestore.collection('users').doc(user.uid)
      //   .collection('notifications')
      //   .orderBy('timestamp', 'desc')
      //   .limit(20)
      //   .onSnapshot(snapshot => {
      //     const notificationData = snapshot.docs.map(doc => ({
      //       id: doc.id,
      //       ...doc.data(),
      //     }));
      //     setNotifications(notificationData);
      //     setUnreadCount(notificationData.filter(n => !n.read).length);
      //   });
      // 
      // return unsubscribe;
    }
  }, [user]);

  const markAsRead = (notificationId) => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // In a real app, this would update Firestore
    // return firestore.collection('users').doc(user.uid)
    //   .collection('notifications').doc(notificationId)
    //   .update({ read: true });
  };

  const markAllAsRead = () => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setUnreadCount(0);
    
    // In a real app, this would update Firestore
    // const batch = firestore.batch();
    // notifications.forEach(notification => {
    //   if (!notification.read) {
    //     const notificationRef = firestore.collection('users').doc(user.uid)
    //       .collection('notifications').doc(notification.id);
    //     batch.update(notificationRef, { read: true });
    //   }
    // });
    // return batch.commit();
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);