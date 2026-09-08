import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Mail,
  Send,
  Download,
  Copy,
  Check,
  Building,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Paperclip,
  ArrowLeft,
  FileSpreadsheet,
  ExternalLink,
  Share2,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { LREntry, Customer, CompanySettings, SavedMonthlyInvoice } from '../types';
import { exportMonthlyBiltyToExcel } from '../utils/excelExport';
import { StorageService } from '../utils/storage';

interface MonthlyTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lrEntries: LREntry[];
  customers: Customer[];
  company: CompanySettings;
  initialPartyId?: string;
  initialMonthYear?: string; // YYYY-MM e.g. "2026-07"
  onSaveMonthlyInvoice?: (invoice: SavedMonthlyInvoice) => void;
}

// Utility: Number to Indian Rupees Words
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Zero rupees only.';

  const a = [
    '',
    'one ',
    'two ',
    'three ',
    'four ',
    'five ',
    'six ',
    'seven ',
    'eight ',
    'nine ',
    'ten ',
    'eleven ',
    'twelve ',
    'thirteen ',
    'fourteen ',
    'fifteen ',
    'sixteen ',
    'seventeen ',
    'eighteen ',
    'nineteen '
  ];
  const b = ['', '', 'twenty ', 'thirty ', 'forty ', 'fifty ', 'sixty ', 'seventy ', 'eighty ', 'ninety '];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000)
      return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + 'thousands ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + 'lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let words = inWords(integerPart).trim();
  if (!words) words = 'zero';
  words = words.charAt(0).toUpperCase() + words.slice(1);

  if (decimalPart > 0) {
    return `${words} rupees and ${inWords(decimalPart).trim()} paise only.`;
  }
  return `${words} rupees only.`;
}

