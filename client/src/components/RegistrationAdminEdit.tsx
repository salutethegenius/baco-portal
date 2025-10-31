import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink } from "lucide-react";

interface RegistrationAdminEditProps {
  registration: any;
  event: any;
  open: boolean;
  onClose: () => void;
}

export default function RegistrationAdminEdit({ registration, event, open, onClose }: RegistrationAdminEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    membershipType: registration?.membershipType || "",
    isPaid: registration?.isPaid || false,
    paymentMethodTracking: registration?.paymentMethodTracking || "",
    cros: registration?.cros || "",
    adminNotes: registration?.adminNotes || "",
  });

  // Reset form data when registration changes or dialog opens
  useEffect(() => {
    if (registration && open) {
      setFormData({
        membershipType: registration.membershipType || "",
        isPaid: registration.isPaid || false,
        paymentMethodTracking: registration.paymentMethodTracking || "",
        cros: registration.cros || "",
        adminNotes: registration.adminNotes || "",
      });
    }
  }, [registration, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Filter out empty strings for optional enum fields
      const payload: any = {};
      if (formData.membershipType) payload.membershipType = formData.membershipType;
      if (typeof formData.isPaid === 'boolean') payload.isPaid = formData.isPaid;
      if (formData.paymentMethodTracking) payload.paymentMethodTracking = formData.paymentMethodTracking;
      if (formData.cros !== undefined) payload.cros = formData.cros;
      if (formData.adminNotes !== undefined) payload.adminNotes = formData.adminNotes;

      const response = await apiRequest("PATCH", `/api/admin/event-registrations/${registration.id}`, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update registration" }));
        throw new Error(errorData.message || "Failed to update registration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", event.id, "registrations"] });
      toast({
        title: "Registration Updated",
        description: "Lead information has been updated successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const publicEventUrl = event?.slug ? `${window.location.origin}/events/${event.slug}` : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Lead - {registration?.firstName} {registration?.lastName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Information */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">Lead Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{registration?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{registration?.phoneNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Company:</span>
                <span className="ml-2 font-medium">{registration?.companyName || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Position:</span>
                <span className="ml-2 font-medium">{registration?.position || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Registration Type:</span>
                <span className="ml-2 font-medium capitalize">{registration?.registrationType?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">${registration?.paymentAmount}</span>
              </div>
            </div>
          </div>

          {/* Membership Type */}
          <div className="space-y-2">
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={formData.membershipType}
              onValueChange={(value) => setFormData({ ...formData, membershipType: value })}
            >
              <SelectTrigger id="membershipType" data-testid="select-membershipType">
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="non_member">Non-Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mark as Paid Toggle */}
          <div className="flex items-center justify-between space-x-2 bg-gray-50 p-4 rounded-lg">
            <Label htmlFor="isPaid" className="cursor-pointer">
              <div className="font-semibold">Mark as Paid</div>
              <div className="text-sm text-gray-600">Toggle payment status</div>
            </Label>
            <Switch
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
              data-testid="toggle-isPaid"
            />
          </div>

          {/* Payment Method Tracking */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethodTracking">Payment Method (Tracking)</Label>
            <Select
              value={formData.paymentMethodTracking}
              onValueChange={(value) => setFormData({ ...formData, paymentMethodTracking: value })}
            >
              <SelectTrigger id="paymentMethodTracking" data-testid="select-paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paylanes">Paylanes (Online)</SelectItem>
                <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CROS */}
          <div className="space-y-2">
            <Label htmlFor="cros">CROS</Label>
            <Textarea
              id="cros"
              value={formData.cros}
              onChange={(e) => setFormData({ ...formData, cros: e.target.value })}
              placeholder="Enter CROS information"
              rows={3}
              data-testid="input-cros"
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notes</Label>
            <Textarea
              id="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              placeholder="Additional admin notes"
              rows={3}
              data-testid="input-adminNotes"
            />
          </div>

          {/* Registered Page Link */}
          {publicEventUrl && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">Registered Page</Label>
              <a
                href={publicEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm"
                data-testid="link-registered-page"
              >
                {publicEventUrl}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-baco-primary hover:bg-baco-secondary"
              data-testid="button-save-registration"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
