import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const messageSchema = z.object({
  toUserId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

export default function AdminMessagesTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/messages"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as any)?.isAdmin,
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
      const response = await apiRequest("POST", "/api/admin/messages/reply", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
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

  const sendReplyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      const response = await apiRequest("POST", "/api/admin/messages/reply", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setReplyDialogOpen(false);
      replyForm.reset();
      setReplyToMessage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group messages by member (conversation threads)
  const conversations = (() => {
    const convos: { [key: string]: { member: any; messages: any[] } } = {};
    messages.forEach((msg: any) => {
      // Find the member (non-admin) in the conversation
      const memberId = msg.fromUser?.isAdmin ? msg.toUserId : msg.fromUserId;
      const member = msg.fromUser?.isAdmin ? msg.toUser : msg.fromUser;
      if (memberId && member && !member.isAdmin) {
        if (!convos[memberId]) {
          convos[memberId] = {
            member: member,
            messages: [],
          };
        }
        convos[memberId].messages.push(msg);
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

  const handleSubmit = (data: z.infer<typeof messageSchema>) => {
    sendMessageMutation.mutate(data);
  };

  const handleReply = (message: any) => {
    setReplyToMessage(message);
    const memberId = message.fromUser?.isAdmin ? message.toUserId : message.fromUserId;
    replyForm.reset({
      toUserId: memberId,
      subject: `Re: ${message.subject || 'Message'}`,
      content: "",
    });
    setReplyDialogOpen(true);
  };

  const handleReplySubmit = (data: z.infer<typeof messageSchema>) => {
    sendReplyMutation.mutate(data);
  };

  const members = users.filter((u: any) => !u.isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Messages</h2>
          <p className="text-gray-600">Manage conversations with members</p>
        </div>
        <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-baco-primary hover:bg-baco-secondary">
              <i className="fas fa-edit mr-2"></i>
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message to Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="toUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.firstName} {member.lastName} ({member.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter subject" {...field} />
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
                        <Textarea placeholder="Enter message" className="min-h-[120px]" {...field} />
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
                  >
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComposeDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(conversations).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(conversations).map(([memberId, conv]) => (
                    <div
                      key={memberId}
                      onClick={() => setSelectedConversation(conv)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {conv.member?.firstName} {conv.member?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{conv.member?.email}</p>
                        </div>
                        <Badge>{conv.messages.length} messages</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No conversations yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedConversation ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedConversation.member?.firstName} {selectedConversation.member?.lastName}
                </CardTitle>
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
                        {msg.fromUser?.isAdmin ? 'You' : `${msg.fromUser?.firstName} ${msg.fromUser?.lastName}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.sentAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{msg.subject}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    {/* Admin can reply to any message in the thread */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleReply(msg)}
                    >
                      Reply
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Select a conversation to view messages</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(handleReplySubmit)} className="space-y-4">
              <FormField
                control={replyForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter reply" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={sendReplyMutation.isPending}
                  className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                >
                  {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
