import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

// Definir la interfaz para las notificaciones
interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  type: 'system' | 'promo' | 'reward' | 'alert';
  createdAt: string;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simular notificaciones para la demostración
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        title: 'Bienvenido a CryptoSpin',
        message: '¡Gracias por unirte! Disfruta de 5000 fichas gratis para empezar.',
        read: false,
        type: 'system',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        title: 'Bono diario disponible',
        message: 'Tu bono diario de 500 fichas está disponible. ¡Reclámalo ahora!',
        read: false,
        type: 'reward',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 3,
        title: 'Oferta especial',
        message: '¡50% extra en tu próximo depósito por tiempo limitado!',
        read: false,
        type: 'promo',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Marcar notificación como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // En una implementación real, esto sería una llamada API
      // return await apiRequest({
      //   url: `/api/notifications/${notificationId}/read`,
      //   method: 'PATCH'
      // });
      
      // Simulación para la demostración
      return { success: true };
    },
    onSuccess: (_, notificationId) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive"
      });
    }
  });

  // Marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // En una implementación real, esto sería una llamada API
      // return await apiRequest({
      //   url: '/api/notifications/mark-all-read',
      //   method: 'PATCH'
      // });
      
      // Simulación para la demostración
      return { success: true };
    },
    onSuccess: () => {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las notificaciones como leídas",
        variant: "destructive"
      });
    }
  });

  // Eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // En una implementación real, esto sería una llamada API
      // return await apiRequest({
      //   url: `/api/notifications/${notificationId}`,
      //   method: 'DELETE'
      // });
      
      // Simulación para la demostración
      return { success: true };
    },
    onSuccess: (_, notificationId) => {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive"
      });
    }
  });

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Formatear fecha relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} días`;
  };

  // Obtener color según tipo de notificación
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'system': return 'bg-blue-500';
      case 'promo': return 'bg-purple-500';
      case 'reward': return 'bg-yellow-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white focus:outline-none hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
      </button>
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#FF3E8F] text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg bg-[#1A2634] shadow-lg border border-gray-800 z-50"
          >
            <div className="p-3 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#1A2634] z-10">
              <h3 className="font-medium text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-[#00FFAA] hover:text-[#33FFBB]"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            
            <div className="divide-y divide-gray-800">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 hover:bg-[#0F1923] transition-colors", 
                      !notification.read && "bg-[#0F1923]/50"
                    )}
                  >
                    <div className="flex">
                      <div className={cn("w-2 h-2 rounded-full mt-2 mr-3", getTypeColor(notification.type))}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                          <span className="text-xs text-gray-400 ml-2">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                        <div className="flex justify-end mt-2 space-x-2">
                          {!notification.read && (
                            <button 
                              className="text-xs text-[#00FFAA] hover:text-[#33FFBB]"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Marcar como leída
                            </button>
                          )}
                          <button 
                            className="text-xs text-gray-400 hover:text-gray-300"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <p>No hay notificaciones</p>
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-gray-800 bg-[#1A2634] sticky bottom-0">
              <button 
                className="w-full text-center text-xs text-[#00FFAA] p-2 hover:bg-[#0F1923] rounded transition-colors"
                onClick={() => {
                  // En una implementación real, aquí iría la navegación a una página de historial completo
                  toast({
                    title: "Información",
                    description: "El historial completo de notificaciones estará disponible pronto",
                  });
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}