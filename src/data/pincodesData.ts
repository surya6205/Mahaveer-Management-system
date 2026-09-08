export interface PincodeRecord {
  id: string;
  pincode: string;
  status: 'STD' | 'ODA' | 'Non-Serviceable';
  cityState?: string;
  notes?: string;
}

// Master initial pincodes list - all demo data completely removed as requested
export const initialPincodes: PincodeRecord[] = [];
