export interface CustomerDocument {
  id: string;
  title: string;
  fileUrl?: string;
  uploadDate: string;
}

export interface Customer {
  id: string;
  code: string; // Auto-generated e.g. CUST-1001
  name: string; // Party Name
  gstNo: string;
  pan: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  creditDays: number;
  creditLimit: number;
  openingBalance: number;
  documents: CustomerDocument[];
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  aadhaarNo: string;
  licenceNo: string;
  licenceExpiry: string; // YYYY-MM-DD
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  upiId?: string;
  address: string;
  emergencyContact: string;
  photoUrl?: string;
  assignedVehicleNo?: string;
  status: 'Available' | 'On Trip' | 'On Leave' | 'Inactive';
}

export interface Vehicle {
  id: string;
  vehicleNo: string; // e.g., MH 12 AB 1234
  vehicleType: 'Container' | 'Open Body' | 'Trailer' | 'Tanker' | 'Tipper' | 'Bolero Pickup' | 'Other';
  capacityTons: number;
  ownerType: 'Owned' | 'Market Truck';
  ownerName: string;
  ownerMobile: string;
  pucExpiry: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  status: 'Available' | 'In Transit' | 'Under Maintenance';
}

export type LRStatus = 'Pending Pickup' | 'In Transit' | 'Delivered' | 'Cancelled';
export type PaymentType = 'To Pay' | 'Paid' | 'To Be Billed' | 'Paid by Consignor' | 'Paid by Consignee';

export interface TrackingEvent {
  id: string;
  statusName: string; // e.g., "MAHAVEER LOGISTICS -BP", "Jaipur HUB (JAIH)", "Gurgaon Farukhnagar", "Jhajjar"
  location: string;
  eventText: string; // e.g., "Shipment Booked", "Arrived at Hub", "Out for Delivery", "Delivered, Jhajjar"
  timestamp: string; // e.g., "03-Aug-2026 20:51"
  completed: boolean;
  isCurrent?: boolean;
  remarks?: string;
}

export interface BoxDimensionItem {
  id: string;
  length: number; // Length (L) in Inches
  width: number;  // Width (W) in Inches
  height: number; // Height (H) in Inches
  boxes: number;  // Pieces / Cartons count for this dimension
  cft?: number;   // ((L * W * H) / 1728) * boxes
  dimensionWeight?: number; // ((Height * Width * Length / 1728) * 6) * boxes
  remarks?: string; // e.g. "Small Cartons", "Heavy Box", etc.
}

export interface AttachedInvoice {
  id: string;
  filename: string;
  fileType?: string;
  invoiceNumber?: string;
  invoiceValue?: number;
  material?: string;
  quantity?: string;
  weight?: number;
  fileData?: string;
  extractedAt?: string;
}

