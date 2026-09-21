import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const recentPurchases = [
  { name: 'Shakib', location: 'Dhaka', product: 'Canva Pro 1 Year', time: '2 mins ago' },
  { name: 'Tanvir', location: 'Chattogram', product: 'Netflix Ultra HD 4K', time: '5 mins ago' },
  { name: 'Nusrat', location: 'Sylhet', product: 'ChatGPT Plus GPT-4o', time: '9 mins ago' },
  { name: 'Rahim', location: 'Rajshahi', product: 'Windows 11 Pro Key', time: '12 mins ago' },
  { name: 'Anik', location: 'Khulna', product: 'Spotify Premium 3 Months', time: '15 mins ago' },
];

export const RecentPurchaseNotification: React.FC = () => {
  const { lang } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after 4 seconds initially
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % recentPurchases.length);
        setVisible(true);
      }, 1000);
    }, 14000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  const item = recentPurchases[currentIdx];

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-100 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <ShoppingBag className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 truncate">
            {item.name} ({item.location})
          </span>
          <span className="text-[10px] text-gray-400">{item.time}</span>
        </div>
        <p className="text-[11px] text-emerald-700 font-semibold truncate">
          {lang === 'bn' ? `কিনেছেন: ${item.product}` : `Purchased: ${item.product}`}
        </p>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
