import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTripStore } from '../store/tripStore';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useToastStore } from '../store/toastStore';

export const useSocketEvents = () => {
  const { user, isAuthenticated } = useAuth();
  const { fetchInvitations, fetchTrips } = useTripStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (isAuthenticated && user && user.id) {
      const socket = connectSocket(user.id, user.name);

      const handleConnect = () => {
        console.log('🔌 Socket connected, registering user...');
        socket.emit('register', { userId: user.id, name: user.name });
      };

      socket.on('connect', handleConnect);
      if (socket.connected) {
        handleConnect();
      }

      // Initial fetch of existing invitations & trips
      fetchInvitations();
      fetchTrips();

      socket.on('invitation_received', (data) => {
        console.log('✉️ Invitation received via Socket:', data);
        useTripStore.setState((state) => {
          const alreadyExists = state.invitations.some(inv => inv.id === data.trip.id || inv._id === data.trip._id);
          if (alreadyExists) return {};
          return {
            invitations: [data.trip, ...state.invitations]
          };
        });
        addToast(data.message || 'You received a new trip invitation!', 'info');
      });

      socket.on('notification_received', (data) => {
        console.log('🔔 Notification received via Socket:', data);
        addToast(data.message, 'info');
        // Re-fetch trips & invitations to ensure state is in sync
        fetchTrips();
        fetchInvitations();
      });

      socket.on('trip_updated', (updatedTrip) => {
        console.log('🔄 Trip updated via Socket:', updatedTrip);
        useTripStore.setState((state) => {
          const isSelected = state.selectedTrip && (state.selectedTrip.id === updatedTrip.id || state.selectedTrip._id === updatedTrip._id);
          const nextSelected = isSelected ? updatedTrip : state.selectedTrip;
          const nextTrips = state.trips.map(t => (t.id === updatedTrip.id || t._id === updatedTrip._id) ? updatedTrip : t);

          return {
            selectedTrip: nextSelected,
            trips: nextTrips
          };
        });
      });

      return () => {
        socket.off('connect', handleConnect);
        socket.off('invitation_received');
        socket.off('notification_received');
        socket.off('trip_updated');
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user, fetchInvitations, fetchTrips, addToast]);
};

export default useSocketEvents;
