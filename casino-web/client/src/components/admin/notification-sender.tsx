import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the notification schema
const notificationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  message: z.string().min(5, "Message must be at least 5 characters").max(1000, "Message must be less than 1000 characters"),
  type: z.enum(["info", "success", "warning", "error"], {
    required_error: "Please select a notification type",
  }),
  targetType: z.enum(["all", "specific", "winners", "losers", "highRollers", "newUsers"], {
    required_error: "Please select a target audience",
  }),
  specificUsers: z.array(z.string()).optional(),
  userIdsText: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "Please select a priority level",
  }),
  scheduleSend: z.boolean().default(false),
  scheduledTime: z.string().optional(),
  requiresAction: z.boolean().default(false),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  persistent: z.boolean().default(false),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export function NotificationSender() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      targetType: "all",
      priority: "medium",
      scheduleSend: false,
      requiresAction: false,
      persistent: false,
    },
  });

  const targetType = form.watch("targetType");
  const scheduleSend = form.watch("scheduleSend");
  const requiresAction = form.watch("requiresAction");

  async function onSubmit(data: NotificationFormData) {
    setIsSending(true);
    try {
      // Process specific users if needed
      let specificUserIds: string[] = [];
      
      if (data.targetType === "specific" && data.userIdsText) {
        specificUserIds = data.userIdsText
          .split(",")
          .map(id => id.trim())
          .filter(id => id.length > 0);
      }
      
      // Prepare the notification data
      const notificationData = {
        ...data,
        specificUsers: specificUserIds.length > 0 ? specificUserIds : undefined,
      };
      
      // Send the notification
      const response = await apiRequest({
        url: "/api/admin/notifications/send",
        method: "POST",
        data: notificationData,
      });
      
      toast({
        title: "Notificación Enviada",
        description: `La notificación ha sido enviada exitosamente a ${
          data.targetType === "all" ? "todos los usuarios" : 
          data.targetType === "specific" ? "usuarios específicos" :
          data.targetType === "winners" ? "usuarios con registros ganadores" :
          data.targetType === "losers" ? "usuarios con registros perdedores" :
          data.targetType === "highRollers" ? "grandes apostadores" : "nuevos usuarios"
        }`,
        variant: "default",
      });
      
      // Reset form
      form.reset();
      
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="w-full bg-[#1A2634] border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#00FFAA]" />
          Enviar Notificación Global
        </CardTitle>
        <CardDescription>
          Envía notificaciones a toda la plataforma o a usuarios específicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título de la Notificación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingresa el título de la notificación" 
                          className="bg-[#0F1923] border-gray-800"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Un título claro y conciso para esta notificación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ingresa el mensaje de la notificación"
                          className="min-h-[120px] bg-[#0F1923] border-gray-800"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        El contenido principal de tu notificación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#0F1923] border-gray-800">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1A2634] border-gray-800">
                            <SelectItem value="info">Información</SelectItem>
                            <SelectItem value="success">Éxito</SelectItem>
                            <SelectItem value="warning">Advertencia</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#0F1923] border-gray-800">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1A2634] border-gray-800">
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Audiencia Objetivo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="all" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Todos los Usuarios
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="specific" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Usuarios Específicos
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="winners" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Ganadores
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="losers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Perdedores
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="highRollers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Grandes Apostadores
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="newUsers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Nuevos Usuarios
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {targetType === "specific" && (
                  <FormField
                    control={form.control}
                    name="userIdsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IDs de Usuarios</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ingresa IDs de usuarios separados por comas"
                            className="h-[80px] bg-[#0F1923] border-gray-800"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Ingresa lista de IDs de usuarios separados por comas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="persistent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Persistente</FormLabel>
                        <FormDescription>
                          Permanecerá visible hasta que se descarte manualmente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduleSend"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Programar Envío</FormLabel>
                        <FormDescription>
                          Enviar notificación en un momento programado
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {scheduleSend && (
                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha y Hora Programada</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            className="bg-[#0F1923] border-gray-800"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="requiresAction"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Requiere Acción</FormLabel>
                        <FormDescription>
                          Agregar un botón de acción a esta notificación
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {requiresAction && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actionText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Texto del Botón</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ej. Reclamar Bono"
                              className="bg-[#0F1923] border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="actionUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de Acción</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ej. /billetera"
                              className="bg-[#0F1923] border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
              disabled={isSending}
            >
              {isSending ? (
                <div className="flex items-center">
                  <Send className="mr-2 h-4 w-4 animate-pulse" /> 
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="mr-2 h-4 w-4" /> 
                  Enviar Notificación
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}