export const MonthlyTaxInvoiceModal: React.FC<MonthlyTaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  lrEntries,
  customers,
  company,
  initialPartyId = '',
  initialMonthYear = '2026-07',
  onSaveMonthlyInvoice
}) => {
  if (!isOpen) return null;

  const printableRef = useRef<HTMLDivElement>(null);

  // Selected customer
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialPartyId || (customers[0]?.id || '')
  );

  // Period filter type: 'MONTHLY' | '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'FINANCIAL_YEAR' | 'CUSTOM'
  const [periodType, setPeriodType] = useState<'MONTHLY' | '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'FINANCIAL_YEAR' | 'CUSTOM'>('MONTHLY');
  // Month & Year filter e.g. "2026-07"
  const [monthYear, setMonthYear] = useState<string>(initialMonthYear || '2026-07');
  const [fromDate, setFromDate] = useState<string>('2026-07-01');
  const [toDate, setToDate] = useState<string>('2026-07-31');

  // Custom Invoice details
  const [invoiceNo, setInvoiceNo] = useState<string>('26-27/54');
  const [invoiceDate, setInvoiceDate] = useState<string>('2026-07-31');
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST'>('CGST_SGST');
  const [gstPaidBy, setGstPaidBy] = useState<string>('TRANSPORTER');
  const [hsnCode, setHsnCode] = useState<string>('9965');

  // PDF Generation & Email states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState(company.email || 'billing@mahaveerlogistics.com');
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

  // Active customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedPartyId) || customers[0] || null;
  }, [customers, selectedPartyId]);

  // Filter LRs strictly by selected party and period/date range
  const matchingLRs = useMemo(() => {
    if (!currentCustomer) return [];
    return lrEntries.filter((lr) => {
      const matchParty =
        lr.partyId === currentCustomer.id ||
        lr.partyName.toLowerCase().trim() === currentCustomer.name.toLowerCase().trim();

      if (!matchParty) return false;

      const lrDate = lr.bookingDate || '';
      if (!lrDate) return true;

      if (periodType === 'MONTHLY') {
        const lrMonth = lrDate.substring(0, 7);
        return monthYear ? lrMonth === monthYear : true;
      } else if (periodType === 'CUSTOM') {
        const afterFrom = fromDate ? lrDate >= fromDate : true;
        const beforeTo = toDate ? lrDate <= toDate : true;
        return afterFrom && beforeTo;
      } else if (periodType === '3_MONTHS') {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        const cutoff = d.toISOString().split('T')[0];
        return lrDate >= cutoff;
      } else if (periodType === '6_MONTHS') {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        const cutoff = d.toISOString().split('T')[0];
        return lrDate >= cutoff;
      } else if (periodType === '12_MONTHS') {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        const cutoff = d.toISOString().split('T')[0];
        return lrDate >= cutoff;
      } else if (periodType === 'FINANCIAL_YEAR') {
        const now = new Date();
        const curYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const fyStart = `${curYear}-04-01`;
        const fyEnd = `${curYear + 1}-03-31`;
        return lrDate >= fyStart && lrDate <= fyEnd;
      }
      return true;
    });
  }, [lrEntries, currentCustomer, periodType, monthYear, fromDate, toDate]);

  // Track checked LRs for inclusion in bill
  const [selectedLRIds, setSelectedLRIds] = useState<string[]>(() =>
    matchingLRs.map((l) => l.id)
  );

  // Re-sync selected LRs when filters change
  React.useEffect(() => {
    setSelectedLRIds(matchingLRs.map((l) => l.id));
  }, [matchingLRs]);

  const activeLRs = useMemo(() => {
    return matchingLRs.filter((l) => selectedLRIds.includes(l.id));
  }, [matchingLRs, selectedLRIds]);

  const toggleSelectAll = () => {
    if (selectedLRIds.length === matchingLRs.length) {
      setSelectedLRIds([]);
    } else {
      setSelectedLRIds(matchingLRs.map((l) => l.id));
    }
  };

  // Tax calculations with dynamic GST Rate (0%, 5%, 12%, 18%)
  const totalTripAmount = useMemo(() => {
    return activeLRs.reduce((sum, item) => sum + (item.freight || 0), 0);
  }, [activeLRs]);

  const totalAdvanceReceived = useMemo(() => {
    return activeLRs.reduce((sum, item) => sum + (item.advance || 0), 0);
  }, [activeLRs]);

  const halfGstRate = gstPercent / 2;

  const sgstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'CGST_SGST') return 0;
    return Math.round(totalTripAmount * (halfGstRate / 100) * 100) / 100;
  }, [totalTripAmount, gstType, gstPercent, halfGstRate]);

  const cgstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'CGST_SGST') return 0;
    return Math.round(totalTripAmount * (halfGstRate / 100) * 100) / 100;
  }, [totalTripAmount, gstType, gstPercent, halfGstRate]);

  const igstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'IGST') return 0;
    return Math.round(totalTripAmount * (gstPercent / 100) * 100) / 100;
  }, [totalTripAmount, gstType, gstPercent]);

  const totalTaxAmount = sgstAmount + cgstAmount + igstAmount;

  const invoiceValue = Math.round((totalTripAmount + totalTaxAmount) * 100) / 100;
  const netPayableAmount = Math.max(0, Math.round((invoiceValue - totalAdvanceReceived) * 100) / 100);

  const amountInWords = numberToIndianWords(invoiceValue);

  // Period formatted text for display
  const periodDisplayText = useMemo(() => {
    if (periodType === 'MONTHLY') {
      try {
        return new Date(monthYear + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      } catch {
        return monthYear;
      }
    } else if (periodType === 'CUSTOM') {
      return `${fromDate.split('-').reverse().join('/')} to ${toDate.split('-').reverse().join('/')}`;
    } else if (periodType === '3_MONTHS') {
      return 'Past 3 Months';
    } else if (periodType === '6_MONTHS') {
      return 'Past 6 Months';
    } else if (periodType === '12_MONTHS') {
      return 'Past 12 Months';
    } else if (periodType === 'FINANCIAL_YEAR') {
      return 'Financial Year (FY 2026-27)';
    }
    return monthYear;
  }, [periodType, monthYear, fromDate, toDate]);

  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');

  const handleSaveMonthlyBill = () => {
    const targetPartyName = currentCustomer
      ? currentCustomer.name
      : matchingLRs.length > 0
      ? matchingLRs[0].partyName
      : 'PIONEER FOODS PRIVATE LIMITED';
    const targetPartyId = currentCustomer ? currentCustomer.id : selectedPartyId || 'cust-pioneer';
    const targetGstNo = currentCustomer ? currentCustomer.gstNo || '' : '';

    const monthNameFormatted = new Date(monthYear + '-01').toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    const invoiceToSave: SavedMonthlyInvoice = {
      id: `inv-${invoiceNo.replace(/\//g, '-')}-${Date.now()}`,
      invoiceNo: invoiceNo.trim() || '26-27/54',
      invoiceDate,
      monthYear: monthNameFormatted,
      partyId: targetPartyId,
      partyName: targetPartyName,
      gstNo: targetGstNo,
      gstPercent,
      gstType,
      periodType,
      fromDate: periodType === 'CUSTOM' ? fromDate : undefined,
      toDate: periodType === 'CUSTOM' ? toDate : undefined,
      selectedLrIds: activeLRs.map((l) => l.id),
      lrCount: activeLRs.length,
      totalFreight: totalTripAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      invoiceValue,
      advanceReceived: totalAdvanceReceived,
      netPayableAmount,
      paidAmount: totalAdvanceReceived >= netPayableAmount ? netPayableAmount : totalAdvanceReceived,
      status: totalAdvanceReceived >= netPayableAmount ? 'Fully Paid' : totalAdvanceReceived > 0 ? 'Partially Paid' : 'Unpaid',
      createdAt: new Date().toISOString()
    };

    StorageService.saveOrUpdateMonthlyInvoice(invoiceToSave);
    if (onSaveMonthlyInvoice) {
      onSaveMonthlyInvoice(invoiceToSave);
    }

    const successMsg = `✅ Monthly Tax Bill "${invoiceToSave.invoiceNo}" saved successfully for ${targetPartyName}! Available in Ledger & Payments.`;
    setSaveSuccessNotice(successMsg);
    alert(successMsg);
    setTimeout(() => setSaveSuccessNotice(''), 7000);
  };

  // Print function - triggers browser print using loaded page styles so the entire template format is preserved
  const handlePrintInvoice = () => {
    window.print();
  };

  // Generate PDF file blob for downloading and Web Share API attachment
  const generatePDFFileBlob = async (): Promise<{ pdf: jsPDF; fileName: string; file: File; blobUrl: string } | null> => {
    if (!printableRef.current) return null;
    const element = printableRef.current;

    const sanitizedParty = (currentCustomer?.name || 'Party').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Tax_Invoice_${invoiceNo.replace(/\//g, '_')}_${sanitizedParty}.pdf`;

    try {
      let imgData = '';
      
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
        imgData = canvas.toDataURL('image/jpeg', 0.98);
      } catch (h2cErr) {
        console.warn('html2canvas failed, trying toPng fallback:', h2cErr);
        imgData = await toPng(element, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: false,
        });
      }

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load'));
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = 210; // A4 mm
      const pdfPageHeight = 297; // A4 mm
      const margin = 4; // 4mm margin on all sides for clean framing
      const availWidth = pdfPageWidth - (margin * 2); // 202mm
      const availHeight = pdfPageHeight - (margin * 2); // 289mm

      const imgRatio = img.width / img.height;
      let renderWidth = availWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > availHeight) {
        renderHeight = availHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const xOffset = margin + (availWidth - renderWidth) / 2;
      const yOffset = margin;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');

      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      return { pdf, fileName, file, blobUrl };
    } catch (err) {
      console.error('PDF Generation Error:', err);
      return null;
    }
  };

  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<{ message: string; url?: string; fileName?: string } | null>(null);

  // Direct robust file download helper
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
      console.warn('Anchor blob download failed, trying pdf.save:', err);
      if (pdf) {
        try {
          pdf.save(fileName);
        } catch (pdfSaveErr) {
          console.error('pdf.save failed:', pdfSaveErr);
        }
      }
    }
  };

  // Generate downloadable single-page PDF file using html2canvas & jsPDF
  const handleDownloadPDF = async (): Promise<string | null> => {
    if (!printableRef.current) {
      alert('Invoice element not ready.');
      return null;
    }
    setIsGeneratingPDF(true);

    try {
      const data = await generatePDFFileBlob();
      if (data) {
        const blob = data.pdf.output('blob');
        triggerPDFDownload(blob, data.fileName, data.pdf);
        setIsGeneratingPDF(false);
        setDownloadSuccessNotice({
          message: `Tax Invoice PDF "${data.fileName}" आपके लोकल ड्राइव / Downloads फ़ोल्डर में डाउनलोड हो गया है!`,
          url: data.blobUrl,
          fileName: data.fileName
        });
        setTimeout(() => setDownloadSuccessNotice(null), 12000);
        return data.fileName;
      }
      setIsGeneratingPDF(false);
      return null;
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGeneratingPDF(false);
      window.print();
      return null;
    }
  };

  // Open email popup
  const handleOpenEmailModal = () => {
    const custEmail = currentCustomer?.email || 'accounts@party.com';
    setSenderEmail(company?.email || 'billing@mahaveerlogistics.com');
    setRecipientEmail(custEmail);
    setEmailSubject(
      `GST Tax Invoice ${invoiceNo} - ${currentCustomer?.name || 'Party'} - ${company.companyName}`
    );
    setEmailBodyMessage(
      `Dear ${currentCustomer?.name || 'Customer'},\n\nPlease find attached our Monthly Transport Tax Invoice (${invoiceNo}) for the period ${monthYear}.\n\nTALLI & ACCOUNTING INVOICE METADATA:\n----------------------------------------\n- Voucher Type: Purchase / Freight Bill\n- Invoice Number: ${invoiceNo}\n- Date: ${invoiceDate}\n- Billed To: ${currentCustomer?.name || 'Party'}\n- GSTIN: ${currentCustomer?.gstNo || 'N/A'}\n- HSN / SAC Code: ${hsnCode}\n- Total Freight (Taxable): ₹${totalTripAmount.toLocaleString('en-IN')}\n- CGST @ 9%: ₹${cgstAmount.toFixed(2)}\n- SGST @ 9%: ₹${sgstAmount.toFixed(2)}\n- IGST @ 18%: ₹${igstAmount.toFixed(2)}\n- Invoice Total Value: ₹${invoiceValue.toLocaleString('en-IN')}\n- Less Advance Received: ₹${totalAdvanceReceived.toLocaleString('en-IN')}\n- Net Payable Balance: ₹${netPayableAmount.toLocaleString('en-IN')}\n----------------------------------------\n\nNote: The official single-page PDF Invoice is attached for your Tally software entry.\n\nBank Account Details:\nAccount Name: ${company.companyName || 'MAHAVEER LOGISTICS'}\nAccount No: 83085733179\nIFSC Code: RMGB0000433\nBank: RMGB\n\nThank you,\n${company.companyName}\nMobile: ${company.phone}`
    );
    setEmailSuccess(false);
    setEmailNoticeMessage('');
    setIsEmailModalOpen(true);
  };

  // Option 1: Gmail Web Compose (Auto downloads PDF + opens Gmail Web)
  const handleSendGmailWeb = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generatePDFFileBlob();
    if (pdfData) {
      triggerPDFDownload(pdfData.file, pdfData.fileName, pdfData.pdf);
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
      `📥 Tax Invoice PDF auto-downloaded (${pdfData?.fileName || 'Tax_Invoice.pdf'})! In Gmail, click 'Attach file' (📎) and select it from your Downloads folder.`
    );
  };

  // Option 2: Outlook Web Compose (Auto downloads PDF + opens Outlook Web)
  const handleSendOutlookWeb = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generatePDFFileBlob();
    if (pdfData) {
      triggerPDFDownload(pdfData.file, pdfData.fileName, pdfData.pdf);
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
      `📥 Tax Invoice PDF auto-downloaded (${pdfData?.fileName || 'Tax_Invoice.pdf'})! In Outlook Web, click 'Attach File' (📎) and select it from your Downloads folder.`
    );
  };

  // Option 3: Windows / Mobile Native Share (Auto attaches PDF directly in Outlook / Mail app if supported)
  const handleSendNativeShare = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    const pdfData = await generatePDFFileBlob();
    if (pdfData) {
      triggerPDFDownload(pdfData.file, pdfData.fileName, pdfData.pdf);

      if (navigator.canShare && navigator.canShare({ files: [pdfData.file] })) {
        try {
          await navigator.share({
            title: emailSubject,
            text: emailBodyMessage,
            files: [pdfData.file]
          });
          setIsSendingEmail(false);
          setEmailSuccess(true);
          setEmailNoticeMessage(`✅ Tax Invoice PDF auto-attached directly to Outlook / Windows Mail app!`);
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
      `📥 Tax Invoice PDF saved in Downloads! In your Mail app, attach "${pdfData?.fileName || 'Tax_Invoice.pdf'}".`
    );
  };

  // Option 4: Direct Server SMTP Dispatch via Backend
  const handleDirectSMTPSend = async () => {
    if (!recipientEmail) return;
    setIsSendingEmail(true);

    try {
      const pdfData = await generatePDFFileBlob();
      let pdfBase64 = '';
      if (pdfData) {
        triggerPDFDownload(pdfData.file, pdfData.fileName, pdfData.pdf);
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
          filename: pdfData?.fileName || `Tax_Invoice_${invoiceNo.replace(/\//g, '_')}.pdf`
        })
      });

      const data = await response.json();
      setIsSendingEmail(false);

      if (data.success) {
        setEmailSuccess(true);
        setEmailNoticeMessage(`✅ Email with Tax Invoice PDF attachment sent directly via SMTP to ${recipientEmail}!`);
      } else if (data.requiresSmtpConfig) {
        setEmailSuccess(true);
        setEmailNoticeMessage(
          `📥 Tax Invoice PDF downloaded to Downloads folder! Please click 'Open Gmail Web' or 'Open Outlook Web' button below to attach and send.`
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

  // Copy email text
  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(emailBodyMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="monthly-tax-invoice-modal-wrapper fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      
      {/* Dynamic CSS for precise 1-Page A4 Print Output with zero background overflow */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 4mm 4mm 4mm;
          }
          html, body, #root, #root > div {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }

          /* Hide background app layout shell completely */
          .no-print-app-shell,
          header, nav, sidebar, aside, main, footer,
          .print\:hidden {
            display: none !important;
            visibility: hidden !important;
          }

          /* Reset fixed modal overlay for print */
          .monthly-tax-invoice-modal-wrapper {
            position: static !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            display: block !important;
            width: 100% !important;
          }

          .monthly-tax-invoice-modal-wrapper > div {
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }

          .monthly-tax-invoice-modal-wrapper * {
            overflow: visible !important;
            box-sizing: border-box !important;
          }

          /* Force exact 1-page single A4 document box */
          #invoice-single-page-area {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 2.5mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 1.5px solid #000000 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #invoice-single-page-area * {
            visibility: visible !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl my-4 print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
        
        {/* Controls Bar (Hidden on print) */}
        <div className="bg-slate-800 px-4 sm:px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all cursor-pointer"
              title="Go Back / वापस जाएं"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>← Back (वापस)</span>
            </button>

            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-xl hidden sm:block">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                Monthly & Period GST Tax Invoice
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1-Page A4 PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Single-page tax invoice copy for party credit billing & Tally entry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveMonthlyBill}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-lg shadow-lg transition-all"
              title="Save this Monthly Tax Invoice to Customer Ledger and Payment Collection"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>Save Monthly Bill (बिल सेव करें)</span>
            </button>

            <button
              onClick={() => exportMonthlyBiltyToExcel(activeLRs, currentCustomer?.name, periodDisplayText)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow"
              title="Export complete charges breakdown to Excel file"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenEmailModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4 text-sky-400" />
              <span>Email Invoice</span>
            </button>

            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print 1-Page A4</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-rose-300 hover:text-rose-200 border border-slate-600 font-bold text-xs sm:text-sm rounded-lg transition-colors"
              title="Close & Return to Dashboard"
            >
              <X className="h-4 w-4" />
              <span>Close / Back</span>
            </button>
          </div>
        </div>

        {/* Filter & Configuration Options Bar (Hidden on print) */}
        <div className="bg-slate-900/90 p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs print:hidden">
          {/* Party Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Select Credit Party / Customer</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-semibold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gstNo || 'No GSTIN'})
                </option>
              ))}
            </select>
          </div>

          {/* Period Type Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Invoice Period / अवधि</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-semibold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="MONTHLY">Monthly (मासिक)</option>
              <option value="CUSTOM">Custom Date Range (कस्टम तिथि)</option>
              <option value="3_MONTHS">Past 3 Months (3 महीने)</option>
              <option value="6_MONTHS">Past 6 Months (6 महीने)</option>
              <option value="12_MONTHS">Past 12 Months (1 वर्ष)</option>
              <option value="FINANCIAL_YEAR">Financial Year (वित्तीय वर्ष)</option>
            </select>
          </div>

          {/* Date Selector depending on Period */}
          {periodType === 'MONTHLY' ? (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Billing Month & Year</label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ) : periodType === 'CUSTOM' ? (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Active Date Scope</label>
              <div className="w-full bg-slate-800/80 border border-slate-700 text-cyan-300 font-mono font-bold text-xs rounded-lg p-2 flex items-center justify-between">
                <span>{periodDisplayText}</span>
                <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
              </div>
            </div>
          )}

          {/* Bill Invoice Number */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Bill Invoice Number</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g. 26-27/54"
              className="w-full bg-slate-800 border border-slate-700 text-white font-mono font-bold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-mono font-bold rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Save Monthly Bill Success Banner */}
        {saveSuccessNotice && (
          <div className="bg-emerald-950/90 border-y border-emerald-500/50 p-3 px-6 text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn print:hidden">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{saveSuccessNotice}</span>
            </span>
            <button
              onClick={() => setSaveSuccessNotice('')}
              className="text-emerald-400 hover:text-white p-1 rounded hover:bg-emerald-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Secondary Config Controls (Hidden on print) */}
        <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            {/* GST Rate Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">GST Rate:</span>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded px-2.5 py-1 font-bold outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={0}>0% (Exempt / RCM GTA)</option>
                <option value={5}>5% (Transport GTA)</option>
                <option value={12}>12% (Forward Charge)</option>
                <option value={18}>18% (Courier / Standard)</option>
              </select>
            </div>

            {/* GST Mode Radio */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">GST Mode:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="gstType"
                  checked={gstType === 'CGST_SGST'}
                  onChange={() => setGstType('CGST_SGST')}
                  className="accent-blue-500"
                />
                <span>
                  SGST ({halfGstRate}%) + CGST ({halfGstRate}%) = {gstPercent}%
                </span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer ml-2">
                <input
                  type="radio"
                  name="gstType"
                  checked={gstType === 'IGST'}
                  onChange={() => setGstType('IGST')}
                  className="accent-blue-500"
                />
                <span>IGST ({gstPercent}%)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">GST Paid By:</span>
              <select
                value={gstPaidBy}
                onChange={(e) => setGstPaidBy(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-semibold"
              >
                <option value="TRANSPORTER">TRANSPORTER</option>
                <option value="CONSIGNOR">CONSIGNOR</option>
                <option value="CONSIGNEE">CONSIGNEE</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Selected Party LRs: <strong className="text-cyan-400">{activeLRs.length}</strong> / {matchingLRs.length}
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-cyan-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              {selectedLRIds.length === matchingLRs.length ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5" /> Select All LRs
                </>
              )}
            </button>
          </div>
        </div>

        {/* PRINTABLE 1-PAGE A4 DOCUMENT CONTAINER */}
        <div className="p-3 sm:p-6 bg-white text-black max-h-[76vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible font-sans">
          
          <div
            id="invoice-single-page-area"
            ref={printableRef}
            className="border-2 border-black p-2 sm:p-3 space-y-1.5 text-[10.5px] leading-tight bg-white text-black max-w-[190mm] mx-auto box-border"
          >
            
            {/* Header Jurisdiction & Mobile Numbers */}
            <div className="flex items-center justify-between text-[8.5px] sm:text-[9px] font-bold tracking-wider text-black uppercase border-b border-black/20 pb-0.5">
              <span>SUBJECT TO JAIPUR JURISDICTION</span>
              <div className="text-right">
                <span>MOBILE : {company.phone || '9782162010 / 8386862130'}</span>
              </div>
            </div>

            {/* Title & Company Info */}
            <div className="text-center border-b border-black pb-1 space-y-0.5">
              <h1 className="text-base sm:text-xl font-black tracking-widest text-red-700 uppercase">
                TAX INVOICE
              </h1>
              <h2 className="text-sm sm:text-base font-extrabold text-black uppercase">
                {company.companyName || 'Mahaveer Logistics'}
              </h2>
              <p className="text-[9.5px] font-semibold text-black">
                {company.address || '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur'}
              </p>
              <p className="text-[9.5px] font-bold text-black">
                Transport Reg No : , Email id : <span className="text-blue-900 underline">{company.email || 'manish.jain8619@gmail.com'}</span>, GSTIN No. : <span className="font-mono">{company.gstNo || '08AJAPJ9522F1ZC'}</span>
              </p>
            </div>

            {/* Bill Details Box */}
            <div className="bg-slate-50 border border-black p-1.5 grid grid-cols-2 gap-2 text-[9.5px]">
              <div>
                <p>
                  <strong className="font-black uppercase">BILL INVOICE NO. :</strong>{' '}
                  <span className="font-mono font-bold text-xs">{invoiceNo}</span>
                </p>
                <p className="mt-0.5">
                  <strong className="font-bold uppercase">BILLED TO :</strong>{' '}
                  <span className="font-extrabold text-black uppercase">{currentCustomer?.name || 'PIONEER FOODS PRIVATE LIMITED'}</span>
                </p>
                <p className="mt-0.5 text-[9px] text-slate-800">
                  <strong className="font-semibold uppercase">ADDRESS :</strong>{' '}
                  <span>{currentCustomer?.address || 'Sp-01 Rajdhani Mandi Yard Kukar Khera Opp Vki Area Sikar Road Jaipur'}</span>
                </p>
              </div>

              <div className="text-right">
                <p>
                  <strong className="font-black uppercase">DATE :</strong>{' '}
                  <span className="font-mono font-bold text-xs">{invoiceDate.split('-').reverse().join('/')}</span>
                </p>
                <p className="mt-0.5">
                  <strong className="font-bold uppercase">PERIOD :</strong>{' '}
                  <span className="font-mono font-bold text-[10px] text-black">{periodDisplayText}</span>
                </p>
                <p className="mt-0.5">
                  <strong className="font-bold uppercase">GSTIN :</strong>{' '}
                  <span className="font-mono font-bold text-xs">{currentCustomer?.gstNo || '08AAFCP0623G1ZP'}</span>
                </p>
              </div>
            </div>

            {/* Summary & Tax Calculation Box (Placed on TOP as requested) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              
              {/* Left Remarks & HSN */}
              <div className="border border-black p-1.5 space-y-1 text-[9.5px] flex flex-col justify-between">
                <div>
                  <p>
                    <strong className="font-black uppercase">HSN/SAC :</strong>{' '}
                    <span className="font-mono font-bold text-xs">{hsnCode}</span>
                  </p>
                  <p className="mt-0.5">
                    <strong className="font-extrabold uppercase">REMARKS :</strong>{' '}
                    <span className="font-bold">TRANSPORTATION OF GOODS</span>
                  </p>
                </div>

                <div className="pt-1.5 border-t border-black/40 mt-1">
                  <p className="font-black uppercase text-[9px]">
                    AMOUNT IN WORDS :{' '}
                    <span className="font-extrabold capitalize text-black">
                      {amountInWords}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Tax Calculation Box */}
              <div className="border border-black text-[9.5px]">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-0.5 font-black uppercase">TOTAL TRIP AMOUNT</td>
                      <td className="p-0.5 text-right font-mono font-black text-xs">
                        {totalTripAmount}
                      </td>
                    </tr>

                    {gstPercent === 0 ? (
                      <tr className="border-b border-black">
                        <td className="p-0.5 font-bold">GST@ 0.00% (GTA Exempt / RCM)</td>
                        <td className="p-0.5 text-right font-mono font-bold">
                          0.00
                        </td>
                      </tr>
                    ) : gstType === 'CGST_SGST' ? (
                      <>
                        <tr className="border-b border-black">
                          <td className="p-0.5 font-bold">SGST@ {halfGstRate.toFixed(2)}%</td>
                          <td className="p-0.5 text-right font-mono font-bold">
                            {sgstAmount.toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-0.5 font-bold">CGST@ {halfGstRate.toFixed(2)}%</td>
                          <td className="p-0.5 text-right font-mono font-bold">
                            {cgstAmount.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr className="border-b border-black">
                        <td className="p-0.5 font-bold">IGST@ {gstPercent.toFixed(2)}%</td>
                        <td className="p-0.5 text-right font-mono font-bold">
                          {igstAmount.toFixed(2)}
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-black bg-slate-100">
                      <td className="p-0.5 font-black uppercase">INVOICE VALUE</td>
                      <td className="p-0.5 text-right font-mono font-black text-xs">
                        {Math.round(invoiceValue)}
                      </td>
                    </tr>

                    <tr className="border-b border-black">
                      <td className="p-0.5 font-bold">TOTAL ADVANCE RECEIVED</td>
                      <td className="p-0.5 text-right font-mono font-bold">{totalAdvanceReceived}</td>
                    </tr>

                    <tr className="border-b border-black bg-slate-200">
                      <td className="p-0.5 font-black uppercase text-xs">NET PAYABLE AMOUNT</td>
                      <td className="p-0.5 text-right font-mono font-black text-sm text-black">
                        {Math.round(netPayableAmount)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-0.5 font-bold uppercase text-[9px]">GST PAID BY</td>
                      <td className="p-0.5 text-right font-bold uppercase text-[9px]">
                        {gstPaidBy}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Itemized Trips / Bilty Summary Table (Placed Below Tax Summary Box) */}
            <div className="overflow-x-auto print:overflow-visible pt-0.5">
              <div className="text-[9.5px] font-extrabold uppercase text-slate-900 mb-0.5">
                ITEMIZED BILTY BREAKDOWN SUMMARY ({activeLRs.length} ENTRIES):
              </div>
              <table className="w-full border-collapse border border-black text-[8px] text-center table-fixed">
                <thead className="bg-slate-200 text-black font-extrabold border-b border-black uppercase text-[7.5px]">
                  <tr>
                    <th className="border border-black p-0.5 w-[8%]">DATE / LR NO</th>
                    <th className="border border-black p-0.5 w-[14%]">VEHICLE NO / BILL</th>
                    <th className="border border-black p-0.5 w-[13%]">FROM - TO</th>
                    <th className="border border-black p-0.5 w-[15%]">PARTICULAR</th>
                    <th className="border border-black p-0.5 w-[9%]">MATERIAL</th>
                    <th className="border border-black p-0.5 w-[7%]">FREIGHT</th>
                    <th className="border border-black p-0.5 w-[5%]">HALTING</th>
                    <th className="border border-black p-0.5 w-[5%]">OTHERS</th>
                    <th className="border border-black p-0.5 w-[5%]">DEDUCT</th>
                    <th className="border border-black p-0.5 w-[7%] font-black">TRIP AMT</th>
                    <th className="border border-black p-0.5 w-[5%]">ADVANCE</th>
                    <th className="border border-black p-0.5 w-[7%] font-black">BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-medium text-black">
                  {activeLRs.length > 0 ? (
                    activeLRs.map((l) => {
                      const displayDate = l.bookingDate ? l.bookingDate.split('-').reverse().join('/') : '';
                      const lrNumOnly = l.lrNumber.replace(/\D/g, '') || l.lrNumber;
                      const vehicle = l.vehicleNumber || '—';
                      const partyBill = l.invoiceNumber || '';
                      const particularText = `RATE - ${l.ratePerKg ? `₹${l.ratePerKg}/Kg` : l.freight} WT - ${l.chargedWeight || l.actualWeight || l.weight || 35} ${l.weightUnit || 'KG'}`;

                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="border border-black p-0.5 font-mono break-words">
                            <div>{displayDate}</div>
                            <div className="font-bold">{lrNumOnly}</div>
                          </td>
                          <td className="border border-black p-0.5 break-words">
                            <div className="font-mono font-bold">{vehicle}</div>
                            {partyBill && (
                              <div className="text-[7.5px] text-slate-800 font-bold uppercase tracking-tight">{partyBill}</div>
                            )}
                          </td>
                          <td className="border border-black p-0.5 text-left px-0.5 break-words">
                            {l.pickupLocation} - {l.deliveryLocation}
                          </td>
                          <td className="border border-black p-0.5 font-mono text-[7.5px] text-left leading-tight break-words">
                            {particularText}
                          </td>
                          <td className="border border-black p-0.5 font-bold uppercase break-words">
                            {l.material || 'FOOD ITEM'}
                          </td>
                          <td className="border border-black p-0.5 font-mono font-bold">
                            {l.freight}
                          </td>
                          <td className="border border-black p-0.5 font-mono">0</td>
                          <td className="border border-black p-0.5 font-mono">0</td>
                          <td className="border border-black p-0.5 font-mono">0</td>
                          <td className="border border-black p-0.5 font-mono font-bold">
                            {l.freight}
                          </td>
                          <td className="border border-black p-0.5 font-mono">
                            {l.advance || 0}
                          </td>
                          <td className="border border-black p-0.5 font-mono font-bold">
                            {l.balance || l.freight}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-3 text-center text-slate-500 font-semibold italic">
                        No LRs found for {currentCustomer?.name} for period {monthYear}. Select a different customer or month above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Terms & Bank Details Grid */}
            <div className="grid grid-cols-2 gap-2 border border-black p-1.5 text-[9px] leading-snug">
              
              {/* Terms & Bank Info */}
              <div className="space-y-0.5">
                <p className="font-extrabold uppercase text-black">1. ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION</p>
                <p className="font-extrabold uppercase text-black">2. GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER</p>
                <p className="font-extrabold uppercase text-black">3. PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.</p>

                <div className="pt-1 border-t border-black/30 mt-1 space-y-0.5 text-[9.5px]">
                  <p><strong className="font-black">ACCOUNT NAME :</strong> {company.companyName || 'MAHAVEER LOGISTICS'}</p>
                  <p><strong className="font-black">ACCOUNT NUMBER :</strong> <span className="font-mono font-bold text-xs">83085733179</span></p>
                  <p><strong className="font-black">IFSC CODE :</strong> <span className="font-mono font-bold">RMGB0000433</span></p>
                  <p><strong className="font-black">BANK NAME :</strong> RMGB | <strong className="font-black">PAN :</strong> <span className="font-mono font-bold">{company.panNo || 'AJAPJ9522F'}</span></p>
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="flex flex-col justify-between text-right p-1 border-l border-black/40">
                <div className="font-black text-[10px] uppercase">
                  FOR , {company.companyName || 'Mahaveer Logistics'}
                </div>

                <div className="my-1 flex justify-end">
                  {/* Digital Signature Art Representation */}
                  <div className="border border-slate-400 rounded px-3 py-1 bg-slate-50 inline-block text-center">
                    <span className="text-lg font-serif italic font-bold text-blue-900 tracking-wider">
                      M. Jain
                    </span>
                    <span className="block text-[7.5px] text-slate-600 font-mono">Digitally Verified</span>
                  </div>
                </div>

                <div className="font-black text-[9px] uppercase tracking-wider text-black">
                  (AUTHORIZED SIGNATORY)
                </div>
              </div>

            </div>

            <p className="text-[8px] text-slate-600 text-center italic mt-0.5">
              This electronic generated pdf does not require any physical signature. Date : {new Date().toISOString().replace('T', ' ').substring(0, 19)}
            </p>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800 px-6 py-3 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="text-slate-400 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Total Bill Value: ₹{invoiceValue.toLocaleString('en-IN')} (Net Payable: ₹{netPayableAmount.toLocaleString('en-IN')})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEmailModal}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg flex items-center gap-1.5"
            >
              <Mail className="h-4 w-4 text-sky-400" />
              <span>Email Invoice</span>
            </button>

            <button
              onClick={handlePrintInvoice}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Print 1-Page A4</span>
            </button>
          </div>
        </div>

      </div>

      {/* EMAIL INVOICE MODAL WITH PDF ATTACHMENT */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-400" />
                <h4 className="font-bold text-white text-base">Send Tax Invoice via Email & PDF</h4>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* PDF Attachment Banner */}
              <div className="p-3 bg-sky-950/60 border border-sky-500/40 rounded-xl text-sky-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 font-bold text-sky-300">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>Tax Invoice PDF Attachment (`Tax_Invoice_${invoiceNo.replace(/\//g, '_')}.pdf`)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-[10px] rounded flex items-center gap-1 shadow cursor-pointer shrink-0"
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
                    <span className="text-[10px] text-amber-400 font-normal">Company Email</span>
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. billing@mahaveerlogistics.com"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Recipient Email (To)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Customer Email</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. accounts@pioneerfoods.in"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Sender & Receiver Info Banner */}
              <div className="p-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Sending From:</span>
                  <strong className="text-amber-300 font-mono">{company?.companyName || 'MAHAVEER LOGISTICS'} &lt;{senderEmail}&gt;</strong>
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
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Invoice Message & Tally Details</label>
                <textarea
                  rows={4}
                  value={emailBodyMessage}
                  onChange={(e) => setEmailBodyMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
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
                  className="px-2.5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold rounded-xl text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow"
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
  );
};
