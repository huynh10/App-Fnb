import React, { useState } from 'react';
import { Coffee, Store as StoreIcon, User as UserIcon, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const RegisterStoreView = ({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) => {
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if username exists
      const userQuery = query(collection(db, 'users'), where('username', '==', username));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        setError('Tên đăng nhập đã tồn tại');
        setLoading(false);
        return;
      }

      // 1. Create Store
      const storeRef = await addDoc(collection(db, 'stores'), {
        name: storeName,
        createdAt: new Date().toISOString()
      });

      // 2. Create Admin User for this store
      await addDoc(collection(db, 'users'), {
        username,
        password, // In real app, hash this!
        name: 'Quản trị viên',
        role: 'admin',
        storeId: storeRef.id,
        createdAt: new Date().toISOString()
      });

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Lỗi kết nối Firebase. Hãy thử mở ứng dụng trong tab mới để tránh bị Iframe chặn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#151619] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <StoreIcon className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tighter">ĐĂNG KÝ CỬA HÀNG</h1>
          <p className="text-gray-500">Bắt đầu quản lý kinh doanh của bạn</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tên cửa hàng"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tên đăng nhập Admin"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                placeholder="Mật khẩu Admin"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'TẠO TÀI KHOẢN CỬA HÀNG'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
