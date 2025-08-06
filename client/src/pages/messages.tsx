import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const messageSchema = z.object({
  toUserId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

export default function Messages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages/my"],
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
  });

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      toUserId: "admin", // Default to admin
      subject: "",
      content: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setComposeDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("PUT", `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const handleSubmit = (data: z.infer<typeof messageSchema>) => {
    sendMessageMutation.mutate(data);
  };

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const sortedMessages = messages.sort((a: any, b: any) => 
    new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">
              Communicate with BACO administrators and staff.
            </p>
          </div>
          
          <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-baco-primary hover:bg-baco-secondary"
                data-testid="button-compose-message"
              >
                <i className="fas fa-edit mr-2"></i>
                Compose Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter message subject"
                            {...field}
                            data-testid="input-message-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your message"
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-message-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending}
                      className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setComposeDialogOpen(false)}
                      data-testid="button-cancel-message"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Messages</CardTitle>
                  {unreadCount?.count > 0 && (
                    <Badge variant="destructive" data-testid="badge-unread-messages">
                      {unreadCount.count} unread
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sortedMessages.length > 0 ? (
                  <div className="space-y-2">
                    {sortedMessages.map((message: any) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          !message.isRead ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                        }`}
                        data-testid={`message-item-${message.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-baco-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">A</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">BACO Admin</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(message.sentAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-baco-primary rounded-full"></div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-envelope text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages</h3>
                    <p className="text-gray-500 mb-4">
                      You don't have any messages yet. Send a message to BACO administrators.
                    </p>
                    <Button 
                      onClick={() => setComposeDialogOpen(true)}
                      className="bg-baco-primary hover:bg-baco-secondary"
                      data-testid="button-send-first-message"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Send First Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Detail / Help */}
          <div>
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle>Message Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subject</label>
                      <p className="text-gray-900">{selectedMessage.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900">
                        {format(new Date(selectedMessage.sentAt), 'MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Message</label>
                      <div className="bg-gray-50 p-4 rounded-lg mt-2">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">BACO Administration</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                          <i className="fas fa-envelope mr-2 text-baco-primary"></i>
                          admin@baco-bahamas.com
                        </p>
                        <p className="flex items-center">
                          <i className="fas fa-phone mr-2 text-baco-primary"></i>
                          +1 (242) 123-4567
                        </p>
                        <p className="flex items-center">
                          <i className="fas fa-map-marker-alt mr-2 text-baco-primary"></i>
                          Nassau, Bahamas
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Quick Help</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">• Membership inquiries</p>
                        <p className="text-gray-600">• Event registrations</p>
                        <p className="text-gray-600">• Document verification</p>
                        <p className="text-gray-600">• Payment support</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
