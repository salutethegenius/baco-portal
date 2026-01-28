import PDFDocument from 'pdfkit';
import { SupabaseStorageService } from './awsStorage';

const storageService = new SupabaseStorageService();

export interface TextPositionConfig {
  name?: { x: number; y: number; fontSize?: number; color?: string };
  date?: { x: number; y: number; fontSize?: number; color?: string };
  cpdHours?: { x: number; y: number; fontSize?: number; color?: string };
  logo?: { x: number; y: number; width?: number; height?: number };
}

export async function generateCertificatePDF(options: {
  templateImagePath: string;
  name: string;
  date: string;
  logoPath?: string;
  cpdHours: number;
  textConfig?: TextPositionConfig;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Download template image from storage
      const templateImageUrl = storageService.getPublicURL(options.templateImagePath);
      const imageResponse = await fetch(templateImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch template image: ${imageResponse.statusText}`);
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Create PDF document
      const doc = new PDFDocument({
        size: [792, 612], // Standard US Letter landscape (11x8.5 inches)
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Default text positions (centered, can be overridden by textConfig)
      const defaultConfig: TextPositionConfig = {
        name: { x: 396, y: 250, fontSize: 32, color: '#000000' },
        date: { x: 396, y: 320, fontSize: 18, color: '#000000' },
        cpdHours: { x: 396, y: 360, fontSize: 20, color: '#000000' },
      };

      const config = { ...defaultConfig, ...options.textConfig };

      // Add template image as background
      doc.image(imageBuffer, 0, 0, { width: 792, height: 612, fit: [792, 612] });

      // Add logo if provided
      if (options.logoPath) {
        try {
          const logoUrl = storageService.getPublicURL(options.logoPath);
          const logoResponse = await fetch(logoUrl);
          if (logoResponse.ok) {
            const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
            const logoConfig = config.logo || { x: 50, y: 50, width: 100, height: 100 };
            doc.image(logoBuffer, logoConfig.x, logoConfig.y, {
              width: logoConfig.width || 100,
              height: logoConfig.height || 100,
            });
          }
        } catch (error) {
          console.warn('Failed to load logo:', error);
        }
      }

      // Add name
      if (config.name) {
        doc.fontSize(config.name.fontSize || 32)
          .fillColor(config.name.color || '#000000')
          .text(options.name, config.name.x, config.name.y, {
            align: 'center',
            width: 500,
          });
      }

      // Add date
      if (config.date) {
        doc.fontSize(config.date.fontSize || 18)
          .fillColor(config.date.color || '#000000')
          .text(options.date, config.date.x, config.date.y, {
            align: 'center',
            width: 500,
          });
      }

      // Add CPD hours
      if (config.cpdHours) {
        doc.fontSize(config.cpdHours.fontSize || 20)
          .fillColor(config.cpdHours.color || '#000000')
          .text(`${options.cpdHours} CPD Hours`, config.cpdHours.x, config.cpdHours.y, {
            align: 'center',
            width: 500,
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateInvoicePDF(options: {
  invoiceNumber: string;
  memberName: string;
  memberEmail: string;
  companyName?: string;
  companyEmail?: string;
  placeOfEmployment?: string;
  amount: number;
  description: string;
  date: Date;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // BACO Branded Header
      doc.fillColor('#40E0D0')
        .rect(0, 0, 612, 100)
        .fill();

      doc.fillColor('#000000')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('BACO', 50, 30)
        .fontSize(12)
        .font('Helvetica')
        .text('Bahamas Association of Compliance Officers', 50, 60);

      // Invoice Title
      doc.fillColor('#000000')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 120);

      // Invoice Details
      let yPos = 180;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Invoice Number:', 50, yPos)
        .fillColor('#000000')
        .text(options.invoiceNumber, 150, yPos);

      yPos += 20;
      doc.fillColor('#666666')
        .text('Date:', 50, yPos)
        .fillColor('#000000')
        .text(options.date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }), 150, yPos);

      // Member Information
      yPos += 40;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Bill To:', 50, yPos);

      yPos += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .text(options.memberName, 50, yPos);

      yPos += 15;
      doc.text(options.memberEmail, 50, yPos);

      if (options.placeOfEmployment) {
        yPos += 15;
        doc.text(options.placeOfEmployment, 50, yPos);
      }

      if (options.companyName) {
        yPos += 15;
        doc.text(options.companyName, 50, yPos);
      }

      if (options.companyEmail) {
        yPos += 15;
        doc.text(options.companyEmail, 50, yPos);
      }

      // Invoice Items
      yPos += 40;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Description', 50, yPos)
        .text('Amount', 450, yPos, { align: 'right' });

      yPos += 5;
      doc.moveTo(50, yPos)
        .lineTo(562, yPos)
        .stroke();

      yPos += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .text(options.description, 50, yPos, { width: 400 })
        .text(`$${options.amount.toFixed(2)}`, 450, yPos, { align: 'right' });

      yPos += 5;
      doc.moveTo(50, yPos)
        .lineTo(562, yPos)
        .stroke();

      // Total
      yPos += 20;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Total:', 400, yPos)
        .text(`$${options.amount.toFixed(2)}`, 450, yPos, { align: 'right' });

      // Footer
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 100;

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Thank you for your business!', 50, footerY, { align: 'center' })
        .text('Bahamas Association of Compliance Officers', 50, footerY + 15, { align: 'center' })
        .text('This is an official invoice from BACO.', 50, footerY + 30, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
