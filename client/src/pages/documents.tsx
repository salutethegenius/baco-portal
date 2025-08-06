import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const uploadSchema = z.object({
  category: z.string().min(1, "Category is required"),
  fileName: z.string().optional(),
});

export default function Documents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>("");

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents/my"],
  });

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: "certificate",
      fileName: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/documents/upload", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and is pending verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/my"] });
      setUploadDialogOpen(false);
      form.reset();
      setUploadUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      setUploadUrl(result.successful[0].uploadURL);
    }
  };

  const handleSubmitUpload = (data: z.infer<typeof uploadSchema>) => {
    if (!uploadUrl) {
      toast({
        title: "Upload Required",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }

    // Extract file info from upload URL or form
    const fileName = data.fileName || "Uploaded Document";
    
    uploadMutation.mutate({
      fileName,
      fileType: "application/pdf", // Default, could be extracted from upload
      fileSize: 0, // Could be extracted from upload result
      objectURL: uploadUrl,
      category: data.category,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "certificate":
        return "fas fa-certificate";
      case "id":
        return "fas fa-id-card";
      case "receipt":
        return "fas fa-receipt";
      default:
        return "fas fa-file-alt";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">
              Manage your professional documents and certifications.
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-baco-primary hover:bg-baco-secondary"
                data-testid="button-upload-document"
              >
                <i className="fas fa-upload mr-2"></i>
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitUpload)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-document-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="certificate">Professional Certificate</SelectItem>
                            <SelectItem value="id">Identification</SelectItem>
                            <SelectItem value="receipt">Payment Receipt</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fileName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter document name"
                            {...field}
                            data-testid="input-document-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
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
                        <span className="text-sm text-gray-600">Click to upload file</span>
                        <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</span>
                      </div>
                    </ObjectUploader>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={uploadMutation.isPending || !uploadUrl}
                      className="flex-1 bg-baco-primary hover:bg-baco-secondary"
                      data-testid="button-submit-upload"
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length > 0 ? (
            documents.map((document: any) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-baco-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                          <i className={`${getCategoryIcon(document.category)} text-baco-primary text-lg`}></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900" data-testid={`text-document-name-${document.id}`}>
                          {document.fileName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{document.category}</span>
                          <span>•</span>
                          <span>{format(new Date(document.uploadDate), 'MMM d, yyyy')}</span>
                          {document.fileSize && (
                            <>
                              <span>•</span>
                              <span>{(document.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge 
                        className={getStatusColor(document.status)}
                        data-testid={`badge-document-status-${document.id}`}
                      >
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(document.objectPath, '_blank')}
                        data-testid={`button-download-${document.id}`}
                      >
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  {document.status === "rejected" && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        This document was rejected. Please upload a corrected version.
                      </p>
                    </div>
                  )}
                  
                  {document.verifiedAt && document.status === "approved" && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        <i className="fas fa-check-circle mr-2"></i>
                        Verified on {format(new Date(document.verifiedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-file-alt text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                <p className="text-gray-500 mb-4">
                  Upload your professional documents and certifications to get started.
                </p>
                <Button 
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-baco-primary hover:bg-baco-secondary"
                  data-testid="button-upload-first-document"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
