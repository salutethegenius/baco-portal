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
  const [uploadObjectPath, setUploadObjectPath] = useState<string>("");

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
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:uploadMutation',message:'Upload mutation started',data:{fileName:data.fileName,hasObjectURL:!!data.objectURL,objectURL:data.objectURL?.substring(0,100),category:data.category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        const response = await apiRequest("PUT", "/api/documents/upload", data);
        const result = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:uploadMutation',message:'Upload mutation success',data:{status:response.status,hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return result;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:uploadMutation',message:'Upload mutation error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw error;
      }
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
      setUploadObjectPath("");
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
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleGetUploadParameters',message:'Requesting upload parameters',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const result = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleGetUploadParameters',message:'Upload parameters received',data:{hasUploadURL:!!result.uploadURL,hasObjectPath:!!result.objectPath,uploadURL:result.uploadURL?.substring(0,100),objectPath:result.objectPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Store the upload URL and object path for use after upload completes
      setUploadUrl(result.uploadURL);
      setUploadObjectPath(result.objectPath);
      return {
        method: "PUT" as const,
        url: result.uploadURL,
      };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleGetUploadParameters',message:'Error getting upload parameters',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleUploadComplete',message:'Upload complete callback',data:{hasSuccessful:!!result.successful,successfulCount:result.successful?.length,resultKeys:Object.keys(result),fullResult:JSON.stringify(result).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (result.successful && result.successful.length > 0) {
      const firstSuccess = result.successful[0];
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleUploadComplete',message:'Processing successful upload',data:{hasUploadURL:!!firstSuccess.uploadURL,uploadURL:firstSuccess.uploadURL?.substring(0,100),url:firstSuccess.url?.substring(0,100),response:firstSuccess.response,keys:Object.keys(firstSuccess),fullFirstSuccess:JSON.stringify(firstSuccess).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Try multiple ways to get the upload URL from Uppy result
      const uploadURL = firstSuccess.uploadURL || 
                       firstSuccess.url || 
                       firstSuccess.response?.uploadURL ||
                       firstSuccess.response?.url ||
                       firstSuccess.meta?.uploadURL ||
                       (firstSuccess.response?.body && typeof firstSuccess.response.body === 'string' ? firstSuccess.response.body : null);
      
      if (uploadURL) {
        setUploadUrl(uploadURL);
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleUploadComplete',message:'Upload URL set',data:{uploadURL:uploadURL.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleUploadComplete',message:'Could not extract upload URL',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleUploadComplete',message:'No successful uploads found',data:{hasFailed:!!result.failed,failedCount:result.failed?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  };

  const handleSubmitUpload = (data: z.infer<typeof uploadSchema>) => {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleSubmitUpload',message:'Submit upload called',data:{hasUploadUrl:!!uploadUrl,hasObjectPath:!!uploadObjectPath,uploadUrl:uploadUrl?.substring(0,100),objectPath:uploadObjectPath,category:data.category,fileName:data.fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!uploadUrl && !uploadObjectPath) {
      toast({
        title: "Upload Required",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }

    // Extract file info from upload URL or form
    const fileName = data.fileName || "Uploaded Document";
    
    // Prefer objectPath (more reliable), fallback to uploadUrl
    const objectURL = uploadObjectPath || uploadUrl;
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b01d4d08-cb00-4beb-85ae-2d32c7ff182f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents.tsx:handleSubmitUpload',message:'Calling upload mutation',data:{fileName,objectURL:objectURL?.substring(0,100),hasUploadUrl:!!uploadUrl,hasObjectPath:!!uploadObjectPath,usingObjectPath:!!uploadObjectPath,category:data.category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    uploadMutation.mutate({
      fileName,
      fileType: "application/pdf", // Default, could be extracted from upload
      fileSize: 0, // Could be extracted from upload result
      objectURL: objectURL,
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
                      disabled={uploadMutation.isPending || (!uploadUrl && !uploadObjectPath)}
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
