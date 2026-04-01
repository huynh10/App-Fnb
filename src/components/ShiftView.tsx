import React from 'react';
import { Wallet, Clock, ArrowRight, Lock, Unlock, History, X, AlertTriangle, Eye } from 'lucide-react';
import { Shift, VoidLog, User } from '../types';
import { format, isAfter, subDays } from 'date-fns';
import { cn } from '../lib/utils';

export const ShiftView = ({ 
  activeShift, 
  allActiveShifts = [],
  history, 
  onOpenShift, 
  onCloseShift,
  currentUser
}: { 
  activeShift: Shift | null, 
  allActiveShifts?: Shift[],
  history: Shift[],
  onOpenShift: (startCash: number) => void,
  onCloseShift: (endCash: number) => void,
  currentUser: User | null
}) => {
  const [showOpenModal, setShowOpenModal] = React.useState(false);
  const [showCloseModal, setShowCloseModal] = React.useState(false);
  const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);
  const [cashAmount, setCashAmount] = React.useState(0);
  const [showVoidLogs, setShowVoidLogs] = React.useState<VoidLog[] | null>(null);

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Filter history to last 3 days and by user role
  const recentHistory = history.filter(shift => {
    if (!shift.endTime) return false;
    
    // If not admin/manager, only show their own shifts
    if (!isAdminOrManager && shift.staffId !== currentUser?.id) return false;

    const shiftDate = new Date(shift.endTime);
    const threeDaysAgo = subDays(new Date(), 3);
    return isAfter(shiftDate, threeDaysAgo);
  });

  // Other active shifts (for admin/manager)
  const otherActiveShifts = allActiveShifts.filter(s => s.id !== activeShift?.id);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 h-full overflow-y-auto pb-20 md:pb-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-500" />
          Quản lý Ca làm việc
        </h3>
        {!activeShift && (
          <button 
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all cursor-pointer text-sm md:text-base"
          >
            <Unlock className="w-4 h-4 md:w-5 md:h-5" /> Mở ca mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Current Active Shift */}
        <div className={cn(
          "lg:col-span-2 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden border-2",
          activeShift 
            ? "bg-emerald-500/5 border-emerald-500/20" 
            : "bg-white/5 border-white/10 opacity-50"
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          
          {activeShift ? (
            <>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full uppercase tracking-widest">Đang hoạt động</span>
                  <h4 className="text-3xl font-bold text-white mt-4">Ca của bạn</h4>
                  <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Bắt đầu lúc: {format(new Date(activeShift.startTime), 'HH:mm, dd/MM/yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Doanh thu hiện tại</p>
                  <p className="text-4xl font-mono font-bold text-emerald-500">{activeShift.totalRevenue.toLocaleString()}đ</p>
                </div>
              </div>

              {/* Alert for Active Shift - ONLY VISIBLE TO ADMIN/MANAGER */}
              {activeShift.voidLogs && activeShift.voidLogs.length > 0 && isAdminOrManager && (
                <div className="relative z-10 bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3 text-rose-500">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                      <p className="font-bold text-sm">CẢNH BÁO: Phát hiện chênh lệch!</p>
                      <p className="text-xs opacity-80">Có {activeShift.voidLogs.length} lần giảm món sau khi đã gọi.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowVoidLogs(activeShift.voidLogs || [])}
                    className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-all"
                  >
                    Xem chi tiết
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10 relative z-10">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Tiền đầu ca</p>
                  <p className="text-xl font-mono font-bold text-white">{activeShift.startCash.toLocaleString()}đ</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Tiền mặt (Thu)</p>
                  <p className="text-xl font-mono font-bold text-emerald-400">{(activeShift.totalCash || 0).toLocaleString()}đ</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Chuyển khoản (Thu)</p>
                  <p className="text-xl font-mono font-bold text-blue-400">{(activeShift.totalTransfer || 0).toLocaleString()}đ</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Tổng tiền dự kiến</p>
                  <p className="text-xl font-mono font-bold text-white">{(activeShift.startCash + (activeShift.totalCash || 0)).toLocaleString()}đ</p>
                </div>
              </div>

              <div className="pt-4 relative z-10">
                <button 
                  onClick={() => setShowCloseModal(true)}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition-all cursor-pointer"
                >
                  <Lock className="w-5 h-5" /> Kết thúc ca & Chốt tiền
                </button>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-4">
              <Lock className="w-12 h-12 opacity-20" />
              <p className="text-lg">Bạn chưa mở ca làm việc nào</p>
              <button 
                onClick={() => setShowOpenModal(true)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              >
                Bắt đầu ca làm việc ngay
              </button>
            </div>
          )}

          {/* Other Active Shifts for Admin/Manager */}
          {isAdminOrManager && otherActiveShifts.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Các ca đang hoạt động khác
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherActiveShifts.map(shift => (
                  <div key={shift.id} onClick={() => setSelectedShift(shift)} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{shift.staffName || 'Nhân viên'}</span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Đang mở</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Bắt đầu: {format(new Date(shift.startTime), 'HH:mm, dd/MM')}</p>
                    <p className="text-sm">Doanh thu: <span className="text-emerald-400 font-mono font-bold">{shift.totalRevenue.toLocaleString()}đ</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
          <h4 className="font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" /> Lịch sử ca gần đây (3 ngày)
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {recentHistory.length > 0 ? recentHistory.map(shift => (
              <div 
                key={shift.id} 
                onClick={() => setSelectedShift(shift)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                  shift.voidLogs && shift.voidLogs.length > 0 && isAdminOrManager
                    ? "bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/10"
                    : "bg-white/5 border-white/5 hover:border-emerald-500/50 hover:bg-white/10"
                )}
              >
                {shift.voidLogs && shift.voidLogs.length > 0 && isAdminOrManager && (
                  <div className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-bl-xl">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <p className={cn("font-bold text-sm transition-colors", shift.voidLogs && shift.voidLogs.length > 0 && isAdminOrManager ? "text-rose-400" : "text-gray-300 group-hover:text-white")}>
                    {shift.voidLogs && shift.voidLogs.length > 0 && isAdminOrManager ? 'CÓ CHÊNH LỆCH' : 'Ca đã đóng'}
                  </p>
                  <span className="text-[10px] text-gray-500">{format(new Date(shift.endTime!), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-xs text-gray-400">Doanh thu: <span className="text-white font-mono">{(shift.totalRevenue / 1000000).toFixed(1)}M</span></p>
                  <div className="text-[10px] text-gray-500">
                    {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime!), 'HH:mm')}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8 text-sm italic">Chưa có lịch sử ca trong 3 ngày qua</p>
            )}
          </div>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold text-white">Mở ca làm việc</h3>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Tiền mặt đầu ca</label>
              <input 
                type="number" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-mono focus:outline-none focus:border-emerald-500"
                placeholder="Nhập số tiền..."
                onChange={(e) => setCashAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowOpenModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  onOpenShift(cashAmount);
                  setShowOpenModal(false);
                }}
                className="flex-1 py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all cursor-pointer"
              >
                Mở ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold text-white">Kết thúc ca</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Doanh thu ca:</span>
                  <span className="text-white font-bold">{activeShift.totalRevenue.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tiền mặt (Thu):</span>
                  <span className="text-emerald-400 font-bold">{(activeShift.totalCash || 0).toLocaleString()}đ</span>
                </div>
                 <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Chuyển khoản (Thu):</span>
                  <span className="text-blue-400 font-bold">{(activeShift.totalTransfer || 0).toLocaleString()}đ</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                  <span className="text-gray-400">Tiền mặt dự kiến (Gốc + Thu):</span>
                  <span className="text-emerald-500 font-bold">{(activeShift.startCash + (activeShift.totalCash || 0)).toLocaleString()}đ</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Tiền mặt thực tế kiểm kê</label>
                <input 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="Nhập số tiền..."
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all cursor-pointer"
              >
                Quay lại
              </button>
              <button 
                onClick={() => {
                  onCloseShift(cashAmount);
                  setShowCloseModal(false);
                }}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all cursor-pointer"
              >
                Chốt ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Details Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">Chi tiết ca làm việc</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {format(new Date(selectedShift.startTime), 'HH:mm')} - {selectedShift.endTime ? format(new Date(selectedShift.endTime), 'HH:mm, dd/MM/yyyy') : 'Đang mở'}
                </p>
              </div>
              <button onClick={() => setSelectedShift(null)} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedShift.voidLogs && selectedShift.voidLogs.length > 0 && isAdminOrManager && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>CẢNH BÁO: PHÁT HIỆN CHÊNH LỆCH</span>
                </div>
                <button 
                  onClick={() => {
                    setShowVoidLogs(selectedShift.voidLogs || []);
                    setSelectedShift(null);
                  }}
                  className="w-full py-2 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600 transition-all"
                >
                  Xem chi tiết {selectedShift.voidLogs.length} lần giảm món
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase mb-1">Tổng doanh thu</p>
                <p className="text-xl font-mono font-bold text-emerald-500">{selectedShift.totalRevenue.toLocaleString()}đ</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase mb-1">Tiền đầu ca</p>
                <p className="text-xl font-mono font-bold text-white">{selectedShift.startCash.toLocaleString()}đ</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Chi tiết thu</h4>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tiền mặt (Cash)</span>
                  <span className="font-mono font-bold text-white">{(selectedShift.totalCash || 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chuyển khoản (Transfer)</span>
                  <span className="font-mono font-bold text-white">{(selectedShift.totalTransfer || 0).toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Tổng kết tiền mặt</h4>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dự kiến (Đầu ca + Thu)</span>
                  <span className="font-mono font-bold text-white">{(selectedShift.startCash + (selectedShift.totalCash || 0)).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Thực tế kiểm kê</span>
                  <span className="font-mono font-bold text-emerald-500">{(selectedShift.endCash || 0).toLocaleString()}đ</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-gray-400">Chênh lệch</span>
                  <span className={cn(
                    "font-mono font-bold",
                    (selectedShift.endCash || 0) - (selectedShift.startCash + (selectedShift.totalCash || 0)) < 0 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {((selectedShift.endCash || 0) - (selectedShift.startCash + (selectedShift.totalCash || 0))).toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Void Logs Modal */}
      {showVoidLogs && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#1a1b1e] w-full max-w-3xl rounded-3xl p-8 border border-rose-500/30 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-bold text-white">Nhật ký chênh lệch</h3>
                  <p className="text-sm text-rose-400">Phát hiện giảm món sau khi đã gọi</p>
                </div>
              </div>
              <button onClick={() => setShowVoidLogs(null)} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-xl border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 font-bold uppercase text-xs sticky top-0">
                  <tr>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Nhân viên</th>
                    <th className="p-4">Bàn</th>
                    <th className="p-4">Món / Nội dung</th>
                    <th className="p-4 text-center">Chi tiết cũ</th>
                    <th className="p-4 text-center">Chi tiết mới</th>
                    <th className="p-4 text-right">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...showVoidLogs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((log) => {
                    const isBillVoid = log.type === 'bill_void';
                    const hasDetails = log.details && log.details.length > 0;

                    return (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-gray-400 font-mono align-top">{format(new Date(log.time), 'HH:mm:ss')}</td>
                        <td className="p-4 font-medium align-top">{log.staffName}</td>
                        <td className="p-4 text-gray-400 align-top">{log.tableName}</td>
                        <td className="p-4 font-medium text-white align-top">
                          {hasDetails ? (
                            <div className="space-y-2">
                              {isBillVoid && <div className="text-rose-400 font-bold mb-1">⚠️ CHÊNH LỆCH TỔNG BILL</div>}
                              {log.details!.map((detail, idx) => (
                                <div key={idx} className="flex flex-col text-xs border-b border-white/5 pb-1 last:border-0">
                                  <span className="text-emerald-400">{detail.itemName}</span>
                                  <div className="flex gap-2 text-gray-400">
                                    <span>SL: {detail.oldQuantity} → {detail.newQuantity}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              {log.itemName}
                              {isBillVoid && <div className="text-[10px] text-rose-400 italic mt-1">Tổng tiền thanh toán thấp hơn tiền đã báo bếp</div>}
                            </>
                          )}
                        </td>
                        <td className="p-4 text-center text-gray-400 align-top">
                          {isBillVoid ? (
                            <span className="font-mono block">{log.oldQuantity.toLocaleString()}đ</span>
                          ) : (
                            !hasDetails && <span>{log.oldQuantity}</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-white align-top">
                          {isBillVoid ? (
                            <span className="font-mono text-rose-400 block">{log.newQuantity.toLocaleString()}đ</span>
                          ) : (
                            !hasDetails && <span>{log.newQuantity}</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-rose-500 align-top">
                          -{log.valueDiff.toLocaleString()}đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowVoidLogs(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
