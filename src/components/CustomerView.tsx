import React, { useState } from 'react';
import { Users, Search, Plus, Star, Phone, History } from 'lucide-react';
import { Customer } from '../types';
import { cn } from '../lib/utils';

export const CustomerView = ({ customers }: { customers: Customer[] }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-500" />
          Quản lý Khách hàng (CRM)
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm khách hàng
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Tìm theo tên hoặc số điện thoại..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xl">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{customer.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {customer.phone}
                  </div>
                </div>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                customer.level === 'Gold' ? "bg-amber-500/20 text-amber-500" :
                customer.level === 'Diamond' ? "bg-blue-500/20 text-blue-500" :
                "bg-gray-500/20 text-gray-400"
              )}>
                {customer.level}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-xs text-gray-500 uppercase">Điểm tích lũy</p>
                <p className="text-lg font-bold text-emerald-500 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-emerald-500" /> {customer.points}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Lần cuối ghé</p>
                <p className="text-sm text-white flex items-center gap-1">
                  <History className="w-4 h-4 text-gray-400" /> 2 ngày trước
                </p>
              </div>
            </div>

            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all cursor-pointer">
              Xem lịch sử mua hàng
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
