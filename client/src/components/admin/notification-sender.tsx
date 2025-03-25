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
        title: "Notification Sent",
        description: `The notification has been successfully sent to ${
          data.targetType === "all" ? "all users" : 
          data.targetType === "specific" ? "specified users" :
          data.targetType === "winners" ? "users with winning records" :
          data.targetType === "losers" ? "users with losing records" :
          data.targetType === "highRollers" ? "high rollers" : "new users"
        }`,
        variant: "default",
      });
      
      // Reset form
      form.reset();
      
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
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
          Send Global Notification
        </CardTitle>
        <CardDescription>
          Send platform-wide or targeted notifications to users
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
                      <FormLabel>Notification Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter notification title" 
                          className="bg-[#0F1923] border-gray-800"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, concise title for this notification
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
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter notification message"
                          className="min-h-[120px] bg-[#0F1923] border-gray-800"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The main content of your notification
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
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#0F1923] border-gray-800">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1A2634] border-gray-800">
                            <SelectItem value="info">Information</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
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
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#0F1923] border-gray-800">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1A2634] border-gray-800">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
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
                      <FormLabel>Target Audience</FormLabel>
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
                              All Users
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="specific" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Specific Users
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="winners" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Winners
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="losers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Losers
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="highRollers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              High Rollers
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="newUsers" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              New Users
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
                        <FormLabel>User IDs</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter comma-separated user IDs"
                            className="h-[80px] bg-[#0F1923] border-gray-800"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter comma-separated list of user IDs
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
                        <FormLabel>Persistent</FormLabel>
                        <FormDescription>
                          Will remain visible until manually dismissed
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
                        <FormLabel>Schedule Send</FormLabel>
                        <FormDescription>
                          Send notification at a scheduled time
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
                        <FormLabel>Scheduled Time</FormLabel>
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
                        <FormLabel>Action Required</FormLabel>
                        <FormDescription>
                          Add an action button to this notification
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
                          <FormLabel>Button Text</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Claim Bonus"
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
                          <FormLabel>Action URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. /wallet"
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
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="mr-2 h-4 w-4" /> 
                  Send Notification
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}