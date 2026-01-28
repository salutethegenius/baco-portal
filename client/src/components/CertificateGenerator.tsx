import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ObjectUploader from "@/components/ObjectUploader";

const certificateSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  templateId: z.string().min(1, "Template is required"),
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  cpdHours: z.coerce.number().min(0, "CPD hours must be 0 or greater"),
  logoPath: z.string().optional(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

export default function CertificateGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [logoUploadUrl, setLogoUploadUrl] = useState<string>("");
  const [logoObjectPath, setLogoObjectPath] = useState<string>("");

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/certificate-templates"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      memberId: "",
      templateId: "",
      name: "",
      date: new Date().toISOString().split('T')[0],
      cpdHours: 0,
      logoPath: "",
    },
  });

  const handleGetLogoUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", { fileType: "image/png" });
      const result = await response.json();
      setLogoUploadUrl(result.uploadURL);
      setLogoObjectPath(result.objectPath);
      return {
        method: "PUT" as const,
        url: result.uploadURL,
      };
    } catch (error) {
      throw error;
    }
  };

  const handleLogoUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const firstSuccess = result.successful[0];
      const uploadURL = firstSuccess.uploadURL || firstSuccess.url || firstSuccess.response?.uploadURL;
      if (uploadURL) {
        setLogoUploadUrl(uploadURL);
      }
    }
  };

  const generateCertificateMutation = useMutation({
    mutationFn: async (data: CertificateFormData) => {
      const logoPath = logoObjectPath || logoUploadUrl || data.logoPath;

      const response = await apiRequest("POST", "/api/admin/certificates/generate", {
        memberId: data.memberId,
        templateId: data.templateId,
        name: data.name,
        date: data.date,
        cpdHours: data.cpdHours,
        logoPath: logoPath || undefined,
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate Generated",
        description: "Certificate has been generated and sent to the member successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/my"] });
      setGenerateDialogOpen(false);
      form.reset();
      setLogoUploadUrl("");
      setLogoObjectPath("");
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CertificateFormData) => {
    generateCertificateMutation.mutate(data);
  };

  const selectedMember = users.find((u: any) => u.id === form.watch("memberId"));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generate Certificate</h2>
          <p className="text-gray-600">Generate and send certificates to members</p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-baco-primary hover:bg-baco-secondary">
              <i className="fas fa-certificate mr-2"></i>
              Generate Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Certificate</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Member</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
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
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name on Certificate</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Enter name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpdHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPD Hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Optional)
                  </label>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleGetLogoUploadParameters}
                    onComplete={handleLogoUploadComplete}
                    buttonClassName="w-full border-2 border-dashed border-gray-300 hover:border-baco-primary transition-colors"
                  >
                    <div className="flex flex-col items-center py-6">
                      <i className="fas fa-image text-gray-400 text-2xl mb-2"></i>
                      <span className="text-sm text-gray-600">Click to upload logo</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                    </div>
                  </ObjectUploader>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={generateCertificateMutation.isPending}
                    className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                  >
                    {generateCertificateMutation.isPending ? "Generating..." : "Generate & Send"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGenerateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
