import * as XLSX from 'xlsx';
import { LREntry, Customer } from '../types';

export function exportMonthlyBiltyToExcel(
  lrEntries: LREntry[],
  customerName?: string,
  monthYear?: string
) {
  if (!lrEntries || lrEntries.length === 0) {
    alert('No Bilty / LR entries available to export for Excel.');
    return;
  }

  const rows = lrEntries.map((lr) => {
    const bookingDateFormatted = lr.bookingDate
      ? lr.bookingDate.split('-').reverse().join('-')
      : '';

    const lrNumOnly = lr.lrNumber.replace(/\D/g, '') || lr.lrNumber;
    const destination = (lr.deliveryLocation || 'JAIPUR').toUpperCase();
    const goodsValue = Number(lr.invoiceValue || 0);
    const rate = Number(lr.ratePerKg || 0);
    const actualWt = Number(lr.actualWeight || lr.weight || 0);
    const chargedWt = Number(lr.chargedWeight || actualWt || 0);

    // Dimensions
    const l = lr.boxLength || '';
    const b = lr.boxWidth || '';
    const h = lr.boxHeight || '';
    const boxCount = lr.noOfBoxes || '';

    // Charges
    const basicFr = Number((lr.basicFreight || (chargedWt * rate)).toFixed(2));
    const docketChg = Number(lr.docketCharge ?? (lr.fixedRate ? 0 : 100));
    const fov = Number((lr.fovCharge ?? (lr.fixedRate ? 0 : (goodsValue > 0 ? Math.max(100, goodsValue * 0.01) : 0))).toFixed(2));
    const fsc = Number((lr.fscCharge ?? (lr.fixedRate ? 0 : (basicFr * 0.08))).toFixed(2));
    const handling = Number(lr.handlingCharge ?? 0);
    const oda = Number(lr.odaCharge ?? 0);
    const appointment = Number(lr.appointmentCharge ?? 0);
    const otherChg = Number(lr.otherCharges ?? 0);

    const totalBeforeGst = Number(
      (lr.fixedRate && lr.fixedRate > 0 ? Number(lr.fixedRate) : (lr.freight || (basicFr + docketChg + fov + fsc + handling + oda + appointment + otherChg))).toFixed(2)
    );
    const gstAmount = Number((totalBeforeGst * ((lr.gstPercent !== undefined ? lr.gstPercent : 18) / 100)).toFixed(2));
    const subTotalWithGst = Number((totalBeforeGst + gstAmount).toFixed(2));

    const billNumber = lr.invoiceNumber || '';
    const partyName = (lr.partyName || customerName || '').toUpperCase();

    return {
      'DATE': bookingDateFormatted,
      'LR NO': lrNumOnly,
      'LOCATION': destination,
      'GOODS VALUE': goodsValue,
      'RATE': rate,
      'ACTUAL WEIGHT': actualWt,
      'CW': chargedWt,
      'CHARGE WEIGHT': chargedWt,
      'L': l,
      'B': b,
      'H': h,
      'BOX': boxCount,
      'BASIC FR': basicFr,
      'DOCKET CHARGES': docketChg,
      'FOV (1%)': fov,
      'FSC (8%)': fsc,
      'HANDLING': handling,
      'ODA': oda,
      'APPOINTMENT': appointment,
      'OTHER': otherChg,
      'TOTAL': totalBeforeGst,
      'GST': gstAmount,
      'S TOTAL': subTotalWithGst,
      'BILL NUMBER': billNumber,
      'PARTY / STATUS': partyName
    };
  });

  // Calculate Totals Row
  const totalGoodsVal = rows.reduce((s, r) => s + (Number(r['GOODS VALUE']) || 0), 0);
  const totalActualWt = rows.reduce((s, r) => s + (Number(r['ACTUAL WEIGHT']) || 0), 0);
  const totalChargedWt = rows.reduce((s, r) => s + (Number(r['CW']) || 0), 0);
  const totalBoxes = rows.reduce((s, r) => s + (Number(r['BOX']) || 0), 0);
  const totalBasicFr = rows.reduce((s, r) => s + (Number(r['BASIC FR']) || 0), 0);
  const totalDocket = rows.reduce((s, r) => s + (Number(r['DOCKET CHARGES']) || 0), 0);
  const totalFov = rows.reduce((s, r) => s + (Number(r['FOV (1%)']) || 0), 0);
  const totalFsc = rows.reduce((s, r) => s + (Number(r['FSC (8%)']) || 0), 0);
  const totalHandling = rows.reduce((s, r) => s + (Number(r['HANDLING']) || 0), 0);
  const totalOda = rows.reduce((s, r) => s + (Number(r['ODA']) || 0), 0);
  const totalAppt = rows.reduce((s, r) => s + (Number(r['APPOINTMENT']) || 0), 0);
  const totalOther = rows.reduce((s, r) => s + (Number(r['OTHER']) || 0), 0);
  const totalSub = rows.reduce((s, r) => s + (Number(r['TOTAL']) || 0), 0);
  const totalGst = rows.reduce((s, r) => s + (Number(r['GST']) || 0), 0);
  const grandTotal = rows.reduce((s, r) => s + (Number(r['S TOTAL']) || 0), 0);

  const summaryRow = {
    'DATE': 'TOTAL',
    'LR NO': `${rows.length} Entries`,
    'LOCATION': '',
    'GOODS VALUE': totalGoodsVal,
    'RATE': '',
    'ACTUAL WEIGHT': totalActualWt,
    'CW': totalChargedWt,
    'CHARGE WEIGHT': totalChargedWt,
    'L': '',
    'B': '',
    'H': '',
    'BOX': totalBoxes,
    'BASIC FR': Number(totalBasicFr.toFixed(2)),
    'DOCKET CHARGES': totalDocket,
    'FOV (1%)': Number(totalFov.toFixed(2)),
    'FSC (8%)': Number(totalFsc.toFixed(2)),
    'HANDLING': totalHandling,
    'ODA': totalOda,
    'APPOINTMENT': totalAppt,
    'OTHER': totalOther,
    'TOTAL': Number(totalSub.toFixed(2)),
    'GST': Number(totalGst.toFixed(2)),
    'S TOTAL': Number(grandTotal.toFixed(2)),
    'BILL NUMBER': '',
    'PARTY / STATUS': customerName ? customerName.toUpperCase() : ''
  };

  const fullData = [...rows, summaryRow];

  const worksheet = XLSX.utils.json_to_sheet(fullData);

  // Set column widths for clean readability
  const colWidths = [
    { wch: 12 }, // DATE
    { wch: 16 }, // LR NO
    { wch: 16 }, // LOCATION
    { wch: 14 }, // GOODS VALUE
    { wch: 8 },  // RATE
    { wch: 15 }, // ACTUAL WEIGHT
    { wch: 10 }, // CW
    { wch: 15 }, // CHARGE WEIGHT
    { wch: 6 },  // L
    { wch: 6 },  // B
    { wch: 6 },  // H
    { wch: 8 },  // BOX
    { wch: 12 }, // BASIC FR
    { wch: 16 }, // DOCKET CHARGES
    { wch: 10 }, // FOV
    { wch: 10 }, // FSC
    { wch: 8 },  // ODA
    { wch: 14 }, // APPOINTMENT
    { wch: 12 }, // TOTAL
    { wch: 12 }, // GST
    { wch: 14 }, // S TOTAL
    { wch: 18 }, // BILL NUMBER
    { wch: 28 }  // PARTY
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Bilty Statement');

  const safeCustomer = (customerName || 'Statement').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Mahaveer_Logistics_Monthly_Breakdown_${safeCustomer}_${monthYear || '2026-07'}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
