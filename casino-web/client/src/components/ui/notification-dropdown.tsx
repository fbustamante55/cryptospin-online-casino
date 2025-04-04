import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
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
  
  // Simulamos notificaciones iniciales para la demostración
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

  // Simulamos la llegada de nuevas notificaciones periódicamente
  useEffect(() => {
    // Tipos de notificaciones que podemos recibir
    const notificationTypes = ['system', 'promo', 'reward', 'alert'];
    const notificationTitles = [
      'Ganancia en Ruleta', 
      'Oferta Especial', 
      'Nuevos juegos disponibles', 
      'Actualización del sistema',
      'Verificación requerida',
      'Bono de recarga',
      'Torneo de slots'
    ];
    const notificationMessages = [
      '¡Felicitaciones! Has ganado 250 fichas en la ruleta.',
      'Obtén un 100% de bonificación en tu próximo depósito.',
      'Hemos agregado 5 nuevos juegos de slots.',
      'El sistema ha sido actualizado con nuevas funciones.',
      'Para mejorar tu seguridad, verifica tu cuenta ahora.',
      'Recibe un bono del 50% en tu próxima recarga.',
      'Participa en nuestro torneo semanal de slots.'
    ];

    // Función para generar una notificación aleatoria
    const generateRandomNotification = (): Notification => {
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)] as 'system' | 'promo' | 'reward' | 'alert';
      const randomTitleIndex = Math.floor(Math.random() * notificationTitles.length);
      const randomMessageIndex = Math.floor(Math.random() * notificationMessages.length);
      
      return {
        id: Date.now(),
        title: notificationTitles[randomTitleIndex],
        message: notificationMessages[randomMessageIndex],
        read: false,
        type: randomType,
        createdAt: new Date().toISOString()
      };
    };

    // Configuramos un temporizador para agregar notificaciones aleatorias
    const notificationInterval = setInterval(() => {
      // Hay un 30% de probabilidad de recibir una notificación
      if (Math.random() < 0.3) {
        const newNotification = generateRandomNotification();
        
        // Agregamos la notificación a la lista
        setNotifications(prev => [newNotification, ...prev]);
        
        // Mostramos una alerta toast si el menú no está abierto
        if (!isOpen) {
          toast({
            title: "Nueva notificación",
            description: newNotification.title,
            variant: "default"
          });
        }
      }
    }, 20000); // Cada 20 segundos verificamos

    return () => clearInterval(notificationInterval);
  }, [isOpen, toast]);

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
      case 'reward': return 'bg-[#09b66d]';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
        className="flex items-center justify-center"
      >
        <Bell className="h-5 w-5 text-white" />
      </button>
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#09b66d] text-[10px] flex items-center justify-center text-white font-medium border border-[#0e1824]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-4 w-80 max-h-[70vh] overflow-y-auto rounded-lg bg-[#0e1824] shadow-lg border border-[#1c2b3a] z-50"
          >
            <div className="p-3 border-b border-[#1c2b3a] flex justify-between items-center sticky top-0 bg-[#0e1824] z-10">
              <h3 className="font-medium text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-[#09b66d] hover:text-[#0fda85] transition-colors"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            
            <div className="divide-y divide-[#1c2b3a]">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 hover:bg-[#192531] transition-colors", 
                      !notification.read && "bg-[#192531]/50"
                    )}
                  >
                    <div className="flex">
                      <div className={cn("w-2 h-2 rounded-full mt-2 mr-3", getTypeColor(notification.type))}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                          <div className="flex items-center ml-2">
                            <span className="text-xs text-gray-400 mr-2">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            <button 
                              className="text-gray-400 hover:text-white"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                        <div className="flex justify-end mt-2 space-x-2">
                          {!notification.read && (
                            <button 
                              className="text-xs text-[#09b66d] hover:text-[#0fda85] transition-colors"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Marcar como leída
                            </button>
                          )}
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
            
            <div className="p-2 border-t border-[#1c2b3a] bg-[#0e1824] sticky bottom-0">
              <button 
                className="w-full text-center text-xs text-[#09b66d] p-2 hover:bg-[#192531] rounded transition-colors"
                onClick={() => {
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