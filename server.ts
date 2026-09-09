import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getNearestCityFromCoords, formatCityLocation } from './src/utils/geoUtils';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Direct Server Email Dispatch Route using Nodemailer
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, from, subject, text, pdfBase64, filename } = req.body;

      if (!to) {
        return res.status(400).json({ error: 'Recipient email (to) is required.' });
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(200).json({
          success: false,
          requiresSmtpConfig: true,
          message:
            'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured in environment variables. Please use the Gmail / Outlook Web or Direct Share options.'
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const attachments = [];
      if (pdfBase64 && filename) {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        attachments.push({
          filename: filename,
          content: buffer,
          contentType: 'application/pdf'
        });
      }

      await transporter.sendMail({
        from: from || smtpUser,
        to,
        subject,
        text,
        attachments
      });

      res.json({ success: true, message: `Email successfully sent to ${to}` });
    } catch (error: any) {
      console.error('Email send error:', error);
      res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  });

  // Real-time In-Memory Store for Driver GPS Locations
  interface DriverLocationRecord {
    token: string;
    lrId?: string;
    lrNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    address?: string;
    timestamp: string;
    isSharingActive: boolean;
    lastUpdated: number;
  }
  const driverLocations = new Map<string, DriverLocationRecord>();

  // Driver Location Update Endpoint (Transmitted from Driver's mobile phone)
  app.post('/api/driver-location', (req, res) => {
    try {
      const {
        token,
        lrId,
        lrNumber,
        vehicleNumber,
        driverName,
        lat,
        lng,
        accuracy,
        speed,
        heading,
        address,
        isSharingActive,
        timestamp
      } = req.body;

      if (!token && !lrId && !lrNumber) {
        return res.status(400).json({ error: 'Token, LR ID, or LR Number is required' });
      }

      const numLat = Number(lat);
      const numLng = Number(lng);
      if (isNaN(numLat) || isNaN(numLng)) {
        return res.status(400).json({ error: 'Valid lat/lng coordinates are required' });
      }

      // Automatically resolve human-readable Indian city name from GPS coordinates
      const resolvedCityAddress = formatCityLocation(address, numLat, numLng) || getNearestCityFromCoords(numLat, numLng);

      const record: DriverLocationRecord = {
        token: token || '',
        lrId: lrId || '',
        lrNumber: lrNumber || '',
        vehicleNumber: vehicleNumber || '',
        driverName: driverName || '',
        lat: numLat,
        lng: numLng,
        accuracy: accuracy ? Number(accuracy) : undefined,
        speed: speed ? Number(speed) : undefined,
        heading: heading ? Number(heading) : undefined,
        address: resolvedCityAddress,
        timestamp: timestamp || new Date().toISOString(),
        isSharingActive: isSharingActive !== false,
        lastUpdated: Date.now()
      };

      if (token) driverLocations.set(token, record);
      if (lrId) driverLocations.set(lrId, record);
      if (lrNumber) driverLocations.set(lrNumber.toLowerCase().trim(), record);
      if (vehicleNumber) driverLocations.set(vehicleNumber.toLowerCase().replace(/\s+/g, ''), record);

      res.json({ success: true, message: 'Driver GPS location recorded', data: record });
    } catch (err: any) {
      console.error('Driver location update error:', err);
      res.status(500).json({ error: err.message || 'Failed to update driver location' });
    }
  });

  // Stop Driver Location Sharing Endpoint
  app.post('/api/driver-location/stop', (req, res) => {
    try {
      const { token, lrId, lrNumber } = req.body;
      const key = token || lrId || (lrNumber ? lrNumber.toLowerCase().trim() : '');
      const existing = key ? driverLocations.get(key) : null;
      if (existing) {
        existing.isSharingActive = false;
        existing.lastUpdated = Date.now();
        if (token) driverLocations.set(token, existing);
        if (lrId) driverLocations.set(lrId, existing);
        if (lrNumber) driverLocations.set(lrNumber.toLowerCase().trim(), existing);
      }
      res.json({ success: true, message: 'Driver location sharing stopped' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to stop driver location' });
    }
  });

  // Query Driver Live GPS Location Endpoint (Polled by Management Map)
  app.get('/api/driver-location/:identifier', (req, res) => {
    try {
      const id = req.params.identifier;
      if (!id) return res.status(400).json({ error: 'Identifier is required' });

      const norm = id.toLowerCase().trim();
      const record =
        driverLocations.get(id) ||
        driverLocations.get(norm) ||
        driverLocations.get(norm.replace(/\s+/g, ''));
      res.json({ success: true, location: record || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch driver location' });
    }
  });

  // Helper for resilient Gemini API calls with automatic multi-model fallback and low latency
  async function generateWithFallback(ai: GoogleGenAI, contents: any, config?: any) {
    // Priority order for fast, reliable multimodal document & invoice parsing:
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-flash-lite-latest'
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Gemini API] Querying model: ${model}...`);
        const modelConfig = {
          ...config
        };

        // Allow up to 15 seconds per model to handle invoice OCR and fail over rapidly
        const apiPromise = ai.models.generateContent({
          model,
          contents,
          config: modelConfig
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} timed out after 15s`)), 15000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]);

        if (response && response.text) {
          console.log(`[Gemini API] Success with model ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[Gemini API] Model ${model} warning: ${msg}`);

        // If schema caused an error, retry plain JSON response on next attempt
        if (config?.responseSchema) {
          try {
            console.log(`[Gemini API] Retrying model ${model} with plain JSON response...`);
            const fallbackResponse = await ai.models.generateContent({
              model,
              contents,
              config: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            });
            if (fallbackResponse && fallbackResponse.text) {
              return fallbackResponse;
            }
          } catch (retryErr) {
            console.warn(`[Gemini API] Plain JSON retry for ${model} also failed:`, retryErr);
          }
        }
      }
    }

    throw lastError || new Error('All Gemini model fallbacks failed');
  }

  // AI Transport Assistant Route using Gemini API
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is missing. Please configure it in the Secrets panel.'
        });
      }

      const { prompt, context } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `You are an expert Indian Transport & Logistics Operations Advisor for a Transport Management System (TMS).
You help transport owners, dispatchers, and managers with:
1. Route & Freight Estimation (distance, toll costs, diesel estimates, freight rates per ton/trip across Indian cities).
2. Drafting Professional Transport Documents & WhatsApp Messages (LR dispatch alerts, payment reminder to party, delivery proof updates).
3. Indian GST & E-Way Bill guidance for Transport (GTA rules, Reverse Charge Mechanism, GST on freight).
4. Vehicle & Fleet maintenance advice.

Provide concise, practical, professional Hindi/English (Hinglish or English as preferred by user) responses formatted with markdown bullet points and clear numbers.`;

      const fullPrompt = `${systemInstruction}\n\nContext: ${JSON.stringify(context || {})}\n\nUser Question: ${prompt}`;

      const response = await generateWithFallback(ai, fullPrompt);

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to process AI request' });
    }
  });

  // AI PDF / Document Auto-Fill Route for LR / Bilty Entry
  app.post('/api/extract-lr-pdf', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is missing. Please configure it in the Secrets panel.'
        });
      }

      const { pdfBase64, mimeType: rawMime = 'application/pdf', filename } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: 'PDF or image base64 data is required.' });
      }

      const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').trim();
      const fn = (filename || '').toLowerCase();

      // Auto-detect exact mimeType from base64 signature and filename
      let detectedMime = rawMime;
      const isPdfHeader = cleanBase64.startsWith('JVBERi'); // %PDF-
      const isPngHeader = cleanBase64.startsWith('iVBORw0K');
      const isJpegHeader = cleanBase64.startsWith('/9j/') || cleanBase64.startsWith('/9j');
      const isWebpHeader = cleanBase64.startsWith('UklGR');

      if (isPdfHeader || fn.endsWith('.pdf')) {
        detectedMime = 'application/pdf';
      } else if (isPngHeader || fn.endsWith('.png')) {
        detectedMime = 'image/png';
      } else if (isWebpHeader || fn.endsWith('.webp')) {
        detectedMime = 'image/webp';
      } else if (isJpegHeader || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || rawMime.includes('jpeg') || rawMime.includes('jpg')) {
        detectedMime = 'image/jpeg';
      } else if (rawMime.startsWith('image/')) {
        detectedMime = rawMime;
      } else {
        // Fallback: if buffer doesn't look like PDF, treat as JPEG
        detectedMime = cleanBase64.startsWith('JVBERi') ? 'application/pdf' : 'image/jpeg';
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const extractionPrompt = `You are an expert Indian Transport Document & Invoice Parser for a Transport Management System (TMS).
Your task is to analyze the document (Tax Invoice, Delivery Challan, E-Way Bill, Bilty, Purchase Order, or Transport Dispatch Note) and extract structured fields for creating a new Lorry Receipt (LR / Bilty).

FIELD DEFINITIONS:
1. CONSIGNOR / SENDER (Bhejne Wala / Consignor / Supplier / Shipper / Billed From / Dispatch From):
   - consignorName: The exact name of the seller / supplier / consignor company or person.
   - consignorAddress: Complete street / factory / warehouse address.
   - consignorCity: City of the consignor.
   - consignorState: State of the consignor.
   - consignorGstNo: Consignor GSTIN (15 digit GST).
   - consignorMobile: Contact / mobile number.

2. CONSIGNEE / RECEIVER (Prapt Karta / Consignee / Buyer / Delivery Party / Ship To / Billed To):
   - consigneeName: The exact name of the consignee / receiver / buyer company or person.
   - consigneeCompany: Company name if separate.
   - consigneeAddress: Complete delivery / unloading address.
   - consigneeCity: City of the consignee.

3. ROUTE DETAILS:
   - pickupLocation: Origin city / dispatch hub (e.g. "JAIPUR", "MUMBAI", "PUNE").
   - deliveryLocation: Destination city / unloading hub (e.g. "DELHI", "AHMEDABAD", "SURAT").

4. MATERIAL & PACKAGING DETAILS:
   - material: Material description / items description / commodity.
   - quantity: Quantity string (e.g. "772 Pouch", "50 Boxes", "10 Cartons").
   - packageCount: The exact number of packages/units (e.g. 772, 50).
   - packageUnit: The exact unit (one of: "Cartons", "Box", "Drums", "Bags", "Tons", "Kg", "Quintal", "Nos", "Packages", "Pouch").

5. INVOICE & FINANCIAL DETAILS:
   - invoiceNumber: The actual Invoice Number / Bill Number / Challan Number / Voucher Number.
   - invoiceValue: Total invoice value / total amount in Rupees (number only).

6. VEHICLE & TRANSPORT DETAILS (if available):
   - weight: Total weight as a number (e.g. 500, 1200).
   - weightUnit: "Kg", "Tons", or "Quintal".
   - vehicleNumber: Truck / Vehicle registration number (e.g. "RJ14GA1234", "MH12AB5678").
   - ewayBillNo: E-Way Bill number if present.
   - remarks: Any specific notes, PO numbers or remarks.

IMPORTANT INSTRUCTIONS:
- If a value is missing or not mentioned, return empty string "" or null (for numbers). DO NOT make up fake data.
- Return ONLY a valid JSON object matching these exact keys.`;

      let parsedData: any = {};

      console.log(`[PDF/Image Parser] Processing document with mimeType: ${detectedMime}...`);
      const documentPart = {
        inlineData: {
          mimeType: detectedMime,
          data: cleanBase64
        }
      };

      const response = await generateWithFallback(
        ai,
        [
          documentPart,
          { text: extractionPrompt }
        ],
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              consignorName: { type: Type.STRING, description: "Name of consignor / supplier / sender" },
              consignorAddress: { type: Type.STRING, description: "Street address of consignor" },
              consignorCity: { type: Type.STRING, description: "City of consignor" },
              consignorState: { type: Type.STRING, description: "State of consignor" },
              consignorGstNo: { type: Type.STRING, description: "GST number of consignor" },
              consignorMobile: { type: Type.STRING, description: "Mobile/phone of consignor" },
              consigneeName: { type: Type.STRING, description: "Name of consignee / receiver / buyer" },
              consigneeCompany: { type: Type.STRING, description: "Company name of consignee" },
              consigneeAddress: { type: Type.STRING, description: "Delivery address of consignee" },
              consigneeCity: { type: Type.STRING, description: "City of consignee" },
              pickupLocation: { type: Type.STRING, description: "Origin / dispatch hub / city" },
              deliveryLocation: { type: Type.STRING, description: "Destination / delivery city" },
              material: { type: Type.STRING, description: "Goods / items / commodity description" },
              quantity: { type: Type.STRING, description: "Quantity with unit" },
              packageCount: { type: Type.NUMBER, description: "Numeric count of packages" },
              packageUnit: { type: Type.STRING, description: "Package unit like Box, Cartons, Bags, Drums" },
              invoiceNumber: { type: Type.STRING, description: "Invoice / Bill / Challan number" },
              invoiceValue: { type: Type.NUMBER, description: "Total invoice goods value in Rupees" },
              weight: { type: Type.NUMBER, description: "Total weight numeric" },
              weightUnit: { type: Type.STRING, description: "Weight unit Kg or Tons" },
              vehicleNumber: { type: Type.STRING, description: "Vehicle / truck registration number" },
              ewayBillNo: { type: Type.STRING, description: "E-Way Bill number" },
              remarks: { type: Type.STRING, description: "Any special instructions or remarks" }
            }
          },
          temperature: 0.1
        }
      );

      const responseText = response.text || '{}';
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn('JSON direct parse failed, cleaning markdown formatting:', parseErr);
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({
        success: true,
        filename: filename || 'document.pdf',
        data: parsedData
      });
    } catch (error: any) {
      console.error('PDF Extraction Error:', error);
      let userFriendlyMsg = 'Failed to extract data from document.';
      if (error?.message) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed?.error?.message) {
            userFriendlyMsg = parsed.error.message;
          }
        } catch (_) {
          userFriendlyMsg = error.message;
        }
      }
      res.status(500).json({
        error: userFriendlyMsg
      });
    }
  });

  // Vite development middleware or static production serving
  const BASE_PATH = '/Mahaveer-Management-system';

  if (process.env.NODE_ENV !== 'production') {
    // Redirect root to base path in dev if accessing top-level
    app.get('/', (_req, res) => {
      res.redirect(`${BASE_PATH}/`);
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(BASE_PATH, express.static(distPath));
    app.use(express.static(distPath));
    app.get(['/Mahaveer-Management-system/*', '*'], (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚛 Transport Management System server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
