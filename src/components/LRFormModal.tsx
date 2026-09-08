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
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Receipt
} from 'lucide-react';
import { LREntry, Customer, Driver, Vehicle, PaymentType, LRStatus, LocationRate, BoxDimensionItem, AttachedInvoice } from '../types';
import { StorageService } from '../utils/storage';
import { initialCustomers } from '../data/initialData';

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

  // Always guarantee valid customer list from props or storage
  const customers = useMemo(() => {
    if (propCustomers !== undefined) return propCustomers;
    return StorageService.getCustomers();
  }, [propCustomers, isOpen]);

  const drivers = useMemo(() => {
    if (propDrivers !== undefined) return propDrivers;
    return StorageService.getDrivers();
  }, [propDrivers, isOpen]);

  const vehicles = useMemo(() => {
    if (propVehicles !== undefined) return propVehicles;
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
  const [fixedRate, setFixedRate] = useState<number | ''>(editingLR?.fixedRate ?? '');
  const [attachedInvoices, setAttachedInvoices] = useState<AttachedInvoice[]>(editingLR?.attachedInvoices || []);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState<number | ''>('');
  const [ratePerKg, setRatePerKg] = useState<number | ''>('');
  const [actualWeight, setActualWeight] = useState<number | ''>('');
  const [chargedWeight, setChargedWeight] = useState<number | ''>('');
  const [docketCharge, setDocketCharge] = useState<number>(100);
  const [fovCharge, setFovCharge] = useState<number>(0);
  const [fscCharge, setFscCharge] = useState<number>(0);
  const [handlingCharge, setHandlingCharge] = useState<number>(0);
  const [odaCharge, setOdaCharge] = useState<number>(0);
  const [appointmentCharge, setAppointmentCharge] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);

  // Handle Fixed Rate Input & Automatically Zero Out Bottom Surcharges
  const handleFixedRateChange = (val: number | '') => {
    setFixedRate(val);
    if (val !== '' && Number(val) > 0) {
      // User entered fixed rate -> zero out all breakdown surcharges
      setRatePerKg(0);
      setDocketCharge(0);
      setFovCharge(0);
      setFscCharge(0);
      setHandlingCharge(0);
      setOdaCharge(0);
      setAppointmentCharge(0);
      setOtherCharges(0);
      setFreight(Number(val));
    } else {
      // Cleared fixed rate -> restore standard docket charge
      setDocketCharge(100);
    }
  };
  
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
    combinedCount?: number;
    filesNotice?: string;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic GST Calculation States (0%, 5%, 12%, 18%)
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST'>('CGST_SGST');
  const [gstPaidBy, setGstPaidBy] = useState<string>('TRANSPORTER');

  const halfGstRate = gstPercent / 2;
  const taxableFreight = Number(freight) || 0;
  const cgstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'CGST_SGST') return 0;
    return Number(((taxableFreight * (halfGstRate / 100))).toFixed(2));
  }, [taxableFreight, gstPercent, gstType, halfGstRate]);

  const sgstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'CGST_SGST') return 0;
    return Number(((taxableFreight * (halfGstRate / 100))).toFixed(2));
  }, [taxableFreight, gstPercent, gstType, halfGstRate]);

  const igstAmount = useMemo(() => {
    if (gstPercent === 0 || gstType !== 'IGST') return 0;
    return Number(((taxableFreight * (gstPercent / 100))).toFixed(2));
  }, [taxableFreight, gstPercent, gstType]);

  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
  const totalWithGst = Number((taxableFreight + totalTaxAmount).toFixed(2));
  const balance = Math.max(0, Number((totalWithGst - (Number(advance) || 0)).toFixed(2)));

  // Multi-dimension dynamic calculation
  // Formula requested: Dimension = Height × Width × Length ÷ 1728 × 6
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
      // Per box formula: Height × Width × Length ÷ 1728 × 6
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
  // When carton dimensions or boxes count changes, update weight fields automatically
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
      // Also sync first dimension to legacy single fields
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
    if (fixedRate !== '' && Number(fixedRate) > 0) return;
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
  }, [deliveryLocation, locationRates, fixedRate]);

  // Recalculate freight total from charges breakdown automatically
  useEffect(() => {
    const hasFixedRate = fixedRate !== '' && Number(fixedRate) > 0;

    let baseFreight = 0;
    let calcFov = Number(fovCharge) || 0;
    let calcFsc = Number(fscCharge) || 0;

    if (hasFixedRate) {
      baseFreight = Number(fixedRate);
      calcFov = Number(fovCharge) || 0;
      calcFsc = Number(fscCharge) || 0;
    } else {
      const act = Number(actualWeight) || Number(weight) || 35;
      const cw = Number(chargedWeight) || Math.max(act, 35);
      const rate = Number(ratePerKg) || 0;
      const invVal = Number(invoiceValue) || 0;

      baseFreight = Number((cw * rate).toFixed(2));
      const autoFov = invVal > 0 ? Number(Math.max(100, invVal * 0.01).toFixed(2)) : 0;
      const autoFsc = Number((baseFreight * 0.08).toFixed(2));

      if (autoFov !== fovCharge) {
        setFovCharge(autoFov);
      }
      if (autoFsc !== fscCharge) {
        setFscCharge(autoFsc);
      }
      calcFov = autoFov;
      calcFsc = autoFsc;
    }

    const docCharge = typeof docketCharge === 'number' ? docketCharge : (hasFixedRate ? 0 : 100);
    const handling = Number(handlingCharge) || 0;
    const oda = Number(odaCharge) || 0;
    const appt = Number(appointmentCharge) || 0;
    const other = Number(otherCharges) || 0;

    const calcTotal = Number(
      (
        baseFreight +
        docCharge +
        calcFov +
        calcFsc +
        handling +
        oda +
        appt +
        other
      ).toFixed(2)
    );

    if (calcTotal > 0 || hasFixedRate) {
      setFreight(calcTotal);
    }
  }, [
    fixedRate,
    actualWeight,
    chargedWeight,
    ratePerKg,
    invoiceValue,
    docketCharge,
    fovCharge,
    fscCharge,
    handlingCharge,
    odaCharge,
    appointmentCharge,
    otherCharges,
    weight
  ]);

  useEffect(() => {
    if (editingLR) {
      setFixedRate(editingLR.fixedRate ?? '');
      setAttachedInvoices(editingLR.attachedInvoices || []);
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
      setDocketCharge(editingLR.docketCharge !== undefined ? editingLR.docketCharge : (editingLR.fixedRate ? 0 : 100));
      setFovCharge(editingLR.fovCharge ?? 0);
      setFscCharge(editingLR.fscCharge ?? 0);
      setHandlingCharge(editingLR.handlingCharge ?? 0);
      setOdaCharge(editingLR.odaCharge ?? 0);
      setAppointmentCharge(editingLR.appointmentCharge ?? 0);
      setOtherCharges(editingLR.otherCharges ?? 0);
      setFreight(editingLR.freight);
      setAdvance(editingLR.advance);
      setDeliveryDate(editingLR.deliveryDate);
      setPaymentType(editingLR.paymentType);
      setStatus(editingLR.status);
      setTrackingNumber(editingLR.trackingNumber || `DPW-IN-${Math.floor(100000 + Math.random() * 900000)}`);
      setGstPercent(editingLR.gstPercent !== undefined ? editingLR.gstPercent : 18);
      setGstType((editingLR.gstType as any) || 'CGST_SGST');
      setGstPaidBy(editingLR.gstPaidBy || 'TRANSPORTER');
      setRemarks(editingLR.remarks);
      setPodUrl(editingLR.podUrl || '');
      setBoxLength(editingLR.boxLength ?? '');
      setBoxHeight(editingLR.boxHeight ?? '');
      setBoxWidth(editingLR.boxWidth ?? '');
      setNoOfBoxes(editingLR.noOfBoxes ?? '');
      setShowBoxCalc(Boolean(editingLR.boxLength || editingLR.cft || (editingLR.dimensions && editingLR.dimensions.length > 0)));
      
      // Hydrate multi-dimensions
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
      setFixedRate('');
      setAttachedInvoices([]);
      setInvoiceNumber('');
      setInvoiceValue('');
      setRatePerKg('');
      setActualWeight('');
      setChargedWeight('');
      setDocketCharge(100);
      setFovCharge(0);
      setFscCharge(0);
      setHandlingCharge(0);
      setOdaCharge(0);
      setAppointmentCharge(0);
      setOtherCharges(0);
      setFreight(0);
      setAdvance(0);
      setDeliveryDate('');
      setPaymentType('To Be Billed');
      setStatus('In Transit');
      setTrackingNumber(`DPW-IN-${numPart}`);
      setGstPercent(18);
      setGstType('CGST_SGST');
      setGstPaidBy('TRANSPORTER');
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

  // Dynamic filtering for Consignor
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

  // Unique Consignee suggestions from Customer Master + past LRs
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

  // Handler when user selects a Party item from dropdown
  const handleSelectCustomerItem = (cust: Customer) => {
    setPartyName(cust.name);
    setPartyId(cust.id);
    
    // Auto-fill Consignor (Sender) Name
    setConsignorName(cust.name);
    
    // Auto-fill Consignor Pickup Address
    const addr = cust.address || '';
    const city = cust.city || '';
    const fullAddr = addr
      ? city && !addr.toLowerCase().includes(city.toLowerCase())
        ? `${addr}, ${city}`
        : addr
      : city;
    setConsignorAddress(fullAddr);
    
    // Auto-fill Pickup City / Hub
    if (city) {
      setPickupLocation(city.toUpperCase());
    }

    setShowPartyDropdown(false);
  };

  // Handler when user selects Consignor item from dropdown
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

  // Handler when user selects Consignee item from dropdown
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

  // When customer dropdown/input changes, auto-fill consignor & address
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

  // When driver dropdown changes, auto-fill mobile & assigned vehicle
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

  // Helper to extract a single file via backend API
  const extractSingleFile = async (file: File) => {
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    let effectiveMime = file.type || (isPdfExt ? 'application/pdf' : 'image/jpeg');
    let base64Data: string;

    if (file.type.startsWith('image/')) {
      base64Data = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1280;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.80);
            effectiveMime = 'image/jpeg';
            resolve(compressed);
          };
          img.onerror = () => resolve(e.target?.result as string);
          img.src = e.target?.result as string;
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 75000);

    let response: Response;
    try {
      response = await fetch('/api/extract-lr-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          mimeType: effectiveMime,
          filename: file.name
        }),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutTimer);
      if (fetchErr?.name === 'AbortError') {
        throw new Error(`Extraction timed out for "${file.name}". Server processing took longer than expected.`);
      }
      throw fetchErr;
    }
    clearTimeout(timeoutTimer);

    const rawResponseText = await response.text();
    let resJson: any = {};
    try {
      resJson = JSON.parse(rawResponseText);
    } catch {
      throw new Error(rawResponseText.length > 200 ? 'Server busy. Please try again.' : rawResponseText || 'Failed to read response.');
    }

    if (!response.ok || !resJson.success) {
      throw new Error(resJson.error || `Failed to read ${file.name}`);
    }

    return { filename: file.name, data: resJson.data || {} };
  };

  // PDF Document & Image Reader & Automatic LR Form Auto-Fill Handler (Supports single & multiple invoices)
  const handleProcessFiles = async (inputFiles: FileList | File[] | File) => {
    let files: File[] = [];
    if (inputFiles instanceof File) {
      files = [inputFiles];
    } else if (inputFiles) {
      files = Array.from(inputFiles);
    }

    if (files.length === 0) return;

    // Validate mime / format
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const validFiles = files.filter(f => {
      const isPdf = f.name.toLowerCase().endsWith('.pdf');
      const isImg = /\.(jpe?g|png|webp)$/i.test(f.name);
      return validMimes.includes(f.type) || isPdf || isImg;
    });

    if (validFiles.length === 0) {
      setPdfError('Please upload valid PDF documents or images (JPG, PNG, WebP).');
      return;
    }

    setIsAnalyzingPdf(true);
    setPdfError(null);
    setPdfFileName(validFiles.length === 1 ? validFiles[0].name : `${validFiles.length} files (${validFiles.map(f => f.name).join(', ')})`);
    setPdfExtractionResult(null);

    try {
      // Extract files
      const extractionPromises = validFiles.map(file => 
        extractSingleFile(file).catch(err => {
          console.warn(`Error extracting file ${file.name}:`, err);
          return { filename: file.name, data: null, error: err.message };
        })
      );

      const results = await Promise.all(extractionPromises);
      const successfulDocs = results.filter(r => r.data !== null);

      if (successfulDocs.length === 0) {
        const firstErr = (results as any[]).find(r => r && r.error)?.error;
        throw new Error(firstErr || 'Failed to extract information from the uploaded file(s).');
      }

      // Clean entity helper for duplicate prevention & grouping
      const cleanEntityName = (str: string) => {
        return (str || '')
          .toLowerCase()
          .replace(/\b(m\/s|m\/s\.|pvt|pvt\.|ltd|ltd\.|private|limited|llp|co|co\.|company|enterprises|industries|traders|corp|corporation|logistics|transport)\b/gi, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      // Group documents by consignor party name
      const partyGroups: Record<string, { partyKey: string; rawConsignorName: string; rawConsignorGst: string; docs: any[] }> = {};

      for (const item of successfulDocs) {
        const d = item.data;
        const rawName = (d.consignorName || 'Unknown Party').trim();
        const key = cleanEntityName(rawName) || 'unknown';
        if (!partyGroups[key]) {
          partyGroups[key] = {
            partyKey: key,
            rawConsignorName: rawName,
            rawConsignorGst: (d.consignorGstNo || '').trim().toUpperCase(),
            docs: []
          };
        }
        partyGroups[key].docs.push({ ...d, _filename: item.filename });
      }

      const groupList = Object.values(partyGroups).sort((a, b) => b.docs.length - a.docs.length);
      const primaryGroup = groupList[0];
      const primaryDocs = primaryGroup.docs;

      let filesNotice: string | undefined = undefined;
      if (groupList.length > 1) {
        const otherGroups = groupList.slice(1);
        const otherCount = otherGroups.reduce((sum, g) => sum + g.docs.length, 0);
        const otherNames = otherGroups.map(g => g.rawConsignorName).filter(Boolean).join(', ');
        filesNotice = `Same party ("${primaryGroup.rawConsignorName}") ke ${primaryDocs.length} invoices ek Bilty mein combine kiye gaye hain. Different party (${otherNames}) ke ${otherCount} invoices ko separate Bilty mein banayein.`;
      }

      let extractedCount = 0;
      let consignorStatus: 'existing' | 'created' | undefined = undefined;
      let appliedConsignorName = '';
      let appliedConsignorCode = '';

      // 1. CONSIGNOR / SENDER MASTER LOGIC (using primaryGroup)
      const rawConsignorName = primaryGroup.rawConsignorName;
      const rawConsignorGst = primaryGroup.rawConsignorGst;

      const firstDocWithAddress = primaryDocs.find(d => d.consignorAddress || d.consignorCity) || primaryDocs[0];

      if (rawConsignorName && rawConsignorName !== 'Unknown Party') {
        extractedCount++;
        appliedConsignorName = rawConsignorName;

        // Check against existing customers
        const existingCust = customers.find((c) => {
          if (rawConsignorGst && c.gstNo && c.gstNo.trim().toUpperCase() === rawConsignorGst) {
            return true;
          }
          if (c.name.toLowerCase().trim() === rawConsignorName.toLowerCase()) {
            return true;
          }
          const cClean = cleanEntityName(c.name);
          const docClean = cleanEntityName(rawConsignorName);
          if (cClean && docClean && cClean === docClean) {
            return true;
          }
          if (cClean.length >= 4 && docClean.length >= 4 && (cClean.includes(docClean) || docClean.includes(cClean))) {
            return true;
          }
          return false;
        });

        if (existingCust) {
          consignorStatus = 'existing';
          appliedConsignorName = existingCust.name;
          appliedConsignorCode = existingCust.code;

          setPartyId(existingCust.id);
          setPartyName(existingCust.name);
          setConsignorName(existingCust.name);

          const addr = existingCust.address || firstDocWithAddress.consignorAddress || '';
          const city = existingCust.city || firstDocWithAddress.consignorCity || firstDocWithAddress.pickupLocation || '';
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
            id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            code: nextCode,
            name: rawConsignorName,
            gstNo: rawConsignorGst,
            pan: '',
            mobile: (firstDocWithAddress.consignorMobile || '').trim(),
            email: '',
            address: (firstDocWithAddress.consignorAddress || '').trim(),
            city: (firstDocWithAddress.consignorCity || firstDocWithAddress.pickupLocation || '').trim(),
            state: (firstDocWithAddress.consignorState || '').trim(),
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
      }

      // 2. CONSIGNEE / RECEIVER (Form only - no ledger created)
      const firstDocWithConsignee = primaryDocs.find(d => d.consigneeName) || primaryDocs[0];
      if (firstDocWithConsignee.consigneeName) {
        setConsigneeName(firstDocWithConsignee.consigneeName.trim());
        extractedCount++;
      }
      if (firstDocWithConsignee.consigneeAddress) {
        setConsigneeAddress(firstDocWithConsignee.consigneeAddress.trim());
        extractedCount++;
      }
      if (firstDocWithConsignee.consigneeCity || firstDocWithConsignee.deliveryLocation) {
        const destCity = (firstDocWithConsignee.deliveryLocation || firstDocWithConsignee.consigneeCity).trim().toUpperCase();
        setDeliveryLocation(destCity);
        extractedCount++;
      }

      // 3. ROUTE DETAILS
      const firstDocWithPickup = primaryDocs.find(d => d.pickupLocation);
      if (firstDocWithPickup && firstDocWithPickup.pickupLocation) {
        setPickupLocation(firstDocWithPickup.pickupLocation.trim().toUpperCase());
        extractedCount++;
      }
      const firstDocWithDelivery = primaryDocs.find(d => d.deliveryLocation);
      if (firstDocWithDelivery && firstDocWithDelivery.deliveryLocation) {
        setDeliveryLocation(firstDocWithDelivery.deliveryLocation.trim().toUpperCase());
        extractedCount++;
      }

      // 4. COMBINE INVOICE NUMBERS & INVOICE VALUES FROM PRIMARY DOCS & ATTACHED INVOICES
      const newAttachedInvoices: AttachedInvoice[] = [];
      for (const d of primaryDocs) {
        const invNum = d.invoiceNumber ? String(d.invoiceNumber).trim() : '';
        const isDuplicate =
          attachedInvoices.some(
            (ex) => invNum && ex.invoiceNumber && ex.invoiceNumber.toLowerCase().trim() === invNum.toLowerCase().trim()
          ) ||
          newAttachedInvoices.some(
            (na) => invNum && na.invoiceNumber && na.invoiceNumber.toLowerCase().trim() === invNum.toLowerCase().trim()
          );

        if (!isDuplicate || !invNum) {
          newAttachedInvoices.push({
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            invoiceNumber: invNum || `INV-${Date.now().toString().slice(-4)}`,
            invoiceValue: Number(d.invoiceValue) || undefined,
            weight: Number(d.weight) || undefined,
            quantity: d.quantity || (d.packageCount ? `${d.packageCount} ${d.packageUnit || 'Packages'}` : undefined),
            material: d.material || undefined,
            filename: d._filename || 'Invoice-Document',
            fileType: (d._filename || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            extractedAt: new Date().toISOString()
          });
        }
      }

      const combinedInvoices = [...attachedInvoices, ...newAttachedInvoices];
      setAttachedInvoices(combinedInvoices);

      const invoiceNumbersList = Array.from(
        new Set(combinedInvoices.map((d) => (d.invoiceNumber ? String(d.invoiceNumber).trim() : '')).filter(Boolean))
      );
      if (invoiceNumbersList.length > 0) {
        setInvoiceNumber(invoiceNumbersList.join(', '));
        extractedCount++;
      }

      const totalInvoiceVal = combinedInvoices.reduce((sum, d) => {
        const v = Number(d.invoiceValue);
        return !isNaN(v) && v > 0 ? sum + v : sum;
      }, 0);
      if (totalInvoiceVal > 0) {
        setInvoiceValue(totalInvoiceVal);
        extractedCount++;
      }

      // 5. COMBINE WEIGHT & QUANTITY
      const totalWeightVal = combinedInvoices.reduce((sum, d) => {
        const w = Number(d.weight);
        return !isNaN(w) && w > 0 ? sum + w : sum;
      }, 0);
      if (totalWeightVal > 0) {
        setWeight(Number(totalWeightVal.toFixed(2)));
        setActualWeight(Number(totalWeightVal.toFixed(2)));
        extractedCount++;
      }

      const uniqueUnits = Array.from(new Set(primaryDocs.map(d => d.packageUnit).filter(Boolean)));
      if (uniqueUnits.length > 0) {
        const unitLower = String(uniqueUnits[0]).toLowerCase();
        if (unitLower.includes('carton')) setPackageUnit('Cartons');
        else if (unitLower.includes('box')) setPackageUnit('Box');
        else if (unitLower.includes('drum')) setPackageUnit('Drums');
        else if (unitLower.includes('bag')) setPackageUnit('Bags');
        else if (unitLower.includes('ton')) setPackageUnit('Tons');
        else if (unitLower.includes('kg') || unitLower.includes('kilo')) setPackageUnit('Kg');
        else if (unitLower.includes('quintal')) setPackageUnit('Quintal');
        else if (unitLower.includes('nos') || unitLower.includes('pouch') || unitLower.includes('pcs')) setPackageUnit('Nos');
        else setPackageUnit('Packages');
      }

      // Sum package counts if available
      const totalPackageCount = primaryDocs.reduce((sum, d) => {
        const count = Number(d.packageCount || (typeof d.quantity === 'number' ? d.quantity : parseFloat(d.quantity)));
        return !isNaN(count) && count > 0 ? sum + count : sum;
      }, 0);

      if (totalPackageCount > 0) {
        const unitStr = packageUnit || 'Packages';
        setQuantity(`${totalPackageCount} ${unitStr}`);
        extractedCount++;
      } else {
        const qtyList = Array.from(new Set(primaryDocs.map(d => d.quantity ? String(d.quantity).trim() : '').filter(Boolean)));
        if (qtyList.length > 0) {
          setQuantity(qtyList.join(', '));
          extractedCount++;
        }
      }

      // Combine Materials
      const materialsList = Array.from(
        new Set(
          [
            ...combinedInvoices.map((i) => i.material ? String(i.material).trim() : ''),
            ...primaryDocs.map((d) => d.material ? String(d.material).trim() : '')
          ].filter(Boolean)
        )
      );
      if (materialsList.length > 0) {
        setMaterial(materialsList.join(', '));
        extractedCount++;
      }

      // Vehicle
      const firstDocWithVehicle = primaryDocs.find(d => d.vehicleNumber);
      if (firstDocWithVehicle && firstDocWithVehicle.vehicleNumber) {
        setVehicleNumber(String(firstDocWithVehicle.vehicleNumber).trim().toUpperCase());
        extractedCount++;
      }

      // E-Way Bills & Remarks
      const ewayBillsList = Array.from(new Set(primaryDocs.map(d => d.ewayBillNo ? String(d.ewayBillNo).trim() : '').filter(Boolean)));
      const remarksList = Array.from(new Set(primaryDocs.map(d => d.remarks ? String(d.remarks).trim() : '').filter(Boolean)));
      const combinedRemarksArr: string[] = [];
      if (ewayBillsList.length > 0) {
        combinedRemarksArr.push(`E-Way Bill: ${ewayBillsList.join(', ')}`);
      }
      if (combinedInvoices.length > 1) {
        combinedRemarksArr.push(`Combined ${combinedInvoices.length} Invoices (${invoiceNumbersList.join(', ')})`);
      }
      if (remarksList.length > 0) {
        combinedRemarksArr.push(remarksList.join(' | '));
      }
      if (combinedRemarksArr.length > 0) {
        setRemarks(combinedRemarksArr.join(' | '));
        extractedCount++;
      }

      setPdfExtractionResult({
        success: true,
        consignorStatus,
        consignorName: appliedConsignorName || rawConsignorName,
        consignorCode: appliedConsignorCode,
        consigneeName: firstDocWithConsignee.consigneeName,
        route: `${pickupLocation || firstDocWithAddress.pickupLocation || 'Origin'} ➔ ${deliveryLocation || firstDocWithConsignee.deliveryLocation || 'Destination'}`,
        material: materialsList.join(', '),
        quantity: totalPackageCount > 0 ? `${totalPackageCount} ${packageUnit || 'Packages'}` : (primaryDocs[0].quantity || ''),
        invoiceNo: invoiceNumbersList.join(', '),
        invoiceValue: totalInvoiceVal > 0 ? totalInvoiceVal : undefined,
        extractedFieldsCount: extractedCount,
        combinedCount: combinedInvoices.length,
        filesNotice
      });
    } catch (err: any) {
      console.error('Document Extraction Error:', err);
      setPdfError(err.message || 'Error parsing document. Please verify and fill remaining fields manually.');
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  const handleRemoveAttachedInvoice = (id: string) => {
    const updated = attachedInvoices.filter((i) => i.id !== id);
    setAttachedInvoices(updated);
    if (updated.length > 0) {
      const invNums = Array.from(new Set(updated.map((i) => i.invoiceNumber).filter(Boolean)));
      setInvoiceNumber(invNums.join(', '));
      const totalInv = updated.reduce((sum, i) => sum + (Number(i.invoiceValue) || 0), 0);
      setInvoiceValue(totalInv > 0 ? totalInv : '');
      const totalWt = updated.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);
      if (totalWt > 0) {
        setWeight(Number(totalWt.toFixed(2)));
        setActualWeight(Number(totalWt.toFixed(2)));
      }
      const matList = Array.from(new Set(updated.map((i) => (i.material ? String(i.material).trim() : '')).filter(Boolean)));
      if (matList.length > 0) {
        setMaterial(matList.join(', '));
      }
    } else {
      setInvoiceNumber('');
      setInvoiceValue('');
    }
  };

  const handleProcessPdfFile = handleProcessFiles;

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
      fixedRate: fixedRate !== '' && Number(fixedRate) > 0 ? Number(fixedRate) : undefined,
      attachedInvoices: attachedInvoices && attachedInvoices.length > 0 ? attachedInvoices : undefined,
      ratePerKg: Number(ratePerKg) || undefined,
      actualWeight: Number(actualWeight) || Number(weight) || undefined,
      chargedWeight: Number(chargedWeight) || undefined,
      basicFreight: fixedRate !== '' && Number(fixedRate) > 0 ? Number(fixedRate) : (Number((Number(chargedWeight || weight) * Number(ratePerKg || 0)).toFixed(2)) || undefined),
      docketCharge,
      fovCharge,
      fscCharge,
      handlingCharge: Number(handlingCharge) || 0,
      odaCharge,
      appointmentCharge,
      otherCharges: Number(otherCharges) || 0,
      gstPercent,
      gstType,
      gstPaidBy,
      gstAmount: totalTaxAmount,
      cgstPercent: gstType === 'CGST_SGST' ? halfGstRate : 0,
      cgstAmount,
      sgstPercent: gstType === 'CGST_SGST' ? halfGstRate : 0,
      sgstAmount,
      igstPercent: gstType === 'IGST' ? gstPercent : 0,
      igstAmount,
      taxableAmount: taxableFreight,
      totalWithGst,
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl my-auto sm:my-6">
        
        {/* Header */}
        <div className="bg-slate-800 px-4 sm:px-6 py-3.5 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 shrink-0" />
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {editingLR ? `Edit Lorry Receipt: ${editingLR.lrNumber}` : 'New Booking / LR Entry (Bilty)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                Lorry Receipt (Bilty) generation with freight, advance & delivery locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">

          {/* AI PDF / Document Auto-Fill Box */}
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
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleProcessFiles(e.dataTransfer.files);
              }
            }}
            className={`rounded-xl sm:rounded-2xl border transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                : 'border-blue-500/40 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900'
            } p-3 sm:p-4`}
          >
            <input
              type="file"
              ref={pdfFileInputRef}
              accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFiles(e.target.files);
                }
              }}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2">
                    <span>PDF & Photo/Image Document Upload</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                      Auto-Scanner & Multi-Invoice
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Upload single or multiple Tax Invoices, Challans or Bilty photos to auto-fill form.
                  </p>
                </div>
              </div>

              {/* Upload Trigger Button */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {pdfExtractionResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfExtractionResult(null);
                      setPdfFileName(null);
                      setPdfError(null);
                      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
                    }}
                    className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  disabled={isAnalyzingPdf}
                  onClick={() => pdfFileInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isAnalyzingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scanning Document(s)...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4" />
                      <span>{pdfFileName || attachedInvoices.length > 0 ? 'Upload / Change' : 'Upload PDF or Photo / Image'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isAnalyzingPdf}
                  onClick={() => pdfFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  title="Add more invoices to this LR/Bilty"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add More Invoice</span>
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
              <div className="mt-3 p-3 sm:p-4 bg-slate-800/80 border border-blue-500/30 rounded-xl flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 animate-spin" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white truncate">
                      Scanning & extracting details from <span className="text-blue-400 font-mono">{pdfFileName}</span>
                    </p>
                    <span className="text-[10px] text-blue-300 font-mono animate-pulse shrink-0">Extracting...</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    Identifying Consignor, Consignee, Route, Material & Invoice values...
                  </p>
                </div>
              </div>
            )}

            {/* Extraction Success Card */}
            {pdfExtractionResult && !isAnalyzingPdf && (
              <div className="mt-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">
                      Document Auto-Fill Completed ({pdfExtractionResult.extractedFieldsCount} fields identified)
                    </span>
                    {pdfExtractionResult.combinedCount && pdfExtractionResult.combinedCount > 1 && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {pdfExtractionResult.combinedCount} Invoices Combined
                      </span>
                    )}
                  </div>
                  {pdfFileName && (
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[180px] sm:max-w-xs">
                      {pdfFileName}
                    </span>
                  )}
                </div>

                {pdfExtractionResult.filesNotice && (
                  <div className="p-2 bg-indigo-950/60 border border-indigo-700/60 rounded-lg text-indigo-200 text-xs flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px]">{pdfExtractionResult.filesNotice}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        1. Party / Consignor (Sender)
                      </span>
                      {pdfExtractionResult.consignorStatus === 'existing' ? (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Existing Party
                        </span>
                      ) : pdfExtractionResult.consignorStatus === 'created' ? (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          New Ledger Created
                        </span>
                      ) : null}
                    </div>
                    <p className="font-bold text-white truncate">
                      {pdfExtractionResult.consignorName || 'Identified in form'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {pdfExtractionResult.consignorCode ? `Code: ${pdfExtractionResult.consignorCode} • ` : ''}
                      {pdfExtractionResult.consignorStatus === 'existing' ? 'Linked existing Master (No duplicate)' : 'Added to Customer Master'}
                    </p>
                  </div>

                  <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        2. Consignee (Receiver)
                      </span>
                      <span className="text-[9px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                        LR Only (No Ledger)
                      </span>
                    </div>
                    <p className="font-bold text-white truncate">
                      {pdfExtractionResult.consigneeName || 'Auto-filled in LR'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Delivery details populated directly into Bilty
                    </p>
                  </div>

                  <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      3. Route, Invoice & Material
                    </span>
                    <p className="font-semibold text-cyan-300 truncate">
                      {pdfExtractionResult.route}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {pdfExtractionResult.invoiceNo ? `Inv: ${pdfExtractionResult.invoiceNo} ` : ''}
                      {pdfExtractionResult.invoiceValue ? `• Val: ₹${pdfExtractionResult.invoiceValue} ` : ''}
                      {pdfExtractionResult.material ? `• ${pdfExtractionResult.material}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Uploaded Invoices Summary List */}
            {attachedInvoices.length > 0 && (
              <div className="mt-3 p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">
                      Attached Invoices ({attachedInvoices.length} Invoices Combined in this Bilty)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => pdfFileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Another</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {attachedInvoices.map((inv, idx) => (
                    <div
                      key={inv.id || idx}
                      className="p-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg flex items-start justify-between gap-2 hover:border-slate-600 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-amber-300 truncate font-mono">
                            {inv.invoiceNumber || 'Invoice Doc'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
                          {inv.invoiceValue && (
                            <span className="text-emerald-400 font-bold font-mono">
                              ₹{inv.invoiceValue.toLocaleString('en-IN')}
                            </span>
                          )}
                          {inv.weight && (
                            <span className="text-sky-300 font-medium">
                              {inv.weight} Kg
                            </span>
                          )}
                          {inv.quantity && (
                            <span className="text-slate-400">
                              {inv.quantity}
                            </span>
                          )}
                        </div>
                        {inv.material && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {inv.material}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachedInvoice(inv.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition-colors"
                        title="Remove this invoice from Bilty"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Section 1: LR Number, Tracking No, Date & Party Invoice */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>1. Booking, Tracking, Party & Invoice Details</span>
            </h4>

            {/* Row 1: LR Number, Tracking No, Booking Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    LR / Bilty Number <span className="text-orange-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Auto Serial</span>
                </div>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  required
                  placeholder="Enter LR Number"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tracking No / Docket No <span className="text-orange-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter Tracking / Docket No."
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Booking Date <span className="text-orange-400">*</span>
                  </label>
                </div>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Row 2: Customer Name, Invoice Number, Invoice Goods Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Party / Customer Name Auto Suggestion */}
              <div className="relative flex flex-col justify-end" ref={partyDropdownRef}>
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Customer / Party Name <span className="text-orange-400">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-orange-400">
                    {customers.length} in Master
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
                    placeholder="Type or select customer..."
                    required
                    className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
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
                        <span>Customer Master ({filteredCustomersForParty.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Click to auto-fill</span>
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
                            Use typed name: &quot;{partyName}&quot;
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Party Invoice / Bill No
                  </label>
                </div>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter Party Invoice No."
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Invoice Goods Value (₹)
                  </label>
                  <span className="text-[10px] text-slate-400">1% FOV Basis</span>
                </div>
                <input
                  type="number"
                  value={invoiceValue}
                  onChange={(e) => setInvoiceValue(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Enter Goods Value (₹)"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consignor & Consignee */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>2. Consignor (Sender) & Consignee (Receiver)</span>
            </h4>

            {/* Row 1: Consignor Name & Consignee Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Consignor (Shipper) */}
              <div className="relative flex flex-col justify-end" ref={consignorDropdownRef}>
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Consignor Name (Shipper)
                  </label>
                  <span className="text-[10px] text-slate-400">Sender Company</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={consignorName}
                    onFocus={() => setShowConsignorDropdown(true)}
                    onChange={(e) => {
                      setConsignorName(e.target.value);
                      setShowConsignorDropdown(true);
                    }}
                    placeholder="Sender company name"
                    className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConsignorDropdown(!showConsignorDropdown)}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-orange-400 p-0.5 rounded"
                    title="Toggle Shipper Suggestions"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showConsignorDropdown ? 'rotate-180 text-orange-400' : ''}`} />
                  </button>
                </div>

                {/* Consignor Dropdown */}
                {showConsignorDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800 text-xs">
                    <div className="bg-slate-800/90 px-3 py-1.5 text-[11px] font-bold text-orange-300 sticky top-0">
                      Choose Consignor from Customer Master
                    </div>
                    {filteredCustomersForConsignor.map((cust) => (
                      <div
                        key={`cng-${cust.id}`}
                        onClick={() => handleSelectConsignorItem(cust)}
                        className="p-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <div className="font-semibold text-white flex justify-between">
                          <span>{cust.name}</span>
                          {cust.city && <span className="text-slate-400 text-[10px]">{cust.city}</span>}
                        </div>
                        {cust.address && (
                          <div className="text-[10px] text-slate-400 truncate">{cust.address}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consignee (Receiver) */}
              <div className="relative flex flex-col justify-end" ref={consigneeDropdownRef}>
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Consignee Name (Receiver)
                  </label>
                  <span className="text-[10px] text-slate-400">Receiver Company</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={consigneeName}
                    onFocus={() => setShowConsigneeDropdown(true)}
                    onChange={(e) => {
                      setConsigneeName(e.target.value);
                      setShowConsigneeDropdown(true);
                    }}
                    placeholder="Receiver company name"
                    className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConsigneeDropdown(!showConsigneeDropdown)}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-orange-400 p-0.5 rounded"
                    title="Toggle Consignee Suggestions"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showConsigneeDropdown ? 'rotate-180 text-orange-400' : ''}`} />
                  </button>
                </div>

                {/* Consignee Dropdown */}
                {showConsigneeDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800 text-xs">
                    <div className="bg-slate-800/90 px-3 py-1.5 text-[11px] font-bold text-orange-300 sticky top-0 flex justify-between">
                      <span>Receiver Suggestions</span>
                      <span className="text-[10px] text-slate-400">({filteredConsigneeSuggestions.length})</span>
                    </div>
                    {filteredConsigneeSuggestions.length > 0 ? (
                      filteredConsigneeSuggestions.map((item, idx) => (
                        <div
                          key={`cne-opt-${idx}`}
                          onClick={() => handleSelectConsigneeItem(item)}
                          className="p-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          <div className="font-semibold text-white flex justify-between">
                            <span>{item.name}</span>
                            {item.city && <span className="text-amber-300 text-[10px]">{item.city}</span>}
                          </div>
                          {item.address && (
                            <div className="text-[10px] text-slate-400 truncate">{item.address}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        Type any receiver company name
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Consignor Pickup Address & Consignee Delivery Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Consignor Pickup Address
                  </label>
                </div>
                <input
                  type="text"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  placeholder="Enter pickup address & location"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Consignee Delivery Address
                  </label>
                </div>
                <input
                  type="text"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  placeholder="Enter delivery / unloading address"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Route, Material, Unit & Weight */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>3. Route, Material, Unit & Weight</span>
            </h4>

            {/* Row 1: Pickup, Delivery, Material, Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Pickup City / Hub <span className="text-orange-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter Pickup City / Hub"
                  required
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Delivery City / Dest <span className="text-orange-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Enter Delivery City / Dest"
                  required
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Material Description
                  </label>
                </div>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Enter Goods / Material"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Quantity (Numbers)
                  </label>
                </div>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity / count"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Row 2: Package Unit, Actual Weight, Charged Weight, Expected Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Package Unit
                  </label>
                </div>
                <select
                  value={packageUnit}
                  onChange={(e) => setPackageUnit(e.target.value as any)}
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Box">Box</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Drums">Drums</option>
                  <option value="Packages">Packages</option>
                  <option value="Bags">Bags</option>
                  <option value="Nos">Nos</option>
                  <option value="Tons">Tons</option>
                  <option value="Kg">Kg</option>
                  <option value="Quintal">Quintal</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Actual Weight (Kg)
                  </label>
                  <span className="text-[10px] text-amber-400 font-normal">Auto-syncs</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={actualWeight}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setActualWeight(val);
                    if (typeof val === 'number') {
                      setWeight(val);
                      if (chargedWeight === '' || chargedWeight === actualWeight) {
                        setChargedWeight(val);
                      }
                    } else if (val === '' && (chargedWeight === actualWeight || chargedWeight === '')) {
                      setChargedWeight('');
                      setWeight('');
                    }
                  }}
                  placeholder="Enter Actual Wt"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Charged Weight (Kg)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-normal">Freight Basis</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={chargedWeight}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setChargedWeight(val);
                    if (typeof val === 'number') {
                      if (actualWeight === '' || actualWeight === 0) {
                        setActualWeight(val);
                        setWeight(val);
                      }
                    }
                  }}
                  placeholder="Enter Charged Wt"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Expected Delivery Date
                  </label>
                </div>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Bilty Carton Dimensions & Volumetric Weight Calculator (Multi-Dimension) */}
            <div className="pt-3 border-t border-slate-700/60 space-y-3 bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-400" />
                    <span>Bilty Carton Dimensions & Volumetric Weight Calculator</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Formula: <span className="text-amber-300 font-mono font-medium">Height × Width × Length ÷ 1728 × 6</span> (Kg per carton)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddDimensionRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  title="Add another carton dimension row"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Dimension</span>
                </button>
              </div>

              {/* Dynamic Dimension Rows */}
              <div className="space-y-2.5">
                {dimensions.map((dim, idx) => {
                  const l = Number(dim.length) || 0;
                  const w = Number(dim.width) || 0;
                  const h = Number(dim.height) || 0;
                  const b = Number(dim.boxes) || 0;
                  const cft = l > 0 && w > 0 && h > 0 ? Math.round(((l * w * h) / 1728) * b * 100) / 100 : 0;
                  const volWt = l > 0 && w > 0 && h > 0 ? Math.round(((h * w * l / 1728) * 6) * b * 100) / 100 : 0;

                  return (
                    <div
                      key={dim.id}
                      className="bg-slate-800/90 p-2.5 sm:p-3 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-colors space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="px-2 py-0.5 bg-slate-700 text-amber-300 text-[11px] font-bold rounded-md font-mono shrink-0">
                            Dim #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={dim.remarks || ''}
                            onChange={(e) => handleUpdateDimensionRow(dim.id, 'remarks', e.target.value)}
                            placeholder="Optional Tag (e.g. Box Type A)"
                            className="bg-transparent border-b border-slate-700/80 text-[11px] text-slate-300 px-1 py-0.5 focus:border-amber-400 outline-none flex-1 placeholder:text-slate-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {volWt > 0 && (
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                              {volWt} Kg <span className="text-slate-400">({cft} CFT)</span>
                            </span>
                          )}

                          {dimensions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDimensionRow(dim.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                              title="Delete this dimension row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="flex flex-col justify-end">
                          <div className="min-h-[18px] mb-0.5">
                            <label className="text-[10px] font-medium text-slate-300">
                              Length L (Inches)
                            </label>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={dim.length}
                            onChange={(e) =>
                              handleUpdateDimensionRow(
                                dim.id,
                                'length',
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            placeholder="Length (in)"
                            className="w-full h-9 bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        <div className="flex flex-col justify-end">
                          <div className="min-h-[18px] mb-0.5">
                            <label className="text-[10px] font-medium text-slate-300">
                              Width W (Inches)
                            </label>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={dim.width}
                            onChange={(e) =>
                              handleUpdateDimensionRow(
                                dim.id,
                                'width',
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            placeholder="Width (in)"
                            className="w-full h-9 bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        <div className="flex flex-col justify-end">
                          <div className="min-h-[18px] mb-0.5">
                            <label className="text-[10px] font-medium text-slate-300">
                              Height H (Inches)
                            </label>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={dim.height}
                            onChange={(e) =>
                              handleUpdateDimensionRow(
                                dim.id,
                                'height',
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            placeholder="Height (in)"
                            className="w-full h-9 bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        <div className="flex flex-col justify-end">
                          <div className="min-h-[18px] mb-0.5">
                            <label className="text-[10px] font-medium text-slate-300">
                              Cartons / Boxes *
                            </label>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={dim.boxes}
                            onChange={(e) =>
                              handleUpdateDimensionRow(
                                dim.id,
                                'boxes',
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            placeholder="Boxes count"
                            className="w-full h-9 bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-lg px-2.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Dimensions Summary Card */}
              {calculatedVolumetricWeight > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-slate-900 to-slate-850 rounded-xl border border-amber-500/30 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-amber-300 flex flex-wrap items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Volumetric Weight:</span>
                      <span className="text-emerald-400 font-mono text-sm sm:text-base font-bold">
                        {calculatedVolumetricWeight} Kg
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({calculatedCFT} CFT | {totalCartonBoxes} Cartons)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Calculated: (Height × Width × Length ÷ 1728 × 6) × Cartons
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Auto-Applied ✓
                  </span>
                </div>
              )}
            </div>

            {/* Row 3: Dispatch Status */}
            <div className="flex flex-col justify-end max-w-sm">
              <div className="flex items-center justify-between min-h-[22px] mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  LR Dispatch Status
                </label>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Pending Pickup">Pending Pickup</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Section 4: Vehicle & Driver */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" />
                <span>4. Vehicle & Driver Assignment</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optional / यदि उपलब्ध हो</span>
            </h4>

            {/* Vehicle, Driver, Driver Mobile on identical horizontal baseline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Vehicle Number
                  </label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  list="vehicle-suggestions"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <datalist id="vehicle-suggestions">
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.vehicleNo} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Driver Name
                  </label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  list="driver-suggestions"
                  value={driverName}
                  onChange={(e) => handleDriverSelect(e.target.value)}
                  placeholder="Enter driver name"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <datalist id="driver-suggestions">
                  {drivers.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Driver Mobile
                  </label>
                  <span className="text-[10px] text-slate-400">10-Digit Mobile</span>
                </div>
                <input
                  type="text"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Rate & Charges Breakdown Calculation */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              <span>5. Rate Breakdown & Surcharge Matrix</span>
            </h4>

            {/* Dedicated Fixed Rate (₹) Input Card */}
            <div className="p-3 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-indigo-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-white">Fixed Rate Bilty (₹)</label>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Lump Sum / Lumpsum Freight
                    </span>
                    {fixedRate !== '' && Number(fixedRate) > 0 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-56 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fixedRate}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      handleFixedRateChange(val);
                    }}
                    placeholder="Enter Fixed Rate"
                    className="w-full h-10 bg-slate-900 border border-indigo-500/50 rounded-lg pl-8 pr-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600"
                  />
                </div>
                {fixedRate !== '' && Number(fixedRate) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleFixedRateChange('')}
                    title="Clear Fixed Rate & restore standard charges"
                    className="h-10 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition-all shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Surcharges Grid (8 Columns on desktop, 4 on tablet, 2 on mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 bg-slate-900/90 p-3 sm:p-3.5 rounded-xl border border-slate-700/80">
              {/* 1. Rate/Kg */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 truncate">
                    Rate/Kg (₹)
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 2. Docket (Fix) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 truncate">
                    Docket (Fix)
                  </label>
                </div>
                <input
                  type="number"
                  value={docketCharge}
                  onChange={(e) => setDocketCharge(Number(e.target.value))}
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 3. FOV (1% Inv) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 truncate">
                    FOV (1% Inv)
                  </label>
                </div>
                <input
                  type="number"
                  value={fovCharge}
                  onChange={(e) => setFovCharge(Number(e.target.value))}
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 4. FSC (8% Frt) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 truncate">
                    FSC (8% Frt)
                  </label>
                </div>
                <input
                  type="number"
                  value={fscCharge}
                  onChange={(e) => setFscCharge(Number(e.target.value))}
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 5. Handling Charge (₹) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-emerald-300 truncate" title="Handling / Hamali Charge (₹)">
                    Handling (₹)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  value={handlingCharge}
                  onChange={(e) => setHandlingCharge(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-emerald-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 6. ODA (₹) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-amber-300 truncate">
                    ODA (₹)
                  </label>
                </div>
                <input
                  type="number"
                  value={odaCharge}
                  onChange={(e) => setOdaCharge(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 7. Appointment (₹) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-amber-300 truncate">
                    Appointment (₹)
                  </label>
                </div>
                <input
                  type="number"
                  value={appointmentCharge}
                  onChange={(e) => setAppointmentCharge(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 8. Other Charge (₹) */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[20px] mb-1">
                  <label className="text-[11px] font-semibold text-sky-300 truncate" title="Other Surcharges (₹)">
                    Other (₹)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 sm:h-10 bg-slate-800 border border-slate-700 text-sky-300 font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* GST Calculation & Tax Compliance Block */}
            <div className="bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    GST Rate & Tax Calculation (Auto-Calculated)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {gstPercent === 0 ? 'Exempted / RCM' : `${gstPercent}% GST Applied`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* GST Rate Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    GST Rate
                  </label>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={0}>0% (Exempt / No GST)</option>
                    <option value={5}>5% (GTA Standard)</option>
                    <option value={12}>12% (Forward Charge)</option>
                    <option value={18}>18% (Commercial Rate)</option>
                  </select>
                </div>

                {/* GST Type */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tax Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-9 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setGstType('CGST_SGST')}
                      className={`text-xs font-bold rounded flex items-center justify-center transition-all ${
                        gstType === 'CGST_SGST'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CGST + SGST
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstType('IGST')}
                      className={`text-xs font-bold rounded flex items-center justify-center transition-all ${
                        gstType === 'IGST'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      IGST
                    </button>
                  </div>
                </div>

                {/* GST Payable By */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    GST Payable By
                  </label>
                  <select
                    value={gstPaidBy}
                    onChange={(e) => setGstPaidBy(e.target.value as any)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Consignor">Consignor (Sender)</option>
                    <option value="Consignee">Consignee (Receiver)</option>
                    <option value="Transporter">Transporter (Forward Charge)</option>
                  </select>
                </div>
              </div>

              {/* GST Breakdown Summary */}
              {gstPercent > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Taxable Freight</span>
                    <span className="font-bold text-white font-mono">₹{freight.toLocaleString('en-IN')}</span>
                  </div>

                  {gstType === 'CGST_SGST' ? (
                    <>
                      <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">CGST ({gstPercent / 2}%)</span>
                        <span className="font-bold text-blue-400 font-mono">₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">SGST ({gstPercent / 2}%)</span>
                        <span className="font-bold text-blue-400 font-mono">₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">IGST ({gstPercent}%)</span>
                      <span className="font-bold text-blue-400 font-mono">₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="p-2 bg-blue-950/40 rounded-lg border border-blue-500/30">
                    <span className="text-[10px] text-blue-300 block">Total With GST</span>
                    <span className="font-bold text-emerald-400 font-mono">₹{totalWithGst.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Freight Totals & Balance on identical horizontal baseline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Total Freight (₹) <span className="text-orange-400">*</span>
                  </label>
                  {fixedRate !== '' && Number(fixedRate) > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Fixed Rate
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={freight}
                  onChange={(e) => setFreight(Number(e.target.value))}
                  required
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Advance Paid (₹)
                  </label>
                </div>
                <input
                  type="number"
                  value={advance}
                  onChange={(e) => setAdvance(Number(e.target.value))}
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Balance Freight (₹ Auto)
                  </label>
                </div>
                <div className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 flex items-center text-sm text-rose-400 font-extrabold">
                  ₹{balance.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between min-h-[22px] mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Payment Type
                  </label>
                </div>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="To Be Billed">To Be Billed</option>
                  <option value="To Pay">To Pay (Receiver Pays)</option>
                  <option value="Paid">Paid Full</option>
                  <option value="Paid by Consignor">Paid by Consignor</option>
                  <option value="Paid by Consignee">Paid by Consignee</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between min-h-[22px] mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Remarks / Special Instructions
                </label>
              </div>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter booking remarks, notes, or special instructions..."
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 6: POD Document Upload System */}
          <div className="bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload className="h-4 w-4" />
                <span>6. Proof of Delivery (POD) Document</span>
              </span>
              {podUrl && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Signed Delivery Copy / POD (JPG / PNG / PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handlePODFileUpload}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Uploading POD will update LR status to <strong className="text-emerald-400">Delivered</strong>.
                </p>
              </div>

              {podUrl ? (
                <div className="bg-slate-900 p-2.5 sm:p-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {podUrl.startsWith('data:image') ? (
                      <img src={podUrl} alt="POD Document" className="w-12 h-12 object-cover rounded-md border border-slate-600 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-800 rounded-md border border-slate-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                    )}
                    <div className="truncate text-xs">
                      <p className="font-bold text-white truncate">POD_Document_{lrNumber}.pdf</p>
                      <p className="text-[10px] text-emerald-400">Delivery Verified & Stamped</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPodUrl('')}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg shrink-0 cursor-pointer"
                    title="Remove POD Document"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-lg border border-dashed border-slate-700 text-center text-xs text-slate-500">
                  No POD attached. Choose a photo of signed LR / Delivery receipt.
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
            >
              {editingLR ? 'Update LR Booking' : 'Save LR & Issue Bilty'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
