import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PackageCheck,
  X,
  Truck,
  UserCheck,
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  FileText,
  Box,
  Calculator,
  Scale,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  ChevronDown,
  Search,
  Users,
  Check,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  FileUp,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { LREntry, Customer, Driver, Vehicle, PaymentType, LRStatus, LocationRate, BoxDimensionItem } from '../types';
import { StorageService } from '../utils/storage';
import { initialCustomers } from '../data/initialData';
import { getApiUrl, sanitizeApiErrorMessage } from '../utils/apiConfig';

interface LRFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLR: (lr: LREntry) => void;
  onSaveCustomer?: (customer: Customer) => void;
  editingLR?: LREntry | null;
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  existingLRs: LREntry[];
  locationRates?: LocationRate[];
}

export const LRFormModal: React.FC<LRFormModalProps> = ({
  isOpen,
  onClose,
  onSaveLR,
  onSaveCustomer,
  editingLR,
  customers: propCustomers,
  drivers: propDrivers,
  vehicles: propVehicles,
  existingLRs,
  locationRates = []
}) => {
  if (!isOpen) return null;

  // Always guarantee valid customer list from props, storage, or default master
  const customers = useMemo(() => {
    if (propCustomers && propCustomers.length > 0) return propCustomers;
    const fromStorage = StorageService.getCustomers();
    if (fromStorage && fromStorage.length > 0) return fromStorage;
    return initialCustomers;
  }, [propCustomers, isOpen]);

  const drivers = useMemo(() => {
    if (propDrivers && propDrivers.length > 0) return propDrivers;
    return StorageService.getDrivers();
  }, [propDrivers, isOpen]);

  const vehicles = useMemo(() => {
    if (propVehicles && propVehicles.length > 0) return propVehicles;
    return StorageService.getVehicles();
  }, [propVehicles, isOpen]);

  const generateAutoLRNumber = (): string => {
    if (!existingLRs || existingLRs.length === 0) return 'LR-2026-1001';

    let maxNum = 1000;
    existingLRs.forEach((lr) => {
      if (!lr.lrNumber) return;
      const digits = lr.lrNumber.replace(/\D/g, '');
      if (digits) {
        const num = parseInt(digits, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    if (maxNum === 1000) return 'LR-2026-1001';

    const nextNum = maxNum + 1;
    const str = nextNum.toString();
    const last4 = str.slice(-4);
    return `LR-2026-${last4}`;
  };

  const [lrNumber, setLrNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [consignorName, setConsignorName] = useState('');
  const [consignorAddress, setConsignorAddress] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packageUnit, setPackageUnit] = useState<'Box' | 'Cartons' | 'Drums' | 'Packages' | 'Bags' | 'Nos' | 'Tons' | 'Kg' | 'Quintal'>('Packages');
  const [weight, setWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<LREntry['weightUnit']>('Kg');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  
  // Rate & Charges Breakdown States
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState<number | ''>('');
  const [ratePerKg, setRatePerKg] = useState<number | ''>('');
  const [actualWeight, setActualWeight] = useState<number | ''>('');
  const [chargedWeight, setChargedWeight] = useState<number | ''>('');
  const [docketCharge, setDocketCharge] = useState<number>(100);
  const [fovCharge, setFovCharge] = useState<number>(0);
  const [fscCharge, setFscCharge] = useState<number>(0);
  const [odaCharge, setOdaCharge] = useState<number>(0);
  const [appointmentCharge, setAppointmentCharge] = useState<number>(0);
  
  const [freight, setFreight] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('To Be Billed');
  const [status, setStatus] = useState<LRStatus>('In Transit');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [podUrl, setPodUrl] = useState<string>('');

  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [showConsignorDropdown, setShowConsignorDropdown] = useState(false);
  const [showConsigneeDropdown, setShowConsigneeDropdown] = useState(false);

  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const consignorDropdownRef = useRef<HTMLDivElement>(null);
  const consigneeDropdownRef = useRef<HTMLDivElement>(null);

  // PDF Upload & AI Auto-Fill States
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfExtractionResult, setPdfExtractionResult] = useState<{
    success: boolean;
    consignorStatus?: 'existing' | 'created';
    consignorName?: string;
    consignorCode?: string;
    consigneeName?: string;
    route?: string;
    material?: string;
    quantity?: string;
    invoiceNo?: string;
    invoiceValue?: number;
    extractedFieldsCount?: number;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(e.target as Node)) {
        setShowPartyDropdown(false);
      }
      if (consignorDropdownRef.current && !consignorDropdownRef.current.contains(e.target as Node)) {
        setShowConsignorDropdown(false);
      }
      if (consigneeDropdownRef.current && !consigneeDropdownRef.current.contains(e.target as Node)) {
        setShowConsigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-Dimension States & Volumetric Weight Calculator
  const [dimensions, setDimensions] = useState<BoxDimensionItem[]>([
    { id: 'dim-1', length: '' as any, width: '' as any, height: '' as any, boxes: 1, cft: 0, dimensionWeight: 0, remarks: '' }
  ]);
  const [boxLength, setBoxLength] = useState<number | ''>('');
  const [boxHeight, setBoxHeight] = useState<number | ''>('');
  const [boxWidth, setBoxWidth] = useState<number | ''>('');
  const [noOfBoxes, setNoOfBoxes] = useState<number | ''>('');
  const [showBoxCalc, setShowBoxCalc] = useState(false);

  // Auto-calculated balance
  const balance = Math.max(0, (Number(freight) || 0) - (Number(advance) || 0));

  // Multi-dimension dynamic calculation
  const dimensionsSummary = useMemo(() => {
    let totalBoxes = 0;
    let totalCFT = 0;
    let totalDimWeight = 0;

    const computedItems: BoxDimensionItem[] = dimensions.map((item) => {
      const l = Number(item.length) || 0;
      const w = Number(item.width) || 0;
      const h = Number(item.height) || 0;
      const b = Number(item.boxes) || 0;

      const cubicInchesPerBox = l * w * h;
      const cftPerBox = cubicInchesPerBox > 0 ? cubicInchesPerBox / 1728 : 0;
      const dimWeightPerBox = cubicInchesPerBox > 0 ? (h * w * l / 1728) * 6 : 0;

      const rowCFT = Math.round(cftPerBox * b * 100) / 100;
      const rowDimWeight = Math.round(dimWeightPerBox * b * 100) / 100;

      if (b > 0 && l > 0 && w > 0 && h > 0) {
        totalBoxes += b;
        totalCFT += rowCFT;
        totalDimWeight += rowDimWeight;
      }

      return {
        ...item,
        length: item.length,
        width: item.width,
        height: item.height,
        boxes: item.boxes,
        cft: rowCFT,
        dimensionWeight: rowDimWeight
      };
    });

    const roundedTotalCFT = Math.round(totalCFT * 100) / 100;
    const roundedTotalDimWeight = Math.round(totalDimWeight * 100) / 100;

    return {
      items: computedItems,
      totalBoxes,
      totalCFT: roundedTotalCFT,
      totalDimWeight: roundedTotalDimWeight,
      hasDimensions: roundedTotalDimWeight > 0
    };
  }, [dimensions]);

  const calculatedCFT = dimensionsSummary.totalCFT;
  const calculatedVolumetricWeight = dimensionsSummary.totalDimWeight;
  const totalCartonBoxes = dimensionsSummary.totalBoxes;

  // Add new dimension row
  const handleAddDimensionRow = () => {
    setDimensions((prev) => [
      ...prev,
      {
        id: `dim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        length: '' as any,
        width: '' as any,
        height: '' as any,
        boxes: 1,
        cft: 0,
        dimensionWeight: 0,
        remarks: ''
      }
    ]);
  };

  // Remove a dimension row
  const handleRemoveDimensionRow = (id: string) => {
    if (dimensions.length <= 1) {
      setDimensions([
        {
          id: `dim-${Date.now()}`,
          length: '' as any,
          width: '' as any,
          height: '' as any,
          boxes: 1,
          cft: 0,
          dimensionWeight: 0,
          remarks: ''
        }
      ]);
      return;
    }
    setDimensions((prev) => prev.filter((d) => d.id !== id));
  };

  // Update a single dimension row field
  const handleUpdateDimensionRow = (
    id: string,
    field: 'length' | 'width' | 'height' | 'boxes' | 'remarks',
    value: any
  ) => {
    setDimensions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    );
  };

  // Auto-update weight when box dimensions are entered
  useEffect(() => {
    if (dimensionsSummary.hasDimensions && dimensionsSummary.totalDimWeight > 0) {
      setWeight(dimensionsSummary.totalDimWeight);
      setActualWeight(dimensionsSummary.totalDimWeight);
      setChargedWeight(dimensionsSummary.totalDimWeight);
      setWeightUnit('Kg');
      if (dimensionsSummary.totalBoxes > 0 && (!quantity || quantity === '1 Unit' || quantity === '' || quantity.includes('Carton') || !isNaN(Number(quantity)))) {
        setQuantity(`${dimensionsSummary.totalBoxes}`);
        setPackageUnit('Cartons');
      }
      if (dimensions.length > 0) {
        setBoxLength(Number(dimensions[0].length) || '');
        setBoxHeight(Number(dimensions[0].height) || '');
        setBoxWidth(Number(dimensions[0].width) || '');
        setNoOfBoxes(Number(dimensions[0].boxes) || '');
      }
    }
  }, [dimensionsSummary.totalDimWeight, dimensionsSummary.totalBoxes]);

  // Route Auto Rate Lookup
  useEffect(() => {
    if (deliveryLocation && locationRates && locationRates.length > 0) {
      const matched = locationRates.find(
        (r) =>
          r.toLocation.toLowerCase().trim() === deliveryLocation.toLowerCase().trim() ||
          r.fromLocation.toLowerCase().trim() === deliveryLocation.toLowerCase().trim()
      );
      if (matched) {
        setRatePerKg(matched.ratePerKg);
        setDocketCharge(100);
        setOdaCharge(matched.odaCharge ?? 0);
        setAppointmentCharge(matched.appointmentCharge ?? 0);
      }
    }
  }, [deliveryLocation, locationRates]);

  // Recalculate freight total from charges breakdown automatically
  useEffect(() => {
    const act = Number(actualWeight) || Number(weight) || 35;
    const cw = Number(chargedWeight) || Math.max(act, 35);
    const rate = Number(ratePerKg) || 0;
    const invVal = Number(invoiceValue) || 0;

    const calcBasicFr = Number((cw * rate).toFixed(2));
    const calcFov = invVal > 0 ? Number(Math.max(100, invVal * 0.01).toFixed(2)) : 0;
    const calcFsc = Number((calcBasicFr * 0.08).toFixed(2));

    setFovCharge(calcFov);
    setFscCharge(calcFsc);

    const docCharge = typeof docketCharge === 'number' ? docketCharge : 100;
    const calcTotal = Number(
      (calcBasicFr + docCharge + calcFov + calcFsc + (Number(odaCharge) || 0) + (Number(appointmentCharge) || 0)).toFixed(2)
    );

    if (calcTotal > 0) {
      setFreight(calcTotal);
    }
  }, [actualWeight, chargedWeight, ratePerKg, invoiceValue, docketCharge, odaCharge, appointmentCharge, weight]);

  useEffect(() => {
    if (editingLR) {
      setLrNumber(editingLR.lrNumber);
      setBookingDate(editingLR.bookingDate);
      setPartyId(editingLR.partyId || '');
      setPartyName(editingLR.partyName);
      setConsignorName(editingLR.consignorName);
      setConsignorAddress(editingLR.consignorAddress);
      setConsigneeName(editingLR.consigneeName);
      setConsigneeAddress(editingLR.consigneeAddress);
      setPickupLocation(editingLR.pickupLocation);
      setDeliveryLocation(editingLR.deliveryLocation);
      setMaterial(editingLR.material);
      setQuantity(editingLR.quantity);
      setPackageUnit(editingLR.packageUnit || 'Packages');
      setWeight(editingLR.weight);
      setWeightUnit(editingLR.weightUnit);
      setVehicleNumber(editingLR.vehicleNumber || '');
      setDriverName(editingLR.driverName || '');
      setDriverMobile(editingLR.driverMobile || '');
      setInvoiceNumber(editingLR.invoiceNumber || '');
      setInvoiceValue(editingLR.invoiceValue ?? '');
      setRatePerKg(editingLR.ratePerKg ?? '');
      setActualWeight(editingLR.actualWeight ?? editingLR.weight ?? '');
      setChargedWeight(editingLR.chargedWeight ?? editingLR.actualWeight ?? editingLR.weight ?? '');
      setDocketCharge(editingLR.docketCharge ?? 100);
      setFovCharge(editingLR.fovCharge ?? 0);
      setFscCharge(editingLR.fscCharge ?? 0);
      setOdaCharge(editingLR.odaCharge ?? 0);
      setAppointmentCharge(editingLR.appointmentCharge ?? 0);
      setFreight(editingLR.freight);
      setAdvance(editingLR.advance);
      setDeliveryDate(editingLR.deliveryDate);
      setPaymentType(editingLR.paymentType);
      setStatus(editingLR.status);
      setTrackingNumber(editingLR.trackingNumber || `DPW-IN-${Math.floor(100000 + Math.random() * 900000)}`);
      setRemarks(editingLR.remarks);
      setPodUrl(editingLR.podUrl || '');
      setBoxLength(editingLR.boxLength ?? '');
      setBoxHeight(editingLR.boxHeight ?? '');
      setBoxWidth(editingLR.boxWidth ?? '');
      setNoOfBoxes(editingLR.noOfBoxes ?? '');
      setShowBoxCalc(Boolean(editingLR.boxLength || editingLR.cft || (editingLR.dimensions && editingLR.dimensions.length > 0)));
      
      if (editingLR.dimensions && editingLR.dimensions.length > 0) {
        setDimensions(editingLR.dimensions);
      } else if (editingLR.boxLength && (Number(editingLR.boxLength) > 0)) {
        setDimensions([
          {
            id: 'dim-1',
            length: editingLR.boxLength,
            width: editingLR.boxWidth || ('' as any),
            height: editingLR.boxHeight || ('' as any),
            boxes: editingLR.noOfBoxes || 1,
            cft: editingLR.cft || 0,
            dimensionWeight: editingLR.volumetricWeight || 0,
            remarks: ''
          }
        ]);
      } else {
        setDimensions([
          {
            id: 'dim-1',
            length: '' as any,
            width: '' as any,
            height: '' as any,
            boxes: 1,
            cft: 0,
            dimensionWeight: 0,
            remarks: ''
          }
        ]);
      }
    } else {
      const autoLR = generateAutoLRNumber();
      const numPart = autoLR.replace(/\D/g, '');

      setLrNumber(autoLR);
      setBookingDate(new Date().toISOString().split('T')[0]);
      setPartyId('');
      setPartyName('');
      setConsignorName('');
      setConsignorAddress('');
      setConsigneeName('');
      setConsigneeAddress('');
      setPickupLocation('');
      setDeliveryLocation('');
      setMaterial('');
      setQuantity('');
      setPackageUnit('Packages');
      setWeight('');
      setWeightUnit('Kg');
      setVehicleNumber('');
      setDriverName('');
      setDriverMobile('');
      setInvoiceNumber('');
      setInvoiceValue('');
      setRatePerKg('');
      setActualWeight('');
      setChargedWeight('');
      setDocketCharge(100);
      setFovCharge(0);
      setFscCharge(0);
      setOdaCharge(0);
      setAppointmentCharge(0);
      setFreight(0);
      setAdvance(0);
      setDeliveryDate('');
      setPaymentType('To Be Billed');
      setStatus('In Transit');
      setTrackingNumber(`DPW-IN-${numPart}`);
      setRemarks('');
      setPodUrl('');
      setBoxLength('');
      setBoxHeight('');
      setBoxWidth('');
      setNoOfBoxes('');
      setShowBoxCalc(false);
      setDimensions([
        {
          id: `dim-${Date.now()}`,
          length: '' as any,
          width: '' as any,
          height: '' as any,
          boxes: 1,
          cft: 0,
          dimensionWeight: 0,
          remarks: ''
        }
      ]);
    }
  }, [editingLR, isOpen]);

  // PDF Upload & AI Auto-Fill Function
  const handleProcessPdfFile = async (file: File) => {
    if (!file) return;

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    if (!validMimes.includes(file.type) && !isPdfExt) {
      setPdfError('Please upload a PDF document (or invoice image JPG/PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setPdfError('File size is too large (Maximum size 15MB).');
      return;
    }

    setIsAnalyzingPdf(true);
    setPdfError(null);
    setPdfFileName(file.name);
    setPdfExtractionResult(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), 75000);

      let response: Response;
      const apiUrl = getApiUrl('/api/extract-lr-pdf');

      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            mimeType: file.type || 'application/pdf',
            filename: file.name
          }),
          signal: controller.signal
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutTimer);

        if (fetchErr?.name === 'AbortError') {
          throw new Error(
            `Extraction timed out for "${file.name}". Server processing took longer than expected.`
          );
        }

        throw new Error(
          sanitizeApiErrorMessage(fetchErr?.message || 'Network request failed.')
        );
      }

      clearTimeout(timeoutTimer);

      const rawResponseText = await response.text();
      let resJson: any = {};

      try {
        resJson = JSON.parse(rawResponseText);
      } catch {
        throw new Error(sanitizeApiErrorMessage(rawResponseText));
      }

      if (!response.ok || !resJson.success) {
        throw new Error(
          sanitizeApiErrorMessage(resJson.error || `Failed to read ${file.name}`)
        );
      }

      const data = resJson.data || {};
      let extractedCount = 0;
      let consignorStatus: 'existing' | 'created' | undefined = undefined;
      let appliedConsignorName = '';
      let appliedConsignorCode = '';

      // 1. CONSIGNOR / SENDER (Bhejne Wala)
      const rawConsignorName = (data.consignorName || '').trim();
      if (rawConsignorName) {
        extractedCount++;
        appliedConsignorName = rawConsignorName;

        const existingCust = customers.find(
          (c) =>
            c.name.toLowerCase().trim() === rawConsignorName.toLowerCase() ||
            (rawConsignorName.length >= 4 &&
              (c.name.toLowerCase().includes(rawConsignorName.toLowerCase()) ||
                rawConsignorName.toLowerCase().includes(c.name.toLowerCase().trim())))
        );

        if (existingCust) {
          consignorStatus = 'existing';
          appliedConsignorName = existingCust.name;
          appliedConsignorCode = existingCust.code;

          setPartyId(existingCust.id);
          setPartyName(existingCust.name);
          setConsignorName(existingCust.name);

          const addr = existingCust.address || data.consignorAddress || '';
          const city = existingCust.city || data.consignorCity || data.pickupLocation || '';
          const fullAddr = addr
            ? city && !addr.toLowerCase().includes(city.toLowerCase())
              ? `${addr}, ${city}`
              : addr
            : city;
          setConsignorAddress(fullAddr);
          if (city) {
            setPickupLocation(city.toUpperCase());
          }
        } else {
          consignorStatus = 'created';
          const nextCode = `CUST-${1000 + customers.length + 1}`;
          appliedConsignorCode = nextCode;

          const newCustomer: Customer = {
            id: `cust-${Date.now()}`,
            code: nextCode,
            name: rawConsignorName,
            gstNo: (data.consignorGstNo || '').trim(),
            pan: '',
            mobile: (data.consignorMobile || '').trim(),
            email: '',
            address: (data.consignorAddress || '').trim(),
            city: (data.consignorCity || data.pickupLocation || '').trim(),
            state: (data.consignorState || '').trim(),
            creditDays: 30,
            creditLimit: 0,
            openingBalance: 0,
            documents: [],
            createdAt: new Date().toISOString()
          };

          StorageService.saveCustomer(newCustomer);
          if (onSaveCustomer) {
            onSaveCustomer(newCustomer);
          }

          setPartyId(newCustomer.id);
          setPartyName(newCustomer.name);
          setConsignorName(newCustomer.name);

          const addr = newCustomer.address;
          const city = newCustomer.city;
          const fullAddr = addr
            ? city && !addr.toLowerCase().includes(city.toLowerCase())
              ? `${addr}, ${city}`
              : addr
            : city;
          setConsignorAddress(fullAddr);
          if (city) {
            setPickupLocation(city.toUpperCase());
          }
        }
      } else if (data.consignorAddress) {
        setConsignorAddress(data.consignorAddress.trim());
        extractedCount++;
      }

      // 2. CONSIGNEE / RECEIVER (Prapt Karta) -> NO LEDGER CREATION
      if (data.consigneeName) {
        setConsigneeName(data.consigneeName.trim());
        extractedCount++;
      }
      if (data.consigneeAddress) {
        setConsigneeAddress(data.consigneeAddress.trim());
        extractedCount++;
      }
      if (data.consigneeCity || data.deliveryLocation) {
        const destCity = (data.deliveryLocation || data.consigneeCity).trim().toUpperCase();
        setDeliveryLocation(destCity);
        extractedCount++;
      }

      // 3. ROUTE DETAILS
      if (data.pickupLocation) {
        setPickupLocation(data.pickupLocation.trim().toUpperCase());
        extractedCount++;
      }
      if (data.deliveryLocation) {
        setDeliveryLocation(data.deliveryLocation.trim().toUpperCase());
        extractedCount++;
      }

      // 4. MATERIAL DETAILS
      if (data.material) {
        setMaterial(data.material.trim());
        extractedCount++;
      }
      if (data.quantity) {
        setQuantity(String(data.quantity).trim());
        extractedCount++;
      } else if (data.packageCount) {
        const qStr = data.packageUnit ? `${data.packageCount} ${data.packageUnit}` : String(data.packageCount);
        setQuantity(qStr.trim());
        extractedCount++;
      }

      if (data.packageUnit) {
        const unitLower = String(data.packageUnit).toLowerCase();
        if (unitLower.includes('carton')) setPackageUnit('Cartons');
        else if (unitLower.includes('box')) setPackageUnit('Box');
        else if (unitLower.includes('drum')) setPackageUnit('Drums');
        else if (unitLower.includes('bag')) setPackageUnit('Bags');
        else if (unitLower.includes('ton')) setPackageUnit('Tons');
        else if (unitLower.includes('kg') || unitLower.includes('kilo')) setPackageUnit('Kg');
        else if (unitLower.includes('quintal')) setPackageUnit('Quintal');
        else if (unitLower.includes('nos') || unitLower.includes('pouch') || unitLower.includes('pcs') || unitLower.includes('piece')) setPackageUnit('Nos');
        else setPackageUnit('Packages');
      }

      // 5. INVOICE DETAILS
      if (data.invoiceNumber) {
        setInvoiceNumber(String(data.invoiceNumber).trim());
        extractedCount++;
      }
      if (data.invoiceValue && !isNaN(Number(data.invoiceValue))) {
        setInvoiceValue(Number(data.invoiceValue));
        extractedCount++;
      }

      // 6. OPTIONAL FIELDS
      if (data.weight && !isNaN(Number(data.weight)) && Number(data.weight) > 0) {
        const wtVal = Number(data.weight);
        setWeight(wtVal);
        setActualWeight(wtVal);
        extractedCount++;
      }
      if (data.weightUnit) {
        const wu = String(data.weightUnit).toLowerCase();
        if (wu.includes('ton')) setWeightUnit('Tons');
        else if (wu.includes('quintal')) setWeightUnit('Quintal');
        else if (wu.includes('package')) setWeightUnit('Packages');
        else setWeightUnit('Kg');
      }
      if (data.vehicleNumber) {
        setVehicleNumber(String(data.vehicleNumber).trim().toUpperCase());
        extractedCount++;
      }
      if (data.ewayBillNo) {
        setRemarks((prev) => (prev ? `${prev} | E-Way Bill: ${data.ewayBillNo}` : `E-Way Bill: ${data.ewayBillNo}`));
        extractedCount++;
      }
      if (data.remarks) {
        setRemarks((prev) => (prev ? `${prev} | ${data.remarks}` : data.remarks));
      }

      setPdfExtractionResult({
        success: true,
        consignorStatus,
        consignorName: appliedConsignorName || data.consignorName,
        consignorCode: appliedConsignorCode,
        consigneeName: data.consigneeName,
        route: `${data.pickupLocation || data.consignorCity || 'Origin'} ➔ ${data.deliveryLocation || data.consigneeCity || 'Destination'}`,
        material: data.material,
        quantity: data.quantity || (data.packageCount ? `${data.packageCount} ${data.packageUnit || ''}` : ''),
        invoiceNo: data.invoiceNumber,
        invoiceValue: data.invoiceValue,
        extractedFieldsCount: extractedCount
      });
    } catch (err: any) {
      console.error('PDF Extraction Error:', err);
      setPdfError(err.message || 'Error parsing PDF document. Please verify and fill remaining fields manually.');
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  // Handle POD File Uploader
  const handlePODFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('POD Document file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPodUrl(reader.result as string);
        if (status !== 'Delivered') {
          setStatus('Delivered');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic filtering of customers from Customer Master for Party / Customer Name
  const filteredCustomersForParty = customers.filter((c) => {
    const q = partyName.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.gstNo && c.gstNo.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q))
    );
  });

  const filteredCustomersForConsignor = customers.filter((c) => {
    const q = consignorName.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const consigneeSuggestionsList = [
    ...customers.map((c) => ({
      name: c.name,
      address: c.address ? (c.city && !c.address.toLowerCase().includes(c.city.toLowerCase()) ? `${c.address}, ${c.city}` : c.address) : c.city,
      city: c.city,
      gstNo: c.gstNo,
      type: 'Customer Master'
    })),
    ...existingLRs
      .filter((lr) => lr.consigneeName && !customers.some((c) => c.name.toLowerCase() === lr.consigneeName.toLowerCase()))
      .map((lr) => ({
        name: lr.consigneeName,
        address: lr.consigneeAddress || '',
        city: lr.deliveryLocation || '',
        gstNo: '',
        type: 'Recent Bilty'
      }))
  ].filter((item, index, self) => index === self.findIndex((t) => t.name.toLowerCase().trim() === item.name.toLowerCase().trim()));

  const filteredConsigneeSuggestions = consigneeSuggestionsList.filter((c) => {
    const q = consigneeName.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleSelectCustomerItem = (cust: Customer) => {
    setPartyName(cust.name);
    setPartyId(cust.id);
    setConsignorName(cust.name);
    
    const addr = cust.address || '';
    const city = cust.city || '';
    const fullAddr = addr
      ? city && !addr.toLowerCase().includes(city.toLowerCase())
        ? `${addr}, ${city}`
        : addr
      : city;
    setConsignorAddress(fullAddr);
    
    if (city) {
      setPickupLocation(city.toUpperCase());
    }

    setShowPartyDropdown(false);
  };

  const handleSelectConsignorItem = (cust: Customer) => {
    setConsignorName(cust.name);
    const addr = cust.address || '';
    const city = cust.city || '';
    const fullAddr = addr
      ? city && !addr.toLowerCase().includes(city.toLowerCase())
        ? `${addr}, ${city}`
        : addr
      : city;
    setConsignorAddress(fullAddr);
    if (city) {
      setPickupLocation(city.toUpperCase());
    }
    setShowConsignorDropdown(false);
  };

  const handleSelectConsigneeItem = (item: { name: string; address?: string; city?: string }) => {
    setConsigneeName(item.name);
    if (item.address) {
      setConsigneeAddress(item.address);
    }
    if (item.city) {
      setDeliveryLocation(item.city.toUpperCase());
    }
    setShowConsigneeDropdown(false);
  };

  const handleCustomerSelect = (custName: string) => {
    setPartyName(custName);
    const selectedCust = customers.find(
      (c) =>
        c.name.toLowerCase().trim() === custName.toLowerCase().trim() ||
        c.name.toLowerCase().includes(custName.toLowerCase().trim()) ||
        custName.toLowerCase().includes(c.name.toLowerCase().trim())
    );

    if (selectedCust) {
      setPartyId(selectedCust.id);
      setConsignorName(selectedCust.name);
      const addr = selectedCust.address || '';
      const city = selectedCust.city || '';
      const fullAddr = addr
        ? city && !addr.toLowerCase().includes(city.toLowerCase())
          ? `${addr}, ${city}`
          : addr
        : city;
      setConsignorAddress(fullAddr);
      if (city) {
        setPickupLocation(city.toUpperCase());
      }
    } else {
      setConsignorName(custName);
    }
  };

  const handleDriverSelect = (dName: string) => {
    setDriverName(dName);
    const selectedDrv = drivers.find((d) => d.name === dName);
    if (selectedDrv) {
      setDriverMobile(selectedDrv.mobile);
      if (selectedDrv.assignedVehicleNo && !vehicleNumber) {
        setVehicleNumber(selectedDrv.assignedVehicleNo);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName) {
      alert('Please select or enter Party / Customer Name');
      return;
    }

    const savedLR: LREntry = {
      id: editingLR ? editingLR.id : `lr-${Date.now()}`,
      lrNumber: lrNumber || generateAutoLRNumber(),
      bookingDate,
      partyId,
      partyName,
      consignorName: consignorName || partyName,
      consignorAddress,
      consigneeName,
      consigneeAddress,
      pickupLocation,
      deliveryLocation,
      material,
      quantity,
      packageUnit,
      weight: Number(weight) || 0,
      weightUnit,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverMobile,
      invoiceNumber: invoiceNumber.trim(),
      invoiceValue: Number(invoiceValue) || undefined,
      ratePerKg: Number(ratePerKg) || undefined,
      actualWeight: Number(actualWeight) || Number(weight) || undefined,
      chargedWeight: Number(chargedWeight) || undefined,
      basicFreight: Number((Number(chargedWeight || weight) * Number(ratePerKg || 0)).toFixed(2)) || undefined,
      docketCharge,
      fovCharge,
      fscCharge,
      odaCharge,
      appointmentCharge,
      freight: Number(freight) || 0,
      advance: Number(advance) || 0,
      balance,
      deliveryDate,
      paymentType,
      status,
      trackingNumber: trackingNumber.trim() || `DPW-IN-${Math.floor(100000 + Math.random() * 900000)}`,
      remarks,
      podUrl: podUrl || undefined,
      podUploadDate: podUrl ? (editingLR?.podUploadDate || new Date().toISOString().split('T')[0]) : undefined,
      boxLength: Number(boxLength) || (dimensions.length > 0 ? Number(dimensions[0].length) : undefined) || undefined,
      boxHeight: Number(boxHeight) || (dimensions.length > 0 ? Number(dimensions[0].height) : undefined) || undefined,
      boxWidth: Number(boxWidth) || (dimensions.length > 0 ? Number(dimensions[0].width) : undefined) || undefined,
      noOfBoxes: Number(noOfBoxes) || (dimensionsSummary.totalBoxes > 0 ? dimensionsSummary.totalBoxes : undefined) || undefined,
      cft: calculatedCFT || undefined,
      volumetricWeight: calculatedVolumetricWeight || undefined,
      dimensions: dimensionsSummary.items.filter(d => (Number(d.length) > 0 || Number(d.height) > 0 || Number(d.width) > 0)),
      totalDimensionsWeight: dimensionsSummary.totalDimWeight || undefined,
      createdAt: editingLR ? editingLR.createdAt : new Date().toISOString()
    };

    onSaveLR(savedLR);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-6 w-6 text-orange-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                {editingLR ? `Edit Lorry Receipt: ${editingLR.lrNumber}` : 'New Booking / LR Entry (Bilty)'}
              </h3>
              <p className="text-xs text-slate-400">
                Lorry Receipt (Bilty) generation with freight, advance & delivery locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* AI PDF / Document Auto-Fill Dropzone Box */}
          <div
            id="pdf-autofill-section"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessPdfFile(e.dataTransfer.files[0]);
              }
            }}
            className={`rounded-2xl border transition-all ${
              isDragOver
                ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                : 'border-orange-500/40 bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900'
            } p-4 sm:p-5`}
          >
            <input
              type="file"
              ref={pdfFileInputRef}
              accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessPdfFile(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>PDF Upload & AI Auto-Fill (LR / Bilty)</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 font-semibold px-2 py-0.5 rounded-full border border-orange-500/30">
                      Smart AI Engine
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Upload Tax Invoice, Delivery Challan, E-Way Bill or Bilty PDF to automatically fill form fields.
                  </p>
                </div>
              </div>

              {/* Upload Trigger Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {pdfExtractionResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfExtractionResult(null);
                      setPdfFileName(null);
                      setPdfError(null);
                      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  disabled={isAnalyzingPdf}
                  onClick={() => pdfFileInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isAnalyzingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Reading PDF with AI...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4" />
                      <span>{pdfFileName ? 'Re-upload / Change PDF' : 'Upload PDF / Invoice Document'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {pdfError && (
              <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{pdfError}</p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">
                    You can still fill in all LR details manually below.
                  </p>
                </div>
              </div>
            )}

            {/* Loading State Animation */}
            {isAnalyzingPdf && (
              <div className="mt-3 p-4 bg-slate-800/80 border border-orange-500/30 rounded-xl flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">
                      AI is analyzing <span className="text-orange-400 font-mono">{pdfFileName}</span>
                    </p>
                    <span className="text-[10px] text-orange-300 font-mono animate-pulse">Extracting fields...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Identifying Consignor (Checking/Creating Ledger), Consignee, Route, Material & Invoice values...
                  </p>
                </div>
              </div>
            )}

            {/* Extraction Success Card */}
            {pdfExtractionResult && !isAnalyzingPdf && (
              <div className="mt-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">
                      Document Auto-Fill Completed ({pdfExtractionResult.extractedFieldsCount} fields identified)
                    </span>
                  </div>
                  {pdfFileName && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {pdfFileName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {/* Consignor Ledger Notice */}
                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      1. Consignor (Bhejne Wala)
                    </span>
                    <p className="font-bold text-white truncate">
                      {pdfExtractionResult.consignorName || 'Identified in form'}
                    </p>
                    <div className="mt-1">
                      {pdfExtractionResult.consignorStatus === 'existing' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                          <Check className="h-3 w-3 text-emerald-400" />
                          Existing Ledger Linked ({pdfExtractionResult.consignorCode || 'Master'})
                        </span>
                      )}
                      {pdfExtractionResult.consignorStatus === 'created' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          New Ledger Created: {pdfExtractionResult.consignorCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consignee */}
                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      2. Consignee (Prapt Karta)
                    </span>
                    <p className="font-bold text-white truncate">
                      {pdfExtractionResult.consigneeName || 'Auto-filled in LR'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      LR Entry only (No ledger created)
                    </span>
                  </div>

                  {/* Route & Material */}
                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      3. Route & Material
                    </span>
                    <p className="font-semibold text-amber-300 truncate">
                      {pdfExtractionResult.route}
                    </p>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      {pdfExtractionResult.material || 'Material auto-filled'} {pdfExtractionResult.quantity ? `(${pdfExtractionResult.quantity})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>💡 All extracted fields are editable below. Review details and click &quot;Save LR & Issue Bilty&quot; when ready.</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Section 1: LR Number, Tracking No, Date & Party Invoice */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>1. Booking, Tracking, Party & Invoice Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  LR / Bilty Number (Auto Serial) *
                </label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  required
                  placeholder="Enter LR Number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tracking No / Docket No *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter Tracking / Docket No."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Booking Date *
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Party / Customer Name Auto Suggestion */}
              <div className="relative" ref={partyDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Party / Customer Name (Auto Suggestion) *
                  </label>
                  <span className="text-[10px] font-bold text-orange-400">
                    {customers.length} Parties in Master
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={partyName}
                    onFocus={() => setShowPartyDropdown(true)}
                    onChange={(e) => {
                      setPartyName(e.target.value);
                      setShowPartyDropdown(true);
                      handleCustomerSelect(e.target.value);
                    }}
                    placeholder="Type or click to choose customer..."
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-orange-400 p-0.5 rounded"
                    title="Toggle Customer Master Suggestions"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showPartyDropdown ? 'rotate-180 text-orange-400' : ''}`} />
                  </button>
                </div>

                {/* Floating Suggestions Popover */}
                {showPartyDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-orange-500/60 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-800 text-xs">
                    <div className="bg-slate-800/90 px-3 py-2 text-[11px] font-bold text-orange-300 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-orange-400" />
                        <span>Customer Master ({filteredCustomersForParty.length} available)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Click to auto-fill Shipper info</span>
                    </div>

                    {filteredCustomersForParty.length > 0 ? (
                      filteredCustomersForParty.map((cust) => {
                        const isSelected = partyName.toLowerCase().trim() === cust.name.toLowerCase().trim();
                        return (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomerItem(cust)}
                            className={`p-3 cursor-pointer transition-colors hover:bg-orange-500/10 hover:border-l-4 hover:border-orange-500 ${
                              isSelected ? 'bg-orange-500/15 border-l-4 border-orange-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                                {cust.name}
                                {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 inline" />}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {cust.city && (
                                  <span className="bg-slate-800 border border-slate-700 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                    {cust.city}
                                  </span>
                                )}
                                <span className="bg-orange-950 text-orange-300 border border-orange-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                                  {cust.code}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {cust.gstNo && (
                                <span className="font-mono text-slate-300">
                                  <strong className="text-slate-400">GST:</strong> {cust.gstNo}
                                </span>
                              )}
                              {cust.mobile && (
                                <span>
                                  <strong className="text-slate-400">Mob:</strong> {cust.mobile}
                                </span>
                              )}
                            </div>

                            {cust.address && (
                              <div className="text-[10px] text-slate-400 truncate mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                <span>{cust.address}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 space-y-2">
                        <p className="text-xs">No matching party found for &quot;{partyName}&quot;.</p>
                        {partyName && (
                          <button
                            type="button"
                            onClick={() => setShowPartyDropdown(false)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded text-xs border border-slate-700"
                          >
                            Use typed custom name: &quot;{partyName}&quot;
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Party Invoice / Bill Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter Party Invoice No."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invoice Goods Value (₹) (1% FOV Charge)
                </label>
                <input
                  type="number"
                  value={invoiceValue}
                  onChange={(e) => setInvoiceValue(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Enter Goods Value (₹)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consignor & Consignee */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>2. Consignor (Sender) & Consignee (Receiver)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/*