export interface LREntry {
  id: string;
  lrNumber: string; // Auto-generated e.g. LR-2026-0001
  bookingDate: string; // YYYY-MM-DD
  partyId?: string;
  partyName: string;
  consignorName: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  pickupLocation: string;
  deliveryLocation: string;
  material: string;
  quantity: string;
  weight: number;
  weightUnit: 'Tons' | 'Kg' | 'Quintal' | 'Packages';
  // Box Dimension & Carton Weight Calculation fields
  boxLength?: number; // L in Inches
  boxHeight?: number; // H in Inches
  boxWidth?: number; // W in Inches
  noOfBoxes?: number; // Total Cartons / Boxes
  cft?: number; // CFT (Cubic Feet)
  volumetricWeight?: number; // Volumetric Weight (Kg)
  dimensions?: BoxDimensionItem[]; // Multiple Box Dimensions array
  totalDimensionsWeight?: number;
  vehicleNumber: string;
  driverName: string;
  driverMobile?: string;
  freight: number;
  fixedRate?: number; // Fixed Rate (₹) override
  advance: number;
  balance: number; // calculated: freight - advance
  deliveryDate: string;
  paymentType: PaymentType;
  status: LRStatus;
  trackingNumber?: string;
  // Attached Multiple Invoices
  attachedInvoices?: AttachedInvoice[];
  // Driver Live Tracking Link & GPS Data
  driverTrackingToken?: string;
  driverLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    address?: string;
    timestamp: string;
    isSharingActive: boolean;
  };
  driverGps?: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    address?: string;
    lastUpdated?: number;
    isSharingActive?: boolean;
  };
  // POD Upload
  podUrl?: string;
  podUploadDate?: string;
  // Charges & Billing fields
  invoiceNumber?: string; // Party Bill / Invoice No
  invoiceValue?: number; // Goods Value (₹)
  packageUnit?: 'Box' | 'Cartons' | 'Drums' | 'Packages' | 'Bags' | 'Nos' | 'Tons' | 'Kg' | 'Quintal';
  ratePerKg?: number;
  actualWeight?: number;
  chargedWeight?: number;
  basicFreight?: number;
  docketCharge?: number; // default 75
  fovCharge?: number; // 1% of invoiceValue
  fscCharge?: number; // 8% of basicFreight
  odaCharge?: number; // ODA Charge
  appointmentCharge?: number; // Appointment Charge
  handlingCharge?: number; // Handling Charge
  otherCharges?: number;
  gstPercent?: number; // 0, 5, 12, 18
  gstType?: 'CGST_SGST' | 'IGST' | 'NONE';
  gstPaidBy?: string;
  gstAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  taxableAmount?: number;
  totalWithGst?: number;
  subTotal?: number;
  // Dynamic Tracking & DP World Style Milestones
  eta?: string;
  noOfPackages?: number;
  latestEvent?: string;
  currentHub?: string;
  trackingEvents?: TrackingEvent[];
  remarks: string;
  createdAt: string;
}

export interface SavedMonthlyInvoice {
  id: string;
  invoiceNo: string; // e.g. 26-27/54
  invoiceDate: string; // YYYY-MM-DD e.g. 2026-07-31
  monthYear: string; // e.g. "August , 2026"
  partyId: string;
  partyName: string;
  gstNo?: string;
  selectedLrIds: string[];
  lrCount: number;
  totalFreight: number;
  gstRate?: number; // 0, 5, 12, 18
  gstPercent?: number; // 0, 5, 12, 18
  gstType?: 'CGST_SGST' | 'IGST';
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  invoiceValue: number; // Total Invoice Value with GST
  advanceReceived: number;
  netPayableAmount: number; // Original Bill Amount
  paidAmount: number; // Total payments collected against this monthly bill
  status: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  periodType?: 'Monthly' | '3 Months' | '6 Months' | '12 Months' | 'Financial Year' | 'Custom Range';
  fromDate?: string;
  toDate?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  lrId?: string;
  lrNumber?: string;
  monthlyInvoiceId?: string; // Reference to Saved Monthly Bill
  monthlyInvoiceNo?: string; // e.g., "26-27/54"
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'NEFT/RTGS' | 'UPI' | 'Cheque';
  referenceNo: string;
  remarks: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  gstNo: string;
  panNo: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankBranch?: string;
  upiId?: string;
  termsImageUrl?: string; // Optional image of Terms & Conditions
  terms: string[];
}

export interface LocationRate {
  id: string;
  fromLocation: string; // e.g. Jaipur
  toLocation: string; // e.g. Jhajjar, Pune, Bangalore, Lucknow, etc.
  ratePerKg: number; // e.g. 6.0, 8.0, 10.5, 6.5, 7.5
  minWeight?: number; // e.g. 35
  docketCharge?: number; // default 75
  fscPercent?: number; // default 8
  fovPercent?: number; // default 1
  odaCharge?: number;
  appointmentCharge?: number;
  remarks?: string;
}

export type ExpenseCategory =
  | 'Diesel & Fuel'
  | 'Driver Trip Advance & Bhatta'
  | 'Driver Salary'
  | 'Toll Plaza & Fastag'
  | 'Vehicle Maintenance & Repairs'
  | 'Tyres & Tubes'
  | 'Loading & Unloading (Hamali)'
  | 'Market Vehicle / Hire Freight'
  | 'Office Rent & Utilities'
  | 'Staff Salary'
  | 'RTO / Permit / Taxes'
  | 'Insurance & Fitness'
  | 'Halting & Detention'
  | 'Tea & Refreshment / Misc'
  | string;

export interface ExpenseEntry {
  id: string;
  voucherNo?: string;
  expenseDate: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  vehicleNumber?: string;
  driverName?: string;
  payeeName?: string; // Vendor / Petrol Pump / Mechanic / Driver Name
  paymentMode: 'Cash' | 'Online/UPI' | 'NEFT/RTGS' | 'Cheque' | 'Fastag' | 'Fuel Card';
  referenceNo?: string; // Bill / Voucher / Txn No
  lrNumber?: string; // Associated LR Number if trip specific
  remarks?: string;
  createdAt: string;
}

export type IncomeCategory =
  | 'Freight Income'
  | 'Transport Charges'
  | 'Loading Charges'
  | 'Unloading Charges'
  | 'Detention Charges'
  | 'Halting Charges'
  | 'Hamali Income'
  | 'Commission / Brokerage'
  | 'Insurance Claim'
  | 'Scrap / Asset Sale'
  | 'Other Income'
  | string;

export interface IncomeEntry {
  id: string;
  receiptNo?: string; // Receipt / Income Bill No
  incomeDate: string; // YYYY-MM-DD
  category: IncomeCategory;
  amount: number;
  paymentMode: 'Cash' | 'Online/UPI' | 'NEFT/RTGS' | 'Cheque' | 'Bank Transfer' | 'Other';
  vehicleNumber?: string;
  driverName?: string;
  payerName?: string; // Customer / Payer Name
  lrNumber?: string; // Associated LR No
  referenceNo?: string; // Bill / Txn Ref No
  remarks?: string;
  createdAt: string;
}

export interface IncomeHead {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ExpenseHead {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface SystemBackup {
  version: string;
  exportDate: string;
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  lrEntries: LREntry[];
  payments: PaymentReceipt[];
  expenses?: ExpenseEntry[];
  incomes?: IncomeEntry[];
  incomeHeads?: string[];
  expenseHeads?: string[];
  locationRates?: LocationRate[];
  settings: CompanySettings;
}

export type CompanyId = string;

export type BranchType = 'Head Office' | 'Branch' | 'Warehouse' | 'Booking Hub';
export type BranchStatus = 'Active' | 'Inactive';

export interface BranchUnit {
  id: string; // e.g. 'mahaveer_logistics', 'mahaveer_transport', 'branch_jpr_01'
  unitNumber?: number; // e.g. 1, 2, 3...
  companyName: string; // e.g. "MAHAVEER LOGISTICS"
  branchName: string; // e.g. "Jaipur Head Office"
  branchCode: string; // e.g. "JPR-01"
  shortCode?: string; // e.g. "ML-JPR"
  colorTheme?: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNo?: string;
  panNo?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  branchType: BranchType;
  status: BranchStatus;
  // Bank Details
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankBranch?: string;
  upiId?: string;
  terms?: string[];
  createdAt: string;
  defaultCredentials?: {
    userId: string;
    passwordPlain: string;
  };
}

export interface CompanyConfig {
  id: CompanyId;
  name: string; // e.g. "MAHAVEER LOGISTICS"
  displayName: string; // e.g. "Mahaveer Logistics"
  shortCode: string; // e.g. "ML"
  colorTheme: string; // e.g. "orange" | "blue"
  settings: CompanySettings;
  defaultCredentials: {
    userId: string;
    passwordPlain: string;
  };
}

export interface UserAccount {
  id?: string;
  companyId: CompanyId;
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  passwordHash: string; // SHA-256 secure hash
  role: 'admin' | 'manager' | 'operator' | 'staff';
  lastLogin?: string;
  updatedAt: string;
  createdAt?: string;
}

export interface AuthSession {
  companyId: CompanyId;
  companyName: string;
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'manager' | 'operator' | 'staff';
  token: string;
  loginTimestamp: string;
}

