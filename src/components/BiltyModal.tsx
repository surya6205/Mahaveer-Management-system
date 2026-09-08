import React, { useState } from 'react';
import {
  Printer,
  X,
  Download,
  FileText,
  ArrowLeft,
  Mail,
  Send,
  Copy,
  Check,
  FileCheck,
  Sparkles,
  Navigation,
  Share2,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { LREntry, CompanySettings } from '../types';
import { StorageService } from '../utils/storage';

interface BiltyModalProps {
  lr: LREntry | null;
  onClose: () => void;
  company: CompanySettings;
  onOpenTrackingModal?: (trackingNo: string) => void;
}

export const BiltyModal: React.FC<BiltyModalProps> = ({ lr, onClose, company, onOpenTrackingModal }) => {
  if (!lr) return null;

  const [activeCopy, setActiveCopy] = useState<'ALL' | 'CONSIGNOR' | 'CONSIGNEE' | 'DRIVER'>(
    'ALL'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [termsImageUrl, setTermsImageUrl] = useState<string>(() => company?.termsImageUrl || '');
  const termsFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTermsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setTermsImageUrl(dataUrl);
      try {
        const updated = { ...company, termsImageUrl: dataUrl };
        StorageService.saveCompanySettings(updated);
      } catch (err) {
        console.warn('Could not persist terms image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyMessage, setEmailBodyMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailNoticeMessage, setEmailNoticeMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate a multi-page/single PDF Blob object
  const generateBiltyPDFFileBlob = async (): Promise<{ pdf: jsPDF; fileName: string; file: File; blobUrl: string } | null> => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const copyElements = document.querySelectorAll('.bilty-single-copy-page');
      
      for (let i = 0; i < copyElements.length; i++) {
        const el = copyElements[i] as HTMLElement;
        let dataUrl: string;

        try {
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0,
            scrollY: 0,
          });
          dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        } catch (canvasErr) {
          console.warn('html2canvas failed, trying toPng fallback:', canvasErr);
          dataUrl = await toPng(el, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: false,
          });
        }

        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Bilty image failed to load'));
        });

        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 4;
        const availWidth = pdfWidth - margin * 2;
        const availHeight = pdfHeight - margin * 2;

        const imgRatio = img.width / img.height;
        let renderWidth = availWidth;
        let renderHeight = renderWidth / imgRatio;

        if (renderHeight > availHeight) {
          renderHeight = availHeight;
          renderWidth = renderHeight * imgRatio;
        }

        const xOffset = margin + (availWidth - renderWidth) / 2;
        const yOffset = margin + (availHeight - renderHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
      }

      const fileName = `Bilty_${lr.lrNumber.replace(/\//g, '_')}_3Copies.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      return { pdf, fileName, file, blobUrl };
    } catch (e) {
      console.error('PDF generation error:', e);
      return null;
    }
  };

  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<{ message: string; url?: string; fileName?: string } | null>(null);

  const triggerPDFDownload = (blob: Blob, fileName: string, pdf?: jsPDF) => {
    try {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
          console.warn(e);
        }
      }, 3000);
    } catch (err) {
      console.warn('Standard download failed, applying pdf.save fallback:', err);
      if (pdf) {
        try {
          pdf.save(fileName);
        } catch (pdfErr) {
          console.error('pdf.save failed:', pdfErr);
        }
      }
    }
  };

  const handleDownload3PagePDF = async () => {
    setIsGenerating(true);
    try {
      const data = await generateBiltyPDFFileBlob();
      if (data) {
        const blob = data.pdf.output('blob');
        triggerPDFDownload(blob, data.fileName, data.pdf);
        setDownloadSuccessNotice({
          message: `Bilty PDF "${data.fileName}" आपके कंप्यूटर / Downloads फ़ोल्डर में डाउनलोड हो गया है!`,
          url: data.blobUrl,
          fileName: data.fileName
        });
        setTimeout(() => setDownloadSuccessNotice(null), 12000);
      } else {
        window.print();
      }
    } catch (e) {
      console.error('PDF generation error:', e);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Email Popup for Bilty
  const handleOpenEmailModal = () => {
    setSenderEmail(company?.email || 'manish.jain8619@gmail.com');
    setRecipientEmail('party@client.com');
    setEmailSubject(
      `Lorry Receipt (Bilty 407) - LR No. ${lr.lrNumber} - ${lr.consignorName || lr.partyName} - ${company.companyName}`
    );
    setEmailBodyMessage(
      `Dear ${lr.consignorName || lr.partyName},\n\nPlease find attached the official Lorry Receipt / Bilty (${lr.lrNumber}) for your consignment from ${lr.pickupLocation} to ${lr.deliveryLocation}.\n\nBILTY TRANSPORT METADATA:\n----------------------------------------\n- Bilty / LR No: ${lr.lrNumber}\n- Booking Date: ${lr.bookingDate}\n- From (Pickup): ${lr.pickupLocation}\n- To (Destination): ${lr.deliveryLocation}\n- Consignor: ${lr.consignorName || lr.partyName}\n- Consignee: ${lr.consigneeName || 'BLINK COMMERCE PVT LTD'}\n- Vehicle Number: ${lr.vehicleNumber}\n- Driver Name: ${lr.driverName || 'N/A'}\n- Material: ${lr.material}\n- Total Freight: ₹${lr.freight.toLocaleString('en-IN')}\n- Advance Paid: ₹${lr.advance.toLocaleString('en-IN')}\n- Net Balance Payable: ₹${lr.balance.toLocaleString('en-IN')}\n----------------------------------------\n\nNote: The official 3-Copy Bilty PDF is attached for your records and accounts entry.\n\nBank Account Details:\nAccount Name: ${company.accountHolderName || company.companyName || 'MAHAVEER LOGISTICS'}\nAccount No: ${company.accountNo || '83085733179'}\nIFSC Code: ${company.ifscCode || 'RMGB0000433'}\nBank: ${company.bankName || 'RMGB'}\n${company.bankBranch ? `Branch: ${company.bankBranch}\n` : ''}${company.upiId ? `UPI ID: ${company.upiId}\n` : ''}\nThank you,\n${company.companyName}\nMobile: ${company.phone}`
    );
    setEmailSuccess(false);
    setEmailNoticeMessage('');
    setIsEmailModalOpen(true);
  };

  // Option 1: Gmail Web Compose (Auto downloads PDF + opens Gmail Web)
  const handleSendGmailWeb = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generateBiltyPDFFileBlob();
    if (pdfData) {
      pdfData.pdf.save(pdfData.fileName);
    }

    navigator.clipboard.writeText(emailBodyMessage);
    setCopiedText(true);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientEmail
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyMessage)}`;
    window.open(gmailUrl, '_blank');

    setIsSendingEmail(false);
    setEmailSuccess(true);
    setEmailNoticeMessage(
      `📥 3-Page Bilty PDF auto-downloaded (${pdfData?.fileName || 'Bilty.pdf'})! In Gmail, click 'Attach file' (📎) and select it from your Downloads folder.`
    );
  };

  // Option 2: Outlook Web Compose (Auto downloads PDF + opens Outlook Web)
  const handleSendOutlookWeb = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generateBiltyPDFFileBlob();
    if (pdfData) {
      pdfData.pdf.save(pdfData.fileName);
    }

    navigator.clipboard.writeText(emailBodyMessage);
    setCopiedText(true);

    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
      recipientEmail
    )}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyMessage)}`;
    window.open(outlookUrl, '_blank');

    setIsSendingEmail(false);
    setEmailSuccess(true);
    setEmailNoticeMessage(
      `📥 3-Page Bilty PDF auto-downloaded (${pdfData?.fileName || 'Bilty.pdf'})! In Outlook Web, click 'Attach File' (📎) and select it from your Downloads folder.`
    );
  };

  // Option 3: Windows / Mobile Native Share (Auto attaches PDF directly in Outlook / Mail app if supported)
  const handleSendNativeShare = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generateBiltyPDFFileBlob();
    if (pdfData) {
      pdfData.pdf.save(pdfData.fileName);

      if (navigator.canShare && navigator.canShare({ files: [pdfData.file] })) {
        try {
          await navigator.share({
            title: emailSubject,
            text: emailBodyMessage,
            files: [pdfData.file]
          });
          setIsSendingEmail(false);
          setEmailSuccess(true);
          setEmailNoticeMessage(`✅ Bilty PDF auto-attached directly to Outlook / Windows Mail app!`);
          return;
        } catch (e) {
          console.log('Native share dismissed or fallback:', e);
        }
      }
    }

    // Fallback mailto launcher
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBodyMessage)}`;
    window.location.href = mailtoUrl;

    setIsSendingEmail(false);
    setEmailSuccess(true);
    setEmailNoticeMessage(
      `📥 Bilty PDF saved in Downloads! In your Mail app, attach "${pdfData?.fileName || 'Bilty.pdf'}".`
    );
  };

  // Option 4: Direct Server SMTP Dispatch via Backend
  const handleDirectSMTPSend = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    try {
      const pdfData = await generateBiltyPDFFileBlob();
      let pdfBase64 = '';
      if (pdfData) {
        pdfData.pdf.save(pdfData.fileName);
        pdfBase64 = pdfData.pdf.output('datauristring');
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          from: senderEmail,
          subject: emailSubject,
          text: emailBodyMessage,
          pdfBase64,
          filename: pdfData?.fileName || `Bilty_${lr.lrNumber.replace(/\//g, '_')}_3Copies.pdf`
        })
      });

      const data = await response.json();
      setIsSendingEmail(false);

      if (data.success) {
        setEmailSuccess(true);
        setEmailNoticeMessage(`✅ Email with Bilty PDF attachment sent directly via SMTP to ${recipientEmail}!`);
      } else if (data.requiresSmtpConfig) {
        setEmailSuccess(true);
        setEmailNoticeMessage(
          `📥 Bilty PDF downloaded to Downloads folder! Please click 'Open Gmail Web' or 'Open Outlook Web' button below to attach and send.`
        );
      } else {
        alert(`Email Server Error: ${data.error || 'Failed to send'}`);
      }
    } catch (err: any) {
      console.error('SMTP fetch error:', err);
      setIsSendingEmail(false);
      handleSendGmailWeb();
    }
  };

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(emailBodyMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="bilty-modal-wrapper fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      {/* CSS rules for 3-page Bilty printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          .no-print-app-shell,
          header, nav, sidebar, aside,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          html, body, #root, #root > div {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .bilty-modal-wrapper {
            position: static !important;
            display: block !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
          }
          .bilty-modal-wrapper > div {
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .bilty-single-copy-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 275mm !important;
            max-height: 275mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            padding: 2mm !important;
            margin-bottom: 0 !important;
          }
          .bilty-single-copy-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
        
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="bg-slate-800 px-4 sm:px-6 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm rounded-lg shadow transition-all cursor-pointer"
              title="Go Back / वापस जाएं"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>← Back (वापस)</span>
            </button>

            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span className="text-slate-100 font-bold text-base hidden sm:inline">Lorry Receipt (Bilty)</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-900 text-sky-300 rounded border border-slate-700 font-bold">
                {lr.lrNumber}
              </span>
            </div>
          </div>


          <div className="flex items-center gap-2">
            {/* Copy selector */}
            <div className="hidden sm:flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setActiveCopy('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeCopy === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All 3 Copies
              </button>
              <button
                onClick={() => setActiveCopy('CONSIGNOR')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeCopy === 'CONSIGNOR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Consignor Copy
              </button>
              <button
                onClick={() => setActiveCopy('CONSIGNEE')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeCopy === 'CONSIGNEE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Consignee Copy
              </button>
            </div>

            {/* T&C Image Upload / Toggle Control */}
            <input
              ref={termsFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTermsImageUpload}
            />
            <button
              onClick={() => {
                if (termsImageUrl) {
                  if (window.confirm('Remove custom Terms & Conditions image and revert to formatted text?')) {
                    setTermsImageUrl('');
                    try {
                      StorageService.saveCompanySettings({ ...company, termsImageUrl: '' });
                    } catch (e) {}
                  }
                } else {
                  termsFileInputRef.current?.click();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              title={termsImageUrl ? "Remove custom T&C image" : "Upload Terms & Conditions image to fit in footer blank space"}
            >
              <ImageIcon className="h-4 w-4 text-sky-400" />
              <span className="hidden md:inline">{termsImageUrl ? 'Remove T&C Image' : 'T&C Image Fit'}</span>
            </button>

            {onOpenTrackingModal && (
              <button
                onClick={() => onOpenTrackingModal(lr.lrNumber)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-lg transition-colors shadow-md cursor-pointer"
                title="Google Map Route & Live Tracking Updates"
              >
                <Navigation className="h-4 w-4 text-cyan-300" />
                <span>Live Map Tracking</span>
              </button>
            )}

            <button
              onClick={handleOpenEmailModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4 text-sky-400" />
              <span>Email Bilty</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print 3 Copies</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-rose-300 hover:text-rose-200 border border-slate-600 font-bold text-xs sm:text-sm rounded-lg transition-colors"
              title="Close & Return"
            >
              <X className="h-4 w-4" />
              <span>Close / Back</span>
            </button>
          </div>
        </div>

        {/* Download PDF Success Banner */}
        {downloadSuccessNotice && (
          <div className="bg-emerald-900/95 border-b border-emerald-400/50 p-3 px-6 text-emerald-100 text-xs font-bold flex flex-wrap items-center justify-between gap-3 animate-fadeIn print:hidden shadow-lg">
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <span>✅ {downloadSuccessNotice.message}</span>
            </span>
            <div className="flex items-center gap-3">
              {downloadSuccessNotice.url && (
                <a
                  href={downloadSuccessNotice.url}
                  download={downloadSuccessNotice.fileName || 'Bilty_3Copies.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-400 text-white px-3 py-1 rounded text-xs underline font-semibold cursor-pointer"
                >
                  Direct Open / Save File 📥
                </a>
              )}
              <button
                onClick={() => setDownloadSuccessNotice(null)}
                className="text-emerald-300 hover:text-white p-1 rounded hover:bg-emerald-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bilty Document Printable Area */}
        <div className="p-4 sm:p-6 bg-slate-100 text-slate-900 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:bg-white space-y-6 print:space-y-0">
          
          {(activeCopy === 'ALL' || activeCopy === 'CONSIGNOR') && (
            <div className="bilty-single-copy-page bg-white p-3 rounded-lg border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0">
              <BiltySingleCopy
                lr={lr}
                company={company}
                copyTitle="CONSIGNOR COPY"
                copyColor="border-indigo-700 text-indigo-900 bg-indigo-50/40"
                termsImageUrl={termsImageUrl}
              />
            </div>
          )}

          {(activeCopy === 'ALL' || activeCopy === 'CONSIGNEE') && (
            <div className="bilty-single-copy-page bg-white p-3 rounded-lg border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0">
              <BiltySingleCopy
                lr={lr}
                company={company}
                copyTitle="CONSIGNEE COPY"
                copyColor="border-blue-600 text-blue-800"
                termsImageUrl={termsImageUrl}
              />
            </div>
          )}

          {(activeCopy === 'ALL' || activeCopy === 'DRIVER') && (
            <div className="bilty-single-copy-page bg-white p-3 rounded-lg border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0">
              <BiltySingleCopy
                lr={lr}
                company={company}
                copyTitle="DRIVER / FREIGHT BILL COPY"
                copyColor="border-emerald-600 text-emerald-800"
                termsImageUrl={termsImageUrl}
              />
            </div>
          )}

        </div>

      {/* Email Dispatch Modal for Bilty */}
      {isEmailModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsEmailModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 print:hidden"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Email Bilty LR ({lr.lrNumber})</h3>
                  <p className="text-[11px] text-slate-400">Directly email 3-Copy Bilty PDF to party email</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Attachment Explanation Banner */}
              <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 font-bold text-sky-300">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>3-Page Bilty PDF Attachment (`Bilty_${lr.lrNumber.replace(/\//g, '_')}_3Copies.pdf`)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload3PagePDF}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded flex items-center gap-1 shadow cursor-pointer shrink-0"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save PDF</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  💡 <strong>Direct Email Tip:</strong> Browsers automatically download the PDF file when you click any email option below. In Outlook or Gmail, click <strong>Attach (📎)</strong> and select the downloaded PDF from your <strong>Downloads</strong> folder.
                </p>
              </div>

              {/* Sender & Recipient Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Sender Email (From)</span>
                    <span className="text-[10px] text-indigo-400 font-normal">Company Email</span>
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. manish.jain8619@gmail.com"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Party Email (To)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Customer Email</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. accounts@party.com"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Sender & Receiver Info Banner */}
              <div className="p-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Sending From:</span>
                  <strong className="text-sky-300 font-mono">{company?.companyName || 'MAHAVEER LOGISTICS'} &lt;{senderEmail}&gt;</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Sending To:</span>
                  <strong className="text-emerald-300 font-mono">{recipientEmail || 'N/A'}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bilty Message & Details</label>
                <textarea
                  rows={4}
                  value={emailBodyMessage}
                  onChange={(e) => setEmailBodyMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Success / Status Notice Banner */}
              {emailSuccess && emailNoticeMessage && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Email Action Triggered Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-100 leading-normal">{emailNoticeMessage}</p>
                </div>
              )}
            </div>

            {/* Email Dispatch Buttons Grid */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select How You Want To Send:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Gmail Web */}
                <button
                  type="button"
                  onClick={handleSendGmailWeb}
                  disabled={isSendingEmail}
                  className="px-2.5 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow"
                  title="Auto downloads PDF & opens Gmail Web compose"
                >
                  <Mail className="h-4 w-4 text-red-400" />
                  <span>Open Gmail Web</span>
                </button>

                {/* Outlook Web */}
                <button
                  type="button"
                  onClick={handleSendOutlookWeb}
                  disabled={isSendingEmail}
                  className="px-2.5 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow"
                  title="Auto downloads PDF & opens Outlook Web compose"
                >
                  <ExternalLink className="h-4 w-4 text-sky-400" />
                  <span>Open Outlook Web</span>
                </button>

                {/* Native Mail App / Share */}
                <button
                  type="button"
                  onClick={handleSendNativeShare}
                  disabled={isSendingEmail}
                  className="px-2.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow"
                  title="Directly attaches PDF via Windows Outlook / Mail App Share"
                >
                  <Share2 className="h-4 w-4 text-blue-400" />
                  <span>Outlook App (Direct)</span>
                </button>

                {/* SMTP Background Send */}
                <button
                  type="button"
                  onClick={handleDirectSMTPSend}
                  disabled={isSendingEmail}
                  className="px-2.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold rounded-xl text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow"
                  title="Send directly over network via SMTP server"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                  <span>{isSendingEmail ? 'Sending...' : 'Direct Server Email'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleCopyEmailText}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{copiedText ? 'Text Copied!' : 'Copy Body Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};

// Number to words converter for values of goods / freight
const numberToWords = (num: number): string => {
  if (!num || isNaN(num)) return 'ZERO RUPEES ONLY';
  const a = [
    '', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ',
    'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '
  ];
  const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + (n % 100 !== 0 ? 'AND ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'THOUSAND ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'LAKH ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'CRORE ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  return inWords(Math.round(num)).trim() + ' RUPEES ONLY';
};

interface BiltySingleCopyProps {
  lr: LREntry;
  company: CompanySettings;
  copyTitle: string;
  copyColor: string;
  termsImageUrl?: string;
}

const BiltySingleCopy: React.FC<BiltySingleCopyProps> = ({
  lr,
  company,
  copyTitle,
  copyColor,
  termsImageUrl
}) => {
  const freightValue = lr.freight || 0;
  const advanceValue = lr.advance || 0;
  const balanceValue = lr.balance !== undefined ? lr.balance : (freightValue - advanceValue);

  return (
    <div className="border-2 border-black p-3 font-sans text-[11px] leading-tight text-black bg-white space-y-2 select-none">
      
      {/* Top Header Section */}
      <div className="border-b-2 border-black pb-1.5">
        <div className="text-center font-bold text-[10px] uppercase tracking-wider text-slate-800 border-b border-black pb-0.5 mb-1">
          SUBJECT TO LOCAL JURISDICTION
        </div>

        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.companyName || 'Company Logo'}
                className="h-14 w-auto max-w-[110px] object-contain rounded border border-slate-300 p-0.5 bg-white shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                {company.companyName || 'MAHAVEER LOGISTICS'}
              </h1>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                {company.tagline || 'FLEET OWNER / TRANSPORT CONTRACTOR / COMMISSION AGENT'}
              </p>
              <p className="text-[10px] text-slate-700">
                {company.address || '3 NEW COLONY NEAR PHANCHYAT SAMITHI JHOTWARA JAIPUR, JAIPUR, RAJASTHAN'}
              </p>
              <p className="text-[10px] font-semibold text-slate-900">
                Transport Reg No.: {lr.id.slice(-6).toUpperCase()} | Email: {company.email || 'manish.jain8619@gmail.com'} | Mob: {company.phone || '9782162010 / 8386862130'}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1 shrink-0">
            <span className={`px-2.5 py-1 border-2 font-black text-xs uppercase inline-block rounded ${copyColor}`}>
              {copyTitle}
            </span>
            <div className="text-[10px] font-mono font-bold text-slate-900">
              PAN NO: <span className="font-extrabold">{company.panNo || 'AJAPJ9522F'}</span>
            </div>
            <div className="text-[10px] font-mono font-bold text-slate-900">
              GSTIN: <span className="font-extrabold">{company.gstNo || '08AJAPJ9522F1ZC'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3-Column Info Box: Demurrage/Notice | Insurance/Caution | Route & Bilty Details */}
      <div className="grid grid-cols-12 border-2 border-black divide-x-2 divide-black text-[10px]">
        {/* Col 1: Schedule of Demurrage & Notice */}
        <div className="col-span-4 p-1.5 space-y-1">
          <div className="font-extrabold border-b border-black pb-0.5 uppercase text-slate-900 text-[9px]">
            SCHEDULE OF DEMURRAGE
          </div>
          <p className="text-[9px] text-slate-800">
            Demurrage Chargeable After arrival Rs. <span className="font-bold underline">As Applicable</span>
          </p>
          <div className="font-extrabold border-b border-black pt-1 pb-0.5 uppercase text-slate-900 text-[9px]">
            NOTICE
          </div>
          <p className="text-[9px] text-slate-700 leading-tight">
            We are sending Vehicle no <strong className="font-mono text-black">{lr.vehicleNumber || 'As Assigned'}</strong> as per your order. Please arrange to load the same and check up yourself all papers of the vehicle before loading. You are requested to insure the goods.
          </p>
        </div>

        {/* Col 2: Insurance & At Owner Risk Caution */}
        <div className="col-span-4 p-1.5 space-y-1">
          <div className="font-extrabold border-b border-black pb-0.5 uppercase text-slate-900 text-[9px]">
            INSURANCE
          </div>
          <div className="text-[9px] text-slate-800 space-y-0.5">
            <div>STATUS: <strong className="text-black">NON INSURED</strong></div>
            <div>POLICY NO: <span className="text-slate-600">N/A</span> | RISK: <strong className="text-black">AT OWNER RISK</strong></div>
          </div>
          <div className="font-extrabold border-b border-black pt-1 pb-0.5 uppercase text-rose-900 text-[9px]">
            AT OWNER RISK CAUTION
          </div>
          <p className="text-[8.5px] text-slate-700 leading-tight">
            This consignment will not be Detained, re-route, diverted or re-book without consignees / consignor bank written permission. It will be delivered at destination.
          </p>
        </div>

        {/* Col 3: Bilty Metadata & Route */}
        <div className="col-span-4 p-1.5 space-y-1 bg-slate-50/80">
          <div className="flex justify-between items-center border-b border-black pb-0.5">
            <span className="font-extrabold text-[10px] uppercase">BILTY NO:</span>
            <span className="font-mono font-black text-rose-700 text-xs">{lr.lrNumber}</span>
          </div>
          {lr.invoiceNumber && (
            <div className="flex justify-between items-center border-b border-black pb-0.5">
              <span className="font-extrabold text-[10px] uppercase">INVOICE NO:</span>
              <span className="font-mono font-black text-blue-800 text-xs">{lr.invoiceNumber}</span>
            </div>
          )}
          {lr.trackingNumber && (
            <div className="flex justify-between items-center border-b border-black pb-0.5">
              <span className="font-extrabold text-[10px] uppercase">TRACKING NO:</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{lr.trackingNumber}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-black pb-0.5">
            <span className="font-extrabold text-[10px] uppercase">VEHICLE NUMBER:</span>
            <span className="font-mono font-black text-slate-900 text-xs">{lr.vehicleNumber || 'N/A (NOT ASSIGNED)'}</span>
          </div>
          <div className="flex justify-between items-center text-[9.5px]">
            <span>DATE: <strong className="font-mono">{lr.bookingDate}</strong></span>
            <span>SEAL NO: <strong className="font-mono text-slate-700">N/A</strong></span>
          </div>
          <div className="border-t border-black pt-1 space-y-0.5">
            <div className="text-[9px] text-slate-700">
              DELIVERY ADDRESS: <span className="font-semibold text-black">{lr.consigneeAddress || lr.deliveryLocation}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-0.5 text-center font-bold border-t border-slate-300">
              <div className="bg-slate-200/80 p-0.5 border border-slate-400 rounded">
                <span className="block text-[8px] text-slate-600 uppercase font-semibold">From</span>
                <span className="text-black uppercase text-[10px]">{lr.pickupLocation}</span>
              </div>
              <div className="bg-slate-200/80 p-0.5 border border-slate-400 rounded">
                <span className="block text-[8px] text-slate-600 uppercase font-semibold">To</span>
                <span className="text-black uppercase text-[10px]">{lr.deliveryLocation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consignor, Consignee & Invoice Metadata (3 Column Box) */}
      <div className="grid grid-cols-12 border-2 border-black divide-x-2 divide-black text-[10px]">
        {/* Consignor */}
        <div className="col-span-4 p-1.5 space-y-0.5">
          <div className="font-extrabold uppercase text-[9px] text-slate-900 border-b border-black pb-0.5">
            CONSIGNOR'S DETAILS (SHIPPER)
          </div>
          <div className="font-bold text-black text-[11px]">{lr.consignorName || lr.partyName}</div>
          <div className="text-[9.5px] text-slate-800">{lr.consignorAddress || 'Rajdhani Mandi Yard, Sikar Road Jaipur'}</div>
          <div className="text-[9px] text-slate-700 pt-0.5">
            GSTIN: <strong className="font-mono text-black">{company.gstNo || '08AAFCP0623G1ZP'}</strong> | CONTACT: <strong className="font-mono">{company.phone || '9214033586'}</strong>
          </div>
        </div>

        {/* Consignee */}
        <div className="col-span-4 p-1.5 space-y-0.5">
          <div className="font-extrabold uppercase text-[9px] text-slate-900 border-b border-black pb-0.5">
            CONSIGNEE'S / BUYER'S DETAILS
          </div>
          <div className="font-bold text-black text-[11px]">{lr.consigneeName || 'BLINK COMMERCE PVT LTD'}</div>
          <div className="text-[9.5px] text-slate-800">{lr.consigneeAddress || 'Nandagudi Hobli Hoskote, Bangalore Rural, Karnataka'}</div>
          <div className="text-[9px] text-slate-700 pt-0.5">
            EXPECTED DELIVERY: <strong className="text-black">{lr.deliveryDate || 'Direct Transport'}</strong>
          </div>
        </div>

        {/* Bill & Driver Info */}
        <div className="col-span-4 p-1.5 space-y-0.5 bg-slate-50/50">
          <div className="font-extrabold uppercase text-[9px] text-slate-900 border-b border-black pb-0.5">
            BILL / INVOICE & DRIVER INFO
          </div>
          <div className="grid grid-cols-2 gap-x-1 text-[9px] text-slate-800">
            <div>BILTY NO: <strong className="font-mono text-black">{lr.lrNumber}</strong></div>
            <div>INVOICE NO: <strong className="font-mono text-blue-900 font-bold">{lr.invoiceNumber || 'N/A'}</strong></div>
            <div>DATE: <strong className="font-mono text-black">{lr.bookingDate}</strong></div>
            <div>DRIVER: <strong className="text-black">{lr.driverName || 'N/A'}</strong></div>
            <div>PHONE: <strong className="font-mono text-black">{lr.driverMobile || 'N/A'}</strong></div>
            <div>TRUCK: <strong className="font-mono text-black">{lr.vehicleNumber || 'N/A'}</strong></div>
            <div className="col-span-2 border-t border-slate-300 pt-0.5 mt-0.5">
              TRANSPORTER: <strong className="text-black">{company.companyName || 'MAHAVEER LOGISTICS'}</strong> ({company.phone})
            </div>
          </div>
        </div>
      </div>

      {/* Main Particulars & Freight Charges Table */}
      <table className="w-full border-2 border-black border-collapse text-left text-[10px]">
        <thead className="bg-slate-200 text-black font-extrabold uppercase border-b-2 border-black">
          <tr>
            <th className="border border-black p-1 text-center w-16">PACKAGING</th>
            <th className="border border-black p-1 text-center w-12">QTY</th>
            <th className="border border-black p-1">MATERIAL NAME & DESCRIPTION</th>
            <th className="border border-black p-1 text-center w-16">HSN CODE</th>
            <th className="border border-black p-1 text-center w-28">WEIGHT (ACT / CHG)</th>
            <th className="border border-black p-1 text-center w-20">RATE / KG</th>
            <th className="border border-black p-1 text-right w-28">FREIGHT AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y border-b-2 border-black">
          <tr className="align-top">
            <td className="border border-black p-1.5 text-center font-bold">
              {lr.noOfBoxes ? `${lr.noOfBoxes} Boxes` : 'C BOX'}
            </td>
            <td className="border border-black p-1.5 text-center font-extrabold text-xs">
              {lr.quantity || '1'}
            </td>
            <td className="border border-black p-1.5 font-semibold text-slate-900 space-y-0.5">
              <div className="font-extrabold text-black uppercase">{lr.material}</div>
              {lr.invoiceNumber && (
                <div className="text-[9px] font-mono text-blue-900 font-bold">
                  Party Invoice No: {lr.invoiceNumber} {lr.invoiceValue ? `(Value: ₹${lr.invoiceValue.toLocaleString('en-IN')})` : ''}
                </div>
              )}
              {lr.fixedRate ? (
                <div className="text-[8px] font-bold text-slate-900 bg-slate-100 p-0.5 border border-slate-300 rounded inline-block">
                  BILLING TYPE: <span className="font-black">FIXED RATE CONTRACT (₹{lr.fixedRate.toLocaleString('en-IN')})</span>
                </div>
              ) : null}
              <div className="text-[8.5px] text-slate-600">
                Remarks: {lr.remarks || 'Standard transport consignment'}
              </div>
            </td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">
              9965
            </td>
            <td className="border border-black p-1.5 text-center font-bold space-y-0.5">
              <div className="text-black">{lr.chargedWeight || lr.actualWeight || lr.weight} {lr.weightUnit || 'Kg'}</div>
              <div className="text-[8.5px] text-slate-600 font-normal">Act Wt: {lr.actualWeight || lr.weight} {lr.weightUnit || 'Kg'}</div>
              <div className="text-[8.5px] text-amber-900 font-bold">Chg Wt: {lr.chargedWeight || lr.actualWeight || lr.weight} {lr.weightUnit || 'Kg'}</div>
            </td>
            <td className="border border-black p-1.5 text-center font-bold font-mono">
              {lr.fixedRate ? (
                <div className="space-y-0.5">
                  <div className="text-black font-black text-[11px]">₹{lr.fixedRate.toLocaleString('en-IN')}</div>
                  <div className="text-[7.5px] bg-black text-white px-1 py-0.5 rounded font-black tracking-wider">
                    FIXED RATE
                  </div>
                </div>
              ) : (
                <div>₹{freightValue.toLocaleString('en-IN')} FIXED</div>
              )}
            </td>
            <td className="border border-black p-1 text-right space-y-0.5 font-mono text-[9px]">
              <div className="flex justify-between">
                <span>{lr.fixedRate ? 'FIXED FREIGHT:' : 'FREIGHT (TAXABLE):'}</span>
                <strong className="font-bold text-black">₹{freightValue.toLocaleString('en-IN')}</strong>
              </div>
              {lr.handlingCharge ? (
                <div className="flex justify-between text-[8.5px] text-slate-700">
                  <span>HANDLING CHG:</span>
                  <span>₹{Number(lr.handlingCharge).toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              {lr.otherCharges ? (
                <div className="flex justify-between text-[8.5px] text-slate-700">
                  <span>OTHER CHG:</span>
                  <span>₹{Number(lr.otherCharges).toLocaleString('en-IN')}</span>
                </div>
              ) : (
                !lr.handlingCharge && (
                  <div className="flex justify-between text-[8.5px] text-slate-700">
                    <span>HALTING / OTHER:</span>
                    <span>₹0.00</span>
                  </div>
                )
              )}
              {lr.gstPercent && lr.gstPercent > 0 ? (
                <>
                  {lr.gstType === 'IGST' ? (
                    <div className="flex justify-between text-[8.5px] text-blue-900 font-semibold">
                      <span>IGST ({lr.igstPercent || lr.gstPercent}%):</span>
                      <span>₹{(lr.igstAmount !== undefined ? lr.igstAmount : Math.round(freightValue * (lr.gstPercent / 100) * 100) / 100).toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[8.5px] text-blue-900 font-semibold">
                        <span>CGST ({lr.cgstPercent !== undefined ? lr.cgstPercent : (lr.gstPercent / 2)}%):</span>
                        <span>₹{(lr.cgstAmount !== undefined ? lr.cgstAmount : Math.round(freightValue * ((lr.gstPercent / 2) / 100) * 100) / 100).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[8.5px] text-blue-900 font-semibold">
                        <span>SGST ({lr.sgstPercent !== undefined ? lr.sgstPercent : (lr.gstPercent / 2)}%):</span>
                        <span>₹{(lr.sgstAmount !== undefined ? lr.sgstAmount : Math.round(freightValue * ((lr.gstPercent / 2) / 100) * 100) / 100).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-[9.5px] font-extrabold text-black border-t border-black pt-0.5">
                    <span>TOTAL (INC GST):</span>
                    <span>₹{(lr.totalWithGst !== undefined ? lr.totalWithGst : Math.round((freightValue + (lr.gstAmount || (freightValue * (lr.gstPercent / 100)))) * 100) / 100).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-[8.5px] text-slate-600">
                    <span>GST (0% / RCM GTA):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-[9.5px] font-extrabold text-black border-t border-black pt-0.5">
                    <span>TOTAL FREIGHT:</span>
                    <span>₹{freightValue.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-[8.5px] text-emerald-800 font-bold">
                <span>ADVANCE PAID:</span>
                <span>₹{advanceValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-rose-800 border-t border-black pt-0.5 bg-rose-50/60 p-0.5 rounded">
                <span>BALANCE DUE:</span>
                <span>₹{balanceValue.toLocaleString('en-IN')}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bottom Row: Receiving Box | Bank Account Details | Signatures */}
      <div className="grid grid-cols-12 border-2 border-black divide-x-2 divide-black text-[9.5px]">
        {/* Receiving Use Only */}
        <div className="col-span-4 p-1.5 space-y-1">
          <div className="font-extrabold uppercase border-b border-black pb-0.5 text-slate-900 text-[9px]">
            RECEIVING USE ONLY
          </div>
          <div className="space-y-1 text-slate-800 font-medium">
            <div>RECEIVER NAME: <span className="inline-block w-28 border-b border-dashed border-slate-500"></span></div>
            <div>RECEIVER PHONE: <span className="inline-block w-28 border-b border-dashed border-slate-500"></span></div>
            <div className="pt-2 text-center border-t border-slate-300 mt-2">
              <span className="block text-[8px] text-slate-500 font-bold uppercase">RECEIVER SIGN & STAMP</span>
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="col-span-4 p-1.5 space-y-0.5 bg-slate-50/50">
          <div className="font-extrabold uppercase border-b border-black pb-0.5 text-slate-900 text-[9px]">
            BANK ACCOUNT DETAILS
          </div>
          <div className="font-mono text-[9px] space-y-0.5 text-slate-900">
            <div>BANK A/C NO: <strong className="font-extrabold text-black">{company.accountNo || '83085733179'}</strong></div>
            <div>IFSC CODE: <strong className="font-extrabold text-black">{company.ifscCode || 'RMGB0000433'}</strong></div>
            <div>A/C HOLDER: <strong className="font-bold">{company.accountHolderName || company.companyName || 'MAHAVEER LOGISTICS'}</strong></div>
            <div>BANK NAME: <strong>{company.bankName || 'RMGB'}</strong></div>
            <div>PAN NO: <strong className="font-bold">{company.panNo || 'AJAPJ9522F'}</strong></div>
            {company.bankBranch && <div>BRANCH: <span className="text-slate-700">{company.bankBranch}</span></div>}
            {company.upiId && <div>UPI: <strong className="font-mono text-emerald-800">{company.upiId}</strong></div>}
          </div>
        </div>

        {/* Values of Goods & Signature Box */}
        <div className="col-span-4 p-1.5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="font-extrabold text-[8.5px] uppercase text-slate-800 border-b border-slate-300 pb-0.5">
              VALUES OF FREIGHT / GOODS
            </div>
            <div className="font-extrabold text-[9px] text-slate-900">
              ₹{freightValue.toLocaleString('en-IN')} (<span className="text-black font-black uppercase text-[8px]">{numberToWords(freightValue)}</span>)
            </div>
          </div>

          <div className="text-center border-t border-black pt-1 mt-1">
            <span className="text-[8.5px] font-bold text-slate-900 uppercase block tracking-wider">
              FOR, {company.companyName || 'MAHAVEER LOGISTICS'}
            </span>
            {/* Professional M. Jain Digital Signature */}
            <div className="my-0.5 flex flex-col items-center justify-center">
              <div className="relative inline-flex flex-col items-center px-2 py-0.5">
                <svg
                  viewBox="0 0 160 44"
                  className="h-7 w-28 text-blue-900 fill-none stroke-current"
                  style={{ strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                >
                  {/* Calligraphic M */}
                  <path d="M 12 34 C 14 18, 18 10, 22 8 C 25 6, 28 14, 32 24 C 35 16, 40 8, 44 8 C 48 8, 49 18, 48 32" />
                  <circle cx="53" cy="32" r="1.5" className="fill-blue-900" />
                  {/* J with descent loop */}
                  <path d="M 64 12 C 67 10, 72 10, 72 14 C 72 24, 70 36, 66 42 C 62 46, 56 43, 58 37 C 60 32, 68 27, 76 25" />
                  <circle cx="69" cy="7" r="1.5" className="fill-blue-900" />
                  {/* a */}
                  <path d="M 82 26 C 78 26, 76 29, 77 32 C 78 35, 82 35, 84 32 C 85 29, 85 23, 85 33" />
                  {/* i */}
                  <path d="M 89 25 L 89 33" />
                  <circle cx="89" cy="21" r="1.2" className="fill-blue-900" />
                  {/* n with closing flourish underline */}
                  <path d="M 94 25 L 94 33 C 94 33, 96 26, 100 26 C 104 26, 104 31, 105 33 C 108 32, 120 27, 138 27 C 145 27, 125 36, 92 37" />
                </svg>
                <div className="flex items-center gap-1 -mt-1">
                  <span className="text-[7.5px] font-sans font-black text-blue-950 uppercase tracking-wider">
                    M. Jain
                  </span>
                  <span className="text-[6.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-1 rounded-sm font-semibold">
                    ✓ DIGITALLY SIGNED
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[7.5px] font-extrabold text-slate-900 uppercase block border-t border-slate-300 pt-0.5">
              AUTHORIZED SIGNATURE
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Section (Transporter Agreement - Formatted to fit single A4 page with zero overflow) */}
      <div className="border border-black p-1 text-[6.5px] leading-[1.15] text-slate-900 bg-white overflow-hidden max-h-[125px]">
        {termsImageUrl ? (
          <div className="w-full flex flex-col items-center justify-center">
            <div className="text-center font-black uppercase text-[7px] tracking-wider border-b border-black pb-0.5 mb-1 w-full text-black flex items-center justify-between">
              <span>TERMS & CONDITIONS</span>
              <span className="font-bold text-[6.5px]">नियम एवं शर्तें (Transporter Agreement)</span>
              <span>SUBJECT TO LOCAL JURISDICTION</span>
            </div>
            <img
              src={termsImageUrl}
              alt="Terms & Conditions"
              className="max-h-[105px] w-auto max-w-full object-contain mx-auto"
            />
          </div>
        ) : (
          <>
            <div className="text-center font-black uppercase text-[7px] tracking-wider border-b border-black pb-0.5 mb-0.5 text-black flex items-center justify-between">
              <span>TERMS & CONDITIONS</span>
              <span className="font-bold text-[6.5px]">नियम एवं शर्तें (Transporter Agreement)</span>
              <span>SUBJECT TO LOCAL JURISDICTION</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div className="space-y-0.5 text-justify">
                <p><strong>1)</strong> The Transport Operator hereby agrees to hold itself liable directly to the bank concerned, as if the Bank was a party, of the contract contained with right of recourse against the Operator, the full value goods handed over for carriage, storage and Delivery, should a Bank accept this lorry Receipt as a consignee / endorsee or in any other capacity for the purpose of providing advances and / or collection or discounting of bills of its customer, before or after the Transport Operator has been entrusted the goods.</p>
                <p><strong>2)</strong> The Transport Operator undertakes to deliver the goods in the same order and condition as received. The lorry receipt being surrendered to the bank, to its order, or to its assigns, has accepted it for lending and to the collection or discounting of bills of its customers or for collection or to its agents. Only the bank and the holder of the receipt entitled to the delivery as aforesaid shall have the right of recourse against the operator for any and all claims arising thereon.</p>
                <p><strong>3)</strong> The right to entrust goods to any other lorry or service for transport of goods shall be with the Transport Operator. If the goods are entrusted by the transport operator to another entity, the other entity shall be considered the transport operator's agent, and the transport operator, notwithstanding the delivery of goods, the operator will be responsible for the safety of the goods and for their delivery at the destination by the hands of the other carrier referred to as the Transport Operator's agent.</p>
                <p><strong>4)</strong> The consignor is the primary payer of all transport and incidental charges, if any, payable to the Transport Operator at their agreed location.</p>
                <p><strong>5)</strong> Perishable goods lying undelivered after 48 hours of arrival can be disposed of by the Transport Operator's discretion without prior notice thereof.</p>
                <p><strong>6)</strong> Goods lying undelivered can be disposed off by the Transport Operator after 30 days of arrival after delivery to the consignor, bank, and the holder interested with a 15-day notice of such disposal of goods.</p>
                <p><strong>7)</strong> In either of the case mentioned above, the bank or the relevant authority shall be entitled to the proceeds and the Transport Operator is to render full accounts immediately after sale deducting freight and demurrage.</p>
              </div>
              <div className="space-y-0.5 text-justify">
                <p><strong>8)</strong> The Consignee Bank accepting Lorry Receipt under clause 1 above will not be liable for payment of any charges arising out of any lien of the transport Operator against the consignor or the buyer. The Transport Operator shall deliver the goods unconditionally to the Bank on payment of the normal freight and storage charges only in connection with the consignment in question, without claiming any lien on the goods in respect of any monies due by the consignor or the consignee to the Transport Operator on any other account whatsoever.</p>
                <p><strong>9)</strong> Any statement made in this lorry receipt or at any time in a circumstance regarding this receipt, the Transport Operator shall observe its obligation to the Consignee bank mentioned and will be responsible for safe and due delivery, and for any loss or damage to the goods or consignment, that arises as a result of negligence, default, failure to take reasonable precautions, maladies or criminal or fraudulent actions of the Transport Operator or any of his Managers, Agents, Employees, Partners, Directors, Business Associates, Branches etc.</p>
                <p><strong>10)</strong> The consignor is responsible for all consequences of any incorrect or false declaration.</p>
                <p><strong>11)</strong> The consignment shall not be detained, re-routed, re-booked without the consignee's written and explicit permission. Will be delivered at the destination.</p>
                <p><strong>12)</strong> In case any dispute or difference arises between the parties with regard to the terms and conditions of this agreement or relating to the interpretation thereof and which could not be solved with mutual understanding then both parties require to approach the local jurisdiction selected by transporter to resolve the same with legal procedure.</p>
                <p><strong>13)</strong> Consignor/Consignee should have insured their goods. In case of any accident, natural damage or deterioration either the compensation shall be paid by the Party or Insurance Company should settle the amount.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Legal Note */}
      <div className="text-[8px] text-center text-slate-600 font-mono border-t border-slate-400 pt-0.5 flex justify-between items-center">
        <span>BRANCH OFFICE: {company.address || '3 NEW COLONY NEAR PHANCHYAT SAMITHI JHOTWARA JAIPUR'}</span>
        <span>This electronic generated Bilty PDF does not require physical signature.</span>
      </div>

    </div>
  );
};
