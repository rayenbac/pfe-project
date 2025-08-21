import { Server } from 'socket.io';

export function setupSocketIO(io: Server) {
  // Simple notification service
  const realtimeNotificationService = {
    io,
    sendNotification: (userId: string, notification: any) => {
      io.to(`user_${userId}`).emit('notification', notification);
    },
    sendToAll: (event: string, data: any) => {
      io.emit(event, data);
    },
    notifyPostReviewed: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('post_reviewed', data);
    },
    notifyPropertyReviewed: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('property_reviewed', data);
    },
    notifyPropertyUpdate: (propertyId: string, data: any) => {
      io.to(`property_${propertyId}`).emit('property_updated', data);
    },
    notifyAdminNewProperty: (propertyData: any) => {
      io.emit('admin_new_property', propertyData);
    },
    notifyAdminPropertyUpdated: (propertyData: any) => {
      io.emit('admin_property_updated', propertyData);
    },
    notifyFavoritePropertyUpdate: (userId: string, propertyData: any) => {
      io.to(`user_${userId}`).emit('favorite_property_updated', propertyData);
    },
    notifyBookingUpdate: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('booking_updated', data);
    },
    notifyPaymentUpdate: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('payment_updated', data);
    },
    notifyPaymentConfirmed: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('payment_confirmed', data);
    },
    notifyNewBooking: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('new_booking', data);
    },
    notifyBookingConfirmed: (userId: string, data: any) => {
      io.to(`user_${userId}`).emit('booking_confirmed', data);
    },
    notifyNewReport: (adminId: string, reportData: any) => {
      io.to(`user_${adminId}`).emit('new_report', reportData);
    },
    notifyReportStatusChanged: (reporterId: string, reportData: any) => {
      io.to(`user_${reporterId}`).emit('report_status_changed', reportData);
    },
    notifyUserBlocked: (userId: string, blockData: any) => {
      io.to(`user_${userId}`).emit('user_blocked', blockData);
    },
    notifyUserUnblocked: (userId: string, adminName: string) => {
      io.to(`user_${userId}`).emit('user_unblocked', { adminName, unblockedAt: new Date() });
    }
  };

  // Basic socket connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return {
    io,
    realtimeNotificationService
  };
}