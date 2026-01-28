import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ObjectUploader from "@/components/ObjectUploader";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function CertificateTemplateUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [uploadObjectPath, setUploadObjectPath] = useState<string>("");

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/certificate-templates"],
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", { fileType: "image/png" });
      const result = await response.json();
      setUploadUrl(result.uploadURL);
      setUploadObjectPath(result.objectPath);
      return {
        method: "PUT" as const,
        url: result.uploadURL,
      };
    } catch (error) {
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const firstSuccess = result.successful[0];
      const uploadURL = firstSuccess.uploadURL || firstSuccess.url || firstSuccess.response?.uploadURL;
      if (uploadURL) {
        setUploadUrl(uploadURL);
      }
    }
  };

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!uploadObjectPath && !uploadUrl) {
        throw new Error("Please upload a template image first");
      }

      const objectPath = uploadObjectPath || uploadUrl;

      const response = await apiRequest("POST", "/api/admin/certificate-templates", {
        name: data.name,
        description: data.description,
        templateImagePath: objectPath,
        textConfig: null, // Can be configured later
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Certificate template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificate-templates"] });
      setUploadDialogOpen(false);
      form.reset();
      setUploadUrl("");
      setUploadObjectPath("");
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("DELETE", `/api/admin/certificate-templates/${templateId}`);
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Certificate template has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificate-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (window.confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificate Templates</h2>
          <p className="text-gray-600">Upload and manage certificate templates</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-baco-primary hover:bg-baco-secondary">
              <i className="fas fa-plus mr-2"></i>
              Upload Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Certificate Template</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., CPD Certificate Template" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe this template..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Template Image
                  </label>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full border-2 border-dashed border-gray-300 hover:border-baco-primary transition-colors"
                  >
                    <div className="flex flex-col items-center py-8">
                      <i className="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-2"></i>
                      <span className="text-sm text-gray-600">Click to upload template image</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                    </div>
                  </ObjectUploader>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || (!uploadUrl && !uploadObjectPath)}
                    className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                  >
                    {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template: any) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Created: {format(new Date(template.createdAt), 'MMM d, yyyy')}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteTemplate(template.id, template.name)}
                disabled={deleteTemplateMutation.isPending}
                className="w-full"
              >
                <i className="fas fa-trash mr-2"></i>
                Delete Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-certificate text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
            <p className="text-gray-500 mb-4">
              Upload your first certificate template to get started.
            </p>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="bg-baco-primary hover:bg-baco-secondary"
            >
              <i className="fas fa-upload mr-2"></i>
              Upload First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
