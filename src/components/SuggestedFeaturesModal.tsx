import React from 'react';
import {
  Lightbulb,
  X,
  CheckCircle2,
  Fuel,
  QrCode,
  FileCheck,
  MessageSquare,
  Navigation,
  DollarSign,
  Layers
} from 'lucide-react';

interface SuggestedFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestedFeaturesModal: React.FC<SuggestedFeaturesModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const features = [
    {
      title: '1. Fleet Fuel & Diesel Expense Log (डीजल व टोल खर्चा)',
      icon: Fuel,
      desc: 'Driver ko trip advance ke alawa Diesel Slip aur Fastag Toll Expense alag se track karne ka feature, jisse har trip ki exact Net Margin/Profit nikale.',
      tag: 'Recommended'
    },
    {
      title: '2. E-Way Bill Sync & Expiry Warning (ई-वे बिल अलार्म)',
      icon: FileCheck,
      desc: 'LR entry ke sath 12-digit E-Way Bill Number aur uski Validity Date add karke E-Way Bill expiry se pehle alert warning show karna.',
      tag: 'GST Compliance'
    },
    {
      title: '3. Proof of Delivery (POD) Photo Upload (पीओडी फोटो जमा)',
      icon: CheckCircle2,
      desc: 'Trip deliver hone ke baad customer dwara signed Lorry Receipt (Bilty) ki photo mobile camera se upload karne ka option.',
      tag: 'High Utility'
    },
    {
      title: '4. Driver Allowance & Trip Commission (ड्राइवर भत्ता व बाटा)',
      icon: DollarSign,
      desc: 'Driver Trip Expense, Daily Batta (Allowance) aur Commission calculation ledger taaki mahine ke end me driver ka net hisab-kitab aasan ho.',
      tag: 'Payroll'
    },
    {
      title: '5. WhatsApp 1-Click Dispatch Alerts (व्हाट्सएप संदेश)',
      icon: MessageSquare,
      desc: 'Customer ko LR booking hote hi WhatsApp par Vehicle No, Driver Mobile aur LR Copy ek click me bhejane ka feature.',
      tag: 'Automation'
    },
    {
      title: '6. Loading / Unloading Slip Generator (लोडिंग पर्ची)',
      icon: Layers,
      desc: 'Factory gate par security aur driver ke sign ke liye alag se Loading Challan / Gate Pass print karne ka feature.',
      tag: 'Operations'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Transport Business - Proactive Enhancement Suggestions
              </h3>
              <p className="text-xs text-amber-300">
                Aapke sawal: "esme kuch kami hai to batao jo add kar sakte hai" ka uttar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            Aapka Transport Management System already sabhi core modules (LR Entry, Customer Master, Driver Master, Vehicle Fleet, Payment Receipts, Reports & Real-time Backup) ke sath complete hai. Aage apne business ko aur scale karne ke liye ye 6 additional modules include kar sakte hain:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-start gap-3 transition-colors"
                >
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
