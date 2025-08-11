import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Share2, Copy } from "lucide-react";

interface QRCodeGeneratorProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
}

export function QRCodeGenerator({ eventId, eventTitle, eventSlug }: QRCodeGeneratorProps) {
  const [qrCodeImage, setQRCodeImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const publicEventUrl = `${window.location.origin}/events/${eventSlug}`;

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: publicEventUrl,
          title: eventTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQRCodeImage(data.qrCode);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `${eventSlug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: "QR code has been downloaded to your device.",
    });
  };

  const copyEventLink = async () => {
    try {
      await navigator.clipboard.writeText(publicEventUrl);
      toast({
        title: "Copied",
        description: "Event link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle}`,
          url: publicEventUrl,
        });
      } catch (error) {
        // User cancelled or sharing failed
      }
    } else {
      // Fallback to copying link
      copyEventLink();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          data-testid={`button-qr-code-${eventId}`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-url">Public Event URL</Label>
            <div className="flex gap-2">
              <Input
                id="event-url"
                value={publicEventUrl}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyEventLink}
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!qrCodeImage ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <QrCode className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">Generate QR Code</h3>
                    <p className="text-sm text-gray-600">
                      Create a QR code for easy event sharing
                    </p>
                  </div>
                  <Button
                    onClick={generateQRCode}
                    disabled={isGenerating}
                    data-testid="button-generate-qr"
                  >
                    {isGenerating ? "Generating..." : "Generate QR Code"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code for {eventTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrCodeImage}
                    alt={`QR Code for ${eventTitle}`}
                    className="w-48 h-48 border rounded-lg"
                    data-testid="qr-code-image"
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>Scan to view event details and register</p>
                  <p className="font-mono text-xs mt-1 break-all">{publicEventUrl}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    className="gap-2"
                    data-testid="button-download-qr"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareEvent}
                    className="gap-2"
                    data-testid="button-share-event"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQRCodeImage("");
                      generateQRCode();
                    }}
                    className="gap-2"
                    data-testid="button-regenerate-qr"
                  >
                    <QrCode className="w-4 h-4" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}