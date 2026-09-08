import { CompanyConfig, CompanyId } from '../types';

export const STATIC_COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  mahaveer_logistics: {
    id: 'mahaveer_logistics',
    name: 'MAHAVEER LOGISTICS',
    displayName: 'Mahaveer Logistics',
    shortCode: 'ML',
    colorTheme: 'orange',
    defaultCredentials: {
      userId: 'admin_logistics',
      passwordPlain: 'Logistics@123'
    },
    settings: {
      companyName: 'Mahaveer Logistics',
      tagline: '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur',
      gstNo: '08AJAPJ9522F1ZC',
      panNo: 'AJAPJ9522F',
      phone: '9782162010 / 8386862130',
      email: 'manish.jain8619@gmail.com',
      address: '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur',
      bankName: 'RMGB',
      accountNo: '83085733179',
      ifscCode: 'RMGB0000433',
      accountHolderName: 'MAHAVEER LOGISTICS',
      bankBranch: 'Jhotwara, Jaipur',
      upiId: '9782162010@upi',
      terms: [
        'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
        'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
        'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
      ]
    }
  },
  mahaveer_transport: {
    id: 'mahaveer_transport',
    name: 'MAHAVEER TRANSPORT',
    displayName: 'Mahaveer Transport',
    shortCode: 'MT',
    colorTheme: 'blue',
    defaultCredentials: {
      userId: 'admin_transport',
      passwordPlain: 'Transport@123'
    },
    settings: {
      companyName: 'Mahaveer Transport',
      tagline: 'Fleet & Full Truckload Transport Solutions',
      gstNo: '08AJAPJ9522F1ZC',
      panNo: 'AJAPJ9522F',
      phone: '9782162010 / 8386862130',
      email: 'manish.jain8619@gmail.com',
      address: '3 New Colony Near Phanchyat Samithi Jhotwara Jaipur',
      bankName: 'RMGB',
      accountNo: '83085733179',
      ifscCode: 'RMGB0000433',
      accountHolderName: 'MAHAVEER TRANSPORT',
      bankBranch: 'Jhotwara, Jaipur',
      upiId: '9782162010@upi',
      terms: [
        'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
        'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
        'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
      ]
    }
  }
};

export function getCompanyConfig(companyId: string): CompanyConfig {
  if (STATIC_COMPANY_CONFIGS[companyId]) {
    return STATIC_COMPANY_CONFIGS[companyId];
  }
  try {
    const raw = localStorage.getItem('tms_branches_firms_list_v1');
    if (raw) {
      const list = JSON.parse(raw);
      const matched = Array.isArray(list) ? list.find((b: any) => b.id === companyId) : null;
      if (matched) {
        return {
          id: matched.id,
          name: matched.companyName || 'MAHAVEER LOGISTICS',
          displayName: `${matched.companyName} (${matched.branchName})`,
          shortCode: matched.shortCode || matched.branchCode || 'BR',
          colorTheme: matched.colorTheme || 'orange',
          defaultCredentials: matched.defaultCredentials || {
            userId: `admin_${matched.branchCode?.toLowerCase() || 'branch'}`,
            passwordPlain: 'Admin@123'
          },
          settings: {
            companyName: matched.companyName || 'Mahaveer Logistics',
            tagline: matched.address || `${matched.branchName}, Jaipur`,
            gstNo: matched.gstNo || '08AJAPJ9522F1ZC',
            panNo: matched.panNo || 'AJAPJ9522F',
            phone: matched.phone || '9782162010',
            email: matched.email || 'manish.jain8619@gmail.com',
            address: matched.address || 'Jaipur',
            bankName: matched.bankName || 'RMGB',
            accountNo: matched.accountNo || '83085733179',
            ifscCode: matched.ifscCode || 'RMGB0000433',
            accountHolderName: matched.accountHolderName || matched.companyName,
            bankBranch: matched.bankBranch || 'Jhotwara, Jaipur',
            upiId: matched.upiId || '9782162010@upi',
            terms: matched.terms || [
              'ALL DISPUTE SUBJECT TO OUR LOCAL JURISDICTION',
              'GSTIN PAYABLE BY CONSIGNOR / CONSIGNEE / TRANSPORTER',
              'PENALTY / INTEREST WILL CHARGED IF BILL IS NOT PAID ON PRESENTATION.'
            ]
          }
        };
      }
    }
  } catch (e) {}

  return STATIC_COMPANY_CONFIGS.mahaveer_logistics;
}

export const COMPANY_CONFIGS: Record<CompanyId, CompanyConfig> = new Proxy(STATIC_COMPANY_CONFIGS, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return getCompanyConfig(prop);
  }
});

export const DEFAULT_COMPANY_ID: CompanyId = 'mahaveer_logistics';

