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
  toUserId: z.string().optional(), // Optional for members (backend will find admin)
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

export default function Messages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/my"],
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
  });


  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      toUserId: "",
      subject: "",
      content: "",
    },
  });

  const replyForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      toUserId: "",
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
    // Backend will auto-find admin if toUserId is not provided for members
    sendMessageMutation.mutate({
      ...data,
      toUserId: data.toUserId || "", // Empty string, backend will find admin
    });
  };

  // Group messages into conversation threads with admin
  const conversations = (() => {
    const convos: { [key: string]: { admin: any; messages: any[] } } = {};
    messages.forEach((msg: any) => {
      // Find the admin in the conversation
      const adminId = msg.fromUser?.isAdmin ? msg.fromUserId : msg.toUserId;
      const admin = msg.fromUser?.isAdmin ? msg.fromUser : msg.toUser;
      if (adminId && admin && admin.isAdmin) {
        if (!convos[adminId]) {
          convos[adminId] = {
            admin: admin,
            messages: [],
          };
        }
        convos[adminId].messages.push(msg);
      }
    });
    // Sort messages in each conversation
    Object.keys(convos).forEach(key => {
      convos[key].messages.sort((a: any, b: any) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    });
    return convos;
  })();

  const handleConversationClick = (conv: any) => {
    setSelectedConversation(conv);
    // Mark all unread messages in conversation as read
    conv.messages.forEach((msg: any) => {
      if (!msg.isRead) {
        markAsReadMutation.mutate(msg.id);
      }
    });
    // Initialize reply form with admin ID
    replyForm.reset({
      toUserId: conv.admin.id,
      subject: `Re: ${conv.messages[conv.messages.length - 1]?.subject || 'Message'}`,
      content: "",
    });
  };

  const handleReply = () => {
    if (selectedConversation?.admin?.id) {
      replyForm.reset({
        toUserId: selectedConversation.admin.id,
        subject: `Re: ${selectedConversation.messages[selectedConversation.messages.length - 1]?.subject || 'Message'}`,
        content: "",
      });
    }
  };

  const sendReplyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      replyForm.reset({
        toUserId: selectedConversation?.admin?.id || "",
        subject: "",
        content: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
          {/* Conversations List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversations</CardTitle>
                  {unreadCount?.count > 0 && (
                    <Badge variant="destructive" data-testid="badge-unread-messages">
                      {unreadCount.count} unread
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(conversations).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(conversations).map(([adminId, conv]) => {
                      const unreadInConv = conv.messages.filter((m: any) => !m.isRead).length;
                      const lastMessage = conv.messages[conv.messages.length - 1];
                      return (
                        <div
                          key={adminId}
                          onClick={() => handleConversationClick(conv)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            unreadInConv > 0 ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-baco-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">A</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">BACO Admin</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(lastMessage.sentAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                            {unreadInConv > 0 && (
                              <Badge variant="destructive">{unreadInConv}</Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{lastMessage.subject}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{lastMessage.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}</p>
                        </div>
                      );
                    })}
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

          {/* Conversation Thread / Reply */}
          <div>
            {selectedConversation ? (
              <Card>
                <CardHeader>
                  <CardTitle>Conversation with BACO Admin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedConversation.messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.fromUser?.isAdmin ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {msg.fromUser?.isAdmin ? 'BACO Admin' : 'You'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(msg.sentAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{msg.subject}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  
                  {/* Reply Form - Always visible for any message in thread */}
                  <div className="pt-4 border-t">
                    <Form {...replyForm}>
                      <form 
                        onSubmit={replyForm.handleSubmit((data) => {
                          // Ensure toUserId is set to admin
                          sendReplyMutation.mutate({
                            ...data,
                            toUserId: selectedConversation.admin.id,
                          });
                        })} 
                        className="space-y-4"
                      >
                        <FormField
                          control={replyForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reply</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Type your reply..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={sendReplyMutation.isPending}
                          className="w-full bg-baco-primary hover:bg-baco-secondary"
                        >
                          {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                        </Button>
                      </form>
                    </Form>
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
