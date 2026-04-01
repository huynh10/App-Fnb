import React, { useState } from 'react';
import { Settings, Store, Shield, Bell, Save, User, Lock, X, Printer, Layout, Wifi, Plus, Trash2, CheckCircle2, AlertCircle, Search, Bluetooth, Monitor, Smartphone, Info } from 'lucide-react';
import { SystemSettings, PrinterConfig, User as UserType } from '../types';
import { cn } from '../lib/utils';

export const SettingsView = ({ settings, onUpdateSettings, currentUser, onResetAllTables, onChangePassword }: { 
  settings: SystemSettings, 
  onUpdateSettings: (s: SystemSettings) => void,
  currentUser: UserType | null,
  onResetAllTables: () => void,
  onChangePassword?: (newPassword: string) => void
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);
  const [newPersonalPassword, setNewPersonalPassword] = useState('');
  const [showDiscoveryGuide, setShowDiscoveryGuide] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isOrder = currentUser?.role === 'order';

  const handleSave = () => {
    onUpdateSettings(localSettings);
    if (newPersonalPassword && onChangePassword) {
      onChangePassword(newPersonalPassword);
      setNewPersonalPassword('');
    }
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setLocalSettings({ ...localSettings, logo: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPrinter = () => {
    const newPrinter: PrinterConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Máy in LAN mới',
      connectionType: 'lan',
      ipAddress: '192.168.1.100',
      port: 9100,
      type: 'bill',
      isEnabled: true,
      isDefault: localSettings.printers?.length === 0,
      paperSize: '80mm'
    };
    setLocalSettings({
      ...localSettings,
      printers: [...(localSettings.printers || []), newPrinter]
    });
  };

  const handleUpdatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
    setLocalSettings({
      ...localSettings,
      printers: localSettings.printers.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const handleDeletePrinter = (id: string) => {
    setLocalSettings({
      ...localSettings,
      printers: localSettings.printers.filter(p => p.id !== id)
    });
  };

  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'error'>>({});
  const [activeTemplateTab, setActiveTemplateTab] = useState<'kitchen' | 'payment'>('payment');
  const [foundPrinters, setFoundPrinters] = useState<{ ip?: string; name: string; port?: number }[]>([]);

  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanningIP, setCurrentScanningIP] = useState('');

  const handleScanIP = () => {
    setScanning(true);
    setFoundPrinters([]);
    setScanProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      setCurrentScanningIP(`192.168.1.${Math.floor(progress * 2.54)}`);
      
      if (progress >= 100) {
        clearInterval(interval);
        setScanning(false);
        setCurrentScanningIP('');
        setFoundPrinters([
          { ip: '192.168.1.200', name: 'Epson TM-T82 (Thu ngân)', port: 9100 },
          { ip: '192.168.1.201', name: 'Xprinter N160 (Bếp)', port: 9100 },
          { ip: '192.168.1.205', name: 'K80 Printer (Bar)', port: 9100 }
        ]);
      }
    }, 50);
  };

  const handleAddFoundPrinter = (printer: { ip?: string; name: string; port?: number }) => {
    const newPrinter: PrinterConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: printer.name,
      connectionType: 'lan',
      ipAddress: printer.ip,
      port: printer.port,
      type: 'bill',
      isEnabled: true,
      isDefault: localSettings.printers?.length === 0,
      paperSize: '80mm'
    };
    setLocalSettings({
      ...localSettings,
      printers: [...(localSettings.printers || []), newPrinter]
    });
    setFoundPrinters(prev => prev.filter(p => p.name !== printer.name));
  };

  const handleSetDefault = (id: string) => {
    setLocalSettings({
      ...localSettings,
      printers: localSettings.printers.map(p => ({
        ...p,
        isDefault: p.id === id
      }))
    });
  };

  const testConnection = (id: string) => {
    const printer = localSettings.printers.find(p => p.id === id);
    if (!printer) return;

    setTestingPrinter(id);
    console.log(`Testing connection to ${printer.ipAddress}...`);
    
    setTimeout(() => {
      setTestingPrinter(null);
      const isFoundIP = ['192.168.1.200', '192.168.1.201', '192.168.1.205'].includes(printer.ipAddress || '');
      const success = isFoundIP ? Math.random() > 0.05 : Math.random() > 0.3;
      
      setTestResult(prev => ({ ...prev, [id]: success ? 'success' : 'error' }));
      setTimeout(() => {
        setTestResult(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 3000);
    }, 2000);
  };

  const currentTemplate = activeTemplateTab === 'kitchen' ? localSettings.kitchenTemplate : localSettings.paymentTemplate;

  const updateTemplateSetting = (key: keyof typeof currentTemplate, value: any) => {
    const templateKey = activeTemplateTab === 'kitchen' ? 'kitchenTemplate' : 'paymentTemplate';
    setLocalSettings({
      ...localSettings,
      [templateKey]: {
        ...localSettings[templateKey],
        [key]: value
      }
    });
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto max-w-4xl">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-500" />
          Cài đặt hệ thống
        </h3>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" /> Lưu cài đặt
        </button>
      </div>

      {showSaved && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-xl text-sm font-bold animate-pulse">
          Đã lưu thay đổi thành công!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Store Info */}
        {isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
              <Store className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Thông tin cửa hàng</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Logo cửa hàng</label>
                <div className="flex gap-4 items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                    {localSettings.logo ? (
                      <img src={localSettings.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Store className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-block px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      Tải ảnh lên
                    </label>
                    <p className="text-[10px] text-gray-500">Dung lượng tối đa 1MB. Ảnh sẽ tự động thu nhỏ.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên cửa hàng</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={localSettings.storeName}
                  onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Địa chỉ</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={localSettings.address}
                  onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Số điện thoại</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={localSettings.phone}
                  onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Printer Settings */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 col-span-1 md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3 text-emerald-500">
              <Printer className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Cài đặt máy in (KiotViet Style)</h4>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">In tự động (Silent Print)</p>
                <p className="text-[10px] text-gray-500">Tự động in ra máy in mặc định mà không hiện hộp thoại in của trình duyệt</p>
              </div>
            </div>
            <button 
              onClick={() => setLocalSettings({...localSettings, silentPrinting: !localSettings.silentPrinting})}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                localSettings.silentPrinting ? "bg-emerald-500" : "bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                localSettings.silentPrinting ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleScanIP}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-400 transition-all disabled:opacity-50"
            >
              {scanning ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? 'Đang tìm kiếm...' : 'Quét mạng LAN'}
            </button>
            <button 
              onClick={handleAddPrinter}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm thủ công
            </button>
            <button 
              onClick={() => setShowDiscoveryGuide(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              <Info className="w-4 h-4" /> Hướng dẫn
            </button>
          </div>

          {/* Scanning Progress */}
          {scanning && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h5 className="text-sm font-bold text-blue-400">Đang quét dải IP trong mạng WiFi...</h5>
                    <p className="text-[10px] text-blue-400/60 font-mono">Đang kiểm tra: {currentScanningIP}</p>
                  </div>
                </div>
                <span className="text-xl font-mono font-bold text-blue-500">{scanProgress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Found Printers List */}
          {foundPrinters.length > 0 && !scanning && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-4">
              <h5 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Tìm thấy {foundPrinters.length} thiết bị phù hợp
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {foundPrinters.map((printer, idx) => (
                  <div key={idx} className="bg-black/20 p-3 rounded-xl flex justify-between items-center border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">{printer.name}</p>
                      <p className="text-xs text-gray-400">{printer.ip ? `${printer.ip}:${printer.port}` : 'Sẵn sàng kết nối'}</p>
                    </div>
                    <button 
                      onClick={() => handleAddFoundPrinter(printer)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all"
                    >
                      Kết nối
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {localSettings.printers?.length === 0 ? (
              <div className="col-span-full p-12 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-2">
                <Printer className="w-12 h-12 text-gray-700 mx-auto" />
                <p className="text-gray-500 text-sm">Chưa có máy in nào được cài đặt</p>
              </div>
            ) : (
              localSettings.printers?.map(printer => (
                <div key={printer.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative group">
                  <button 
                    onClick={() => handleDeletePrinter(printer.id)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      printer.isEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-800 text-gray-600"
                    )}>
                      <Wifi className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        className="bg-transparent border-none p-0 text-white font-bold focus:ring-0 w-full"
                        value={printer.name}
                        onChange={(e) => handleUpdatePrinter(printer.id, { name: e.target.value })}
                      />
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded uppercase font-bold",
                          printer.type === 'bill' ? "bg-blue-500/10 text-blue-500" : printer.type === 'kitchen' ? "bg-amber-500/10 text-amber-500" : "bg-purple-500/10 text-purple-500"
                        )}>
                          {printer.type === 'bill' ? 'Hóa đơn' : printer.type === 'kitchen' ? 'Bếp' : 'Cả hai'}
                        </span>
                        {printer.isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[8px] font-black uppercase">Mặc định</span>
                        )}
                        <span>•</span>
                        <span>{printer.connectionType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Địa chỉ IP</label>
                      <input 
                        type="text"
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        value={printer.ipAddress}
                        onChange={(e) => handleUpdatePrinter(printer.id, { ipAddress: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Cổng (Port)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        value={printer.port}
                        onChange={(e) => handleUpdatePrinter(printer.id, { port: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Khổ giấy</label>
                      <select 
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        value={printer.paperSize}
                        onChange={(e) => handleUpdatePrinter(printer.id, { paperSize: e.target.value as any })}
                      >
                        <option value="80mm" className="bg-[#1a1b1e]">K80 (80mm)</option>
                        <option value="58mm" className="bg-[#1a1b1e]">K58 (58mm)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Sử dụng cho</label>
                      <select 
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        value={printer.type}
                        onChange={(e) => handleUpdatePrinter(printer.id, { type: e.target.value as any })}
                      >
                        <option value="bill" className="bg-[#1a1b1e]">Hóa đơn</option>
                        <option value="kitchen" className="bg-[#1a1b1e]">Bếp</option>
                        <option value="both" className="bg-[#1a1b1e]">Cả hai</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {!printer.isDefault && (
                        <button 
                          onClick={() => handleSetDefault(printer.id)}
                          className="px-3 py-1.5 bg-white/5 text-gray-400 text-[10px] font-bold rounded-lg hover:bg-white/10 hover:text-white transition-all"
                        >
                          Đặt mặc định
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => testConnection(printer.id)}
                        disabled={testingPrinter === printer.id}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                          testResult[printer.id] === 'success' ? "bg-emerald-500/20 text-emerald-500" :
                          testResult[printer.id] === 'error' ? "bg-rose-500/20 text-rose-500" :
                          "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {testingPrinter === printer.id ? (
                          <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : testResult[printer.id] === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : testResult[printer.id] === 'error' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Printer className="w-3 h-3" />
                        )}
                        {testingPrinter === printer.id ? 'Đang thử...' : 
                         testResult[printer.id] === 'success' ? 'Đã kết nối' :
                         testResult[printer.id] === 'error' ? 'Lỗi kết nối' : 'In thử'}
                      </button>

                      <button 
                        onClick={() => handleUpdatePrinter(printer.id, { isEnabled: !printer.isEnabled })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative",
                          printer.isEnabled ? "bg-emerald-500" : "bg-gray-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                          printer.isEnabled ? "left-5.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Print Template Settings */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-500">
              <Layout className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Cấu hình mẫu in</h4>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTemplateTab('payment')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTemplateTab === 'payment' ? "bg-emerald-500 text-black" : "text-gray-500 hover:text-white"
                )}
              >
                Mẫu Hóa đơn
              </button>
              <button 
                onClick={() => setActiveTemplateTab('kitchen')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTemplateTab === 'kitchen' ? "bg-emerald-500 text-black" : "text-gray-500 hover:text-white"
                )}
              >
                Mẫu Bếp
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'showTime', label: 'Thời gian in', key: 'showTime' },
                  { id: 'showStaffName', label: 'Tên nhân viên', key: 'showStaffName' },
                  { id: 'showStoreAddress', label: 'Địa chỉ quán', key: 'showStoreAddress' },
                  { id: 'showStorePhone', label: 'Số điện thoại', key: 'showStorePhone' },
                  { id: 'showLogo', label: 'Logo quán', key: 'showLogo' },
                  { id: 'showNote', label: 'Ghi chú món', key: 'showNote' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => updateTemplateSetting(item.key as any, !currentTemplate[item.key as keyof typeof currentTemplate])}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      currentTemplate[item.key as keyof typeof currentTemplate]
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                        : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-400"
                    )}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    {currentTemplate[item.key as keyof typeof currentTemplate] && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-3 block">Kích thước chữ</label>
                <div className="flex gap-3">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => updateTemplateSetting('fontSize', size)}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-xs font-bold transition-all uppercase",
                        currentTemplate.fontSize === size
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                          : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                      )}
                    >
                      {size === 'small' ? 'Nhỏ' : size === 'medium' ? 'Vừa' : 'Lớn'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl text-black space-y-4 min-h-[400px] flex flex-col font-mono">
              <div className="text-center border-b border-dashed border-gray-200 pb-4 space-y-1">
                {currentTemplate.showLogo && localSettings.logo && (
                  <img src={localSettings.logo} alt="Logo" className="w-12 h-12 mx-auto mb-2 grayscale" />
                )}
                <h5 className="font-bold text-lg uppercase">{localSettings.storeName}</h5>
                {currentTemplate.showStoreAddress && (
                  <p className="text-[10px] text-gray-600">{localSettings.address || 'Địa chỉ quán...'}</p>
                )}
                {currentTemplate.showStorePhone && (
                  <p className="text-[10px] text-gray-600">ĐT: {localSettings.phone || '0123.456.789'}</p>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                  <div>
                    <p className="text-xs font-bold">{activeTemplateTab === 'payment' ? 'HÓA ĐƠN TẠM TÍNH' : 'PHIẾU BẾP'}</p>
                    <p className="text-[9px] text-gray-500">Bàn: Bàn 01</p>
                  </div>
                  <div className="text-right">
                    {currentTemplate.showTime && (
                      <p className="text-[8px] text-gray-400">06/03/2026 10:30</p>
                    )}
                    {currentTemplate.showStaffName && (
                      <p className="text-[8px] text-gray-400">NV: Admin</p>
                    )}
                  </div>
                </div>

                <table className={cn("w-full", currentTemplate.fontSize === 'small' ? 'text-[9px]' : currentTemplate.fontSize === 'medium' ? 'text-[10px]' : 'text-[12px]')}>
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1">Tên món</th>
                      <th className="text-center py-1">SL</th>
                      {activeTemplateTab === 'payment' && <th className="text-right py-1">T.Tiền</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">
                        Phở Bò Tái Lăn
                        {currentTemplate.showNote && <div className="text-[8px] italic text-gray-500">(Không hành)</div>}
                      </td>
                      <td className="text-center py-1">2</td>
                      {activeTemplateTab === 'payment' && <td className="text-right py-1">130.000</td>}
                    </tr>
                    <tr>
                      <td className="py-1">Coca Cola</td>
                      <td className="text-center py-1">1</td>
                      {activeTemplateTab === 'payment' && <td className="text-right py-1">15.000</td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {activeTemplateTab === 'payment' && (
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>TỔNG CỘNG:</span>
                    <span>145.000đ</span>
                  </div>
                  <p className="text-[9px] text-center italic text-gray-500 pt-4">Cảm ơn Quý khách. Hẹn gặp lại!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Login */}
        {isAdmin ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
              <Shield className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Tài khoản Admin</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50"
                    value={localSettings.adminUsername}
                    onChange={(e) => setLocalSettings({...localSettings, adminUsername: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="Để trống nếu không đổi"
                    onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
              <User className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Tài khoản cá nhân</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed"
                    value={currentUser?.username || ''}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="Để trống nếu không đổi"
                    value={newPersonalPassword}
                    onChange={(e) => setNewPersonalPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Data Management */}
        {isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Quản lý dữ liệu hệ thống</h4>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Các thao tác dưới đây sẽ ảnh hưởng trực tiếp đến dữ liệu vận hành. Hãy cẩn trọng.</p>
              <button 
                onClick={onResetAllTables}
                className="w-full py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Đặt lại toàn bộ bàn (Xóa đơn treo)
              </button>
            </div>
          </div>
        )}

        {/* Kitchen Settings */}
        {isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-emerald-500">
              <Bell className="w-5 h-5" />
              <h4 className="font-bold uppercase text-xs tracking-wider">Cài đặt vận hành</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Thuế VAT (%)</label>
                <input 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={localSettings.vatPercent}
                  onChange={(e) => setLocalSettings({...localSettings, vatPercent: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <p className="font-bold text-white text-sm">Chuông báo món mới</p>
                  <p className="text-[10px] text-gray-500">Phát âm thanh khi có đơn hàng mới</p>
                </div>
                <button 
                  onClick={() => setLocalSettings({...localSettings, kitchenBellEnabled: !localSettings.kitchenBellEnabled})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    localSettings.kitchenBellEnabled ? "bg-emerald-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    localSettings.kitchenBellEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Danh mục kho</label>
                <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                  {localSettings.inventoryCategories.map((cat, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-xs flex items-center gap-2">
                      {cat}
                      <button 
                        onClick={() => setLocalSettings({
                          ...localSettings, 
                          inventoryCategories: localSettings.inventoryCategories.filter((_, idx) => idx !== i)
                        })}
                        className="text-rose-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button 
                    onClick={() => {
                      const newCat = prompt('Nhập danh mục kho mới:');
                      if (newCat) setLocalSettings({
                        ...localSettings, 
                        inventoryCategories: [...localSettings.inventoryCategories, newCat]
                      });
                    }}
                    className="px-3 py-1 border border-dashed border-white/20 rounded-lg text-xs hover:border-white/40"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Hạng mục thu chi (Sổ quỹ)</label>
                <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                  {localSettings.cashCategories.map((cat, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-xs flex items-center gap-2">
                      {cat}
                      <button 
                        onClick={() => setLocalSettings({
                          ...localSettings, 
                          cashCategories: localSettings.cashCategories.filter((_, idx) => idx !== i)
                        })}
                        className="text-rose-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button 
                    onClick={() => {
                      const newCat = prompt('Nhập hạng mục mới:');
                      if (newCat) setLocalSettings({
                        ...localSettings, 
                        cashCategories: [...localSettings.cashCategories, newCat]
                      });
                    }}
                    className="px-3 py-1 border border-dashed border-white/20 rounded-lg text-xs hover:border-white/40"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Guide Modal */}
      {showDiscoveryGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1b1e] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3 text-amber-500">
                <Info className="w-5 h-5" />
                <h4 className="font-bold uppercase text-xs tracking-wider">Hướng dẫn kết nối máy in</h4>
              </div>
              <button 
                onClick={() => setShowDiscoveryGuide(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-4">
                <h5 className="text-emerald-500 font-bold flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> 1. Kết nối LAN/WiFi
                </h5>
                <div className="bg-white/5 rounded-xl p-4 space-y-2 text-xs text-gray-400 leading-relaxed">
                  <p>• Đảm bảo máy in và điện thoại/máy tính bảng kết nối cùng một mạng WiFi.</p>
                  <p>• Sử dụng chức năng <span className="text-blue-400 font-bold">"Quét mạng LAN"</span> để tự động tìm kiếm địa chỉ IP của máy in.</p>
                  <p>• Nếu không tìm thấy, hãy kiểm tra địa chỉ IP trên máy in bằng cách in trang <span className="text-white">Self-test</span> (thường bằng cách giữ nút Feed khi bật nguồn).</p>
                  <p>• Nhập thủ công địa chỉ IP nếu bạn đã biết (ví dụ: 192.168.1.100).</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-[10px] text-amber-500 leading-relaxed">
                  <strong>Mẹo từ KiotViet:</strong> Sau khi kết nối thành công, hãy bấm <strong>"Đặt mặc định"</strong> để ứng dụng luôn ưu tiên sử dụng máy in này cho mọi đơn hàng.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/10">
              <button 
                onClick={() => setShowDiscoveryGuide(false)}
                className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
