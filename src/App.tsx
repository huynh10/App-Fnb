/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ChefHat, 
  BarChart3, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  FileText,
  User as UserIcon, 
  ChevronRight,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Wallet,
  Settings,
  LogOut,
  Bell,
  Shield,
  Check,
  X,
  Printer,
  Lock,
  LayoutGrid,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, parseISO } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { 
  Table, 
  MenuItem, 
  OrderItem, 
  AddOnItem,
  OrderSession,
  VoidItemDetail,
  VoidLog,
  ViewType, 
  Invoice,
  InventoryTransaction,
  SystemSettings,
  TableGroup,
  InventoryAudit,
  StockCardEntry,
  INITIAL_MENU, 
  INITIAL_TABLES, 
  CATEGORIES,
  INITIAL_USERS,
  User,
  Shift,
  CashTransaction
} from './types';

import { db } from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteField
} from 'firebase/firestore';

// Import new views
import { InventoryView } from './components/InventoryView';
import { CustomerView } from './components/CustomerView';
import { ShiftView } from './components/ShiftView';
import { MenuMgmtView } from './components/MenuMgmtView';
import { UserMgmtView } from './components/UserMgmtView';
import { LoginView } from './components/LoginView';
import { RegisterStoreView } from './components/RegisterStoreView';
import { SummaryView } from './components/SummaryView';
import { SettingsView } from './components/SettingsView';
import { PrinterService } from './services/printerService';

// --- Components ---

const Sidebar = ({ activeView, setView, onLogout, currentUser }: { 
  activeView: ViewType, 
  setView: (v: ViewType) => void,
  onLogout: () => void,
  currentUser: User | null
}) => {
  const allMenuItems = [
    { id: 'tables', label: 'Phòng bàn', icon: LayoutDashboard },
    { id: 'menu_mgmt', label: 'Thực đơn', icon: UtensilsCrossed },
    { id: 'kitchen', label: 'Nhà bếp', icon: ChefHat },
    { id: 'inventory', label: 'Kho hàng', icon: Package },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'shifts', label: 'Ca làm việc', icon: Wallet },
    { id: 'summary', label: 'Tổng kết', icon: FileText },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'order') {
      return ['tables', 'shifts', 'summary', 'settings'].includes(item.id);
    }
    if (currentUser.role === 'cashier') {
      return ['tables', 'summary'].includes(item.id);
    }
    return ['tables', 'summary'].includes(item.id); // Default for staff
  });

  if (currentUser?.role === 'admin') {
    menuItems.push({ id: 'user_mgmt', label: 'Nhân viên', icon: Shield });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-[#151619] text-white h-screen flex-col border-r border-white/10 shrink-0">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Coffee className="w-5 h-5 text-black" />
            </div>
            FNB MASTER
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                activeView === item.id 
                  ? "bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/20" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeView === item.id ? "text-black" : "group-hover:text-white")} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setView('settings')}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" /> Cài đặt hệ thống
          </button>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden text-sm">
              <p className="font-medium truncate text-white">{currentUser?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase truncate">{currentUser?.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="text-gray-500 hover:text-rose-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#151619] border-t border-white/10 flex items-center justify-between px-4 z-40 overflow-x-auto no-scrollbar gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewType)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[60px] h-full gap-1 transition-all duration-200",
              activeView === item.id 
                ? "text-emerald-500" 
                : "text-gray-500 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeView === item.id && "fill-current")} />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
        <button 
            onClick={onLogout}
            className="flex flex-col items-center justify-center min-w-[60px] h-full gap-1 text-rose-500/70 hover:text-rose-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium whitespace-nowrap">Thoát</span>
        </button>
      </div>
    </>
  );
};

const TableGrid = ({ tables, onSelectTable, onDeleteTable, onEditTable }: { 
  tables: Table[], 
  onSelectTable: (t: Table) => void, 
  onDeleteTable: (id: string) => void,
  onEditTable: (t: Table) => void
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
      {tables.map((table) => (
        <motion.div
          key={table.id}
          whileHover={{ scale: 1.02 }}
          className={cn(
            "relative h-32 rounded-2xl p-4 flex flex-col justify-between text-left transition-all border-2 group",
            table.status === 'occupied' 
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
              : table.status === 'reserved'
              ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
              : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
          )}
        >
          <div className="flex justify-between items-start">
            <button 
              onClick={() => onSelectTable(table)}
              className="font-bold text-lg flex-1 text-left cursor-pointer"
            >
              {table.name}
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTable(table);
                }}
                className="p-1 text-gray-500 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              {table.status === 'occupied' && (
                <div className="flex items-center gap-1 text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  {table.startTime ? format(new Date(table.startTime), 'HH:mm') : '--:--'}
                </div>
              )}
              {table.status === 'empty' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTable(table.id);
                  }}
                  className="p-1 text-gray-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => onSelectTable(table)}
            className="space-y-1 flex-1 w-full text-left cursor-pointer"
          >
            <p className="text-xs opacity-70">
              {table.status === 'occupied' 
                ? `${(table.orders || []).reduce((sum, o) => sum + o.items.length, 0) + (table.currentOrder?.length || 0)} món ${table.orders && table.orders.length > 1 ? `(${table.orders.length} đơn)` : ''}` 
                : 'Bàn trống'}
            </p>
            {table.status === 'occupied' && (
              <p className="font-mono text-sm font-bold">
                {((table.orders || []).reduce((sum, o) => sum + o.total, 0) + (table.currentOrder?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0)).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}đ
              </p>
            )}
          </button>
        </motion.div>
      ))}
    </div>
  );
};

const MenuOrdering = ({ 
  selectedTable, 
  tables, // New prop
  onClose, 
  onUpdateOrder,
  onCheckout,
  onMergeTables, // New prop
  menu,
  categories,
  vatPercent,
  onPrint,
  staffName,
  currentUser,
  onUpdateTable,
  onLogVoid,
  activeShift
}: { 
  selectedTable: Table, 
  tables: Table[],
  onClose: () => void, 
  onUpdateOrder: (tableId: string, order: OrderItem[]) => void,
  onCheckout: (tableId: string, ordersToPay: OrderSession[], discount: number, paymentMethod: 'cash' | 'transfer' | 'qr', shouldPrint: boolean) => void,
  onMergeTables: (targetTableId: string, sourceTableIds: string[]) => void,
  menu: MenuItem[],
  categories: string[],
  vatPercent: number,
  onPrint: (data: any) => void,
  staffName: string,
  currentUser: User | null,
  onUpdateTable: (id: string, updates: Partial<Table>) => void,
  onLogVoid: (log: VoidLog) => void,
  activeShift: Shift | null
}) => {
  const isCashier = currentUser?.role === 'cashier';
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Draft order (New items being added)
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>(selectedTable.currentOrder || []);
  
  // Sync local state with fresh table data from props
  const activeTable = tables.find(t => t.id === selectedTable.id) || selectedTable;
  
  // Committed orders (Already sent to kitchen)
  const committedOrders = (activeTable.orders || []).filter(o => o.status !== 'paid');

  const [discount, setDiscount] = useState(activeTable.discount || 0);
  const [vat] = useState(vatPercent); 
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qr'>('cash');
  
  // Sync discount if it changes in DB (e.g. reset after partial payment)
  useEffect(() => {
    setDiscount(activeTable.discount || 0);
  }, [activeTable.discount]);

  // Item Configuration State
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [editingCommittedInfo, setEditingCommittedInfo] = useState<{orderId: string, itemIndex: number} | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNote, setItemNote] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnItem[]>([]); // Array of add-ons (can contain duplicates for quantity)

  const [isPrintKitchenEnabled, setIsPrintKitchenEnabled] = useState(() => {
    const saved = localStorage.getItem('isPrintKitchenEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showMergeModal, setShowMergeModal] = useState(false);
  const [tablesToMerge, setTablesToMerge] = useState<string[]>([]);
  const [selectedOrdersToPay, setSelectedOrdersToPay] = useState<string[]>([]); // IDs of orders selected for payment
  const [isProcessing, setIsProcessing] = useState(false);

  const [viewMode, setViewMode] = useState<'menu' | 'order'>(
    selectedTable.status === 'occupied' ? 'order' : 'menu'
  );

  useEffect(() => {
    setSelectedOrdersToPay([]);
    setDiscount(activeTable.discount || 0);
    // Automatically switch to order view if table is occupied
    if (activeTable.status === 'occupied') {
      setViewMode('order');
    } else {
      setViewMode('menu');
    }
  }, [activeTable.id]);

  useEffect(() => {
    localStorage.setItem('isPrintKitchenEnabled', JSON.stringify(isPrintKitchenEnabled));
  }, [isPrintKitchenEnabled]);

  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    return menu.filter(item => {
      if (!item || !item.name) return false;
      const matchesCategory = activeCategory === 'Tất cả' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isNotRawMaterial = item.category !== 'Nguyên liệu';
      const isNotInventory = !item.isInventory;
      return matchesCategory && matchesSearch && isNotRawMaterial && isNotInventory;
    });
  }, [activeCategory, searchQuery, menu]);

  const allCommittedItems = useMemo(() => {
    const items: OrderItem[] = [];
    committedOrders.forEach(o => {
      if (selectedOrdersToPay.length === 0 || selectedOrdersToPay.includes(o.id)) {
        items.push(...o.items);
      }
    });
    
    // Group them by ID, price, add-ons, and note
    const grouped: OrderItem[] = [];
    items.forEach(item => {
      const key = `${item.id}-${item.price}-${JSON.stringify([...(item.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||'')))}-${item.note||''}`;
      const existing = grouped.find(i => {
        const eKey = `${i.id}-${i.price}-${JSON.stringify([...(i.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||'')))}-${i.note||''}`;
        return eKey === key;
      });
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        grouped.push({...item});
      }
    });
    return grouped;
  }, [committedOrders, selectedOrdersToPay]);

  const handleItemClick = (item: MenuItem) => {
    setConfiguringItem(item);
    setEditingDraftIndex(null);
    setItemQuantity(1);
    setItemNote('');
    setSelectedAddOns([]);
  };

  const handleEditDraftItem = (item: OrderItem, index: number) => {
    setConfiguringItem(item);
    setEditingDraftIndex(index);
    setEditingCommittedInfo(null);
    setItemQuantity(item.quantity);
    setItemNote(item.note || '');
    setSelectedAddOns(item.selectedAddOns || []);
  };

  const handleEditCommittedItem = (item: OrderItem, orderId: string, itemIndex: number) => {
    setConfiguringItem(item);
    setEditingCommittedInfo({ orderId, itemIndex });
    setEditingDraftIndex(null);
    setItemQuantity(item.quantity);
    setItemNote(item.note || '');
    setSelectedAddOns(item.selectedAddOns || []);
  };

  const handleConfirmAddItem = () => {
    if (!configuringItem) return;
    
    const newItem: OrderItem = {
      ...configuringItem,
      quantity: itemQuantity,
      note: itemNote,
      selectedAddOns: selectedAddOns
    };

    if (editingCommittedInfo) {
      // Update committed order in DB
      const { orderId, itemIndex } = editingCommittedInfo;
      const order = committedOrders.find(o => o.id === orderId);
      if (order) {
        const oldItem = order.items[itemIndex];
        let updatedItems = [...order.items];
        
        if (newItem.quantity <= 0) {
          // Remove item
          updatedItems.splice(itemIndex, 1);
        } else {
          updatedItems[itemIndex] = newItem;
        }
        
        // Recalculate order total
        const newTotal = updatedItems.reduce((sum, i) => sum + (i.price + (i.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * i.quantity, 0);
        
        const updatedOrders = (activeTable.orders || []).map(o => 
          o.id === orderId ? { ...o, items: updatedItems, total: newTotal, subtotal: newTotal } : o
        );

        onUpdateTable(activeTable.id, { orders: updatedOrders });

        // Log void if quantity reduced or item removed
        if (newItem.quantity < oldItem.quantity && activeShift) {
          const diff = oldItem.quantity - Math.max(0, newItem.quantity);
          const valueDiff = diff * (oldItem.price + (oldItem.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0));
          
          const voidLog: VoidLog = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toISOString(),
            staffName: staffName,
            tableName: activeTable.name,
            itemName: oldItem.name,
            oldQuantity: oldItem.quantity,
            newQuantity: Math.max(0, newItem.quantity),
            valueDiff: valueDiff,
            type: 'item_void'
          };
          
          if (onLogVoid) onLogVoid(voidLog);
          alert(`⚠️ Đã ghi nhận thay đổi số lượng món [${oldItem.name}]: ${oldItem.quantity} -> ${Math.max(0, newItem.quantity)}`);
        }
      }
    } else {
      // Update draft order
      setCurrentOrder(prev => {
        if (editingDraftIndex !== null) {
          const updated = [...prev];
          if (newItem.quantity <= 0) {
            updated.splice(editingDraftIndex, 1);
          } else {
            updated[editingDraftIndex] = newItem;
          }
          return updated;
        }

        if (newItem.quantity <= 0) return prev;

        // Check if same item with same addons and note exists
        const existingIndex = prev.findIndex(i => 
          i.id === newItem.id && 
          JSON.stringify([...(i.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||''))) === JSON.stringify([...(newItem.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||''))) &&
          i.note === newItem.note
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity += newItem.quantity;
          return updated;
        }
        return [...prev, newItem];
      });
    }

    setConfiguringItem(null);
    setEditingDraftIndex(null);
    setEditingCommittedInfo(null);
  };

  const handleCallDish = async () => {
    if (currentOrder.length === 0 || isProcessing) return null;
    
    setIsProcessing(true);
    try {
      const newSessionId = Math.random().toString(36).substr(2, 9);
      await onUpdateOrder(activeTable.id, currentOrder);
      
      if (isPrintKitchenEnabled) {
        onPrint({
          type: 'kitchen',
          tableName: activeTable.name,
          items: currentOrder,
          staffName: staffName
        });
      }
      
      setCurrentOrder([]); // Clear draft after sending
      onClose(); // Exit to table grid after sending
      return newSessionId;
    } catch (error) {
      console.error('Order error:', error);
      alert('Có lỗi xảy ra khi gọi món. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (shouldPrint: boolean = false) => {
    if (isProcessing) return;
    
    let ordersToPay: OrderSession[] = [];
    const unpaidCommitted = committedOrders.filter(o => o.status !== 'paid');
    
    if (selectedOrdersToPay.length > 0) {
      ordersToPay = committedOrders.filter(o => selectedOrdersToPay.includes(o.id));
    } else {
      ordersToPay = [...unpaidCommitted];
    }

    if (currentOrder.length > 0) {
      const subtotal = currentOrder.reduce((sum, item) => sum + (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity, 0);
      const vatAmount = Math.round(subtotal * (vatPercent || 0) / 100);
      const total = subtotal + vatAmount;
      
      const tempSession: OrderSession = {
        id: 'draft-' + Date.now(),
        items: [...currentOrder],
        startTime: new Date().toISOString(),
        subtotal,
        discount: 0,
        vat: vatPercent || 0,
        total,
        status: 'pending',
        staffId: currentUser?.id || ''
      };
      
      ordersToPay.push(tempSession);
      
      if (isPrintKitchenEnabled) {
        onPrint({
          type: 'kitchen',
          tableName: activeTable.name,
          items: currentOrder,
          staffName: staffName
        });
      }
    }

    if (ordersToPay.length === 0) {
      alert("Vui lòng chọn đơn để thanh toán");
      return;
    }

    setIsProcessing(true);
    try {
      await onCheckout(activeTable.id, ordersToPay, discount, paymentMethod, shouldPrint);
      
      // Clear local states
      setCurrentOrder([]);
      setSelectedOrdersToPay([]);
      
      // Calculate remaining orders based on what we just paid
      const paidCommittedIds = new Set(ordersToPay.filter(o => !o.id.startsWith('draft-')).map(o => o.id));
      const remainingCount = committedOrders.filter(o => !paidCommittedIds.has(o.id)).length;
      
      // If no more orders left, close the modal
      if (remainingCount === 0) {
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate totals
  const draftSubtotal = currentOrder.reduce((sum, item) => sum + (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity, 0);
  
  // Calculate total of SELECTED orders for display
  const selectedOrdersTotal = committedOrders
    .filter(o => selectedOrdersToPay.includes(o.id) || (selectedOrdersToPay.length === 0 && o.status !== 'paid'))
    .reduce((sum, o) => sum + o.total, 0);

  const displaySubtotal = selectedOrdersToPay.length > 0 ? selectedOrdersTotal : (selectedOrdersTotal + draftSubtotal);
  
  // Recalculate final total based on discount/vat for the PAYMENT view
  // Note: committed orders already have total calculated. 
  // If we are paying multiple orders, we sum their totals.
  // Discount is applied to the *session* usually. 
  // If we apply discount now, it applies to the *sum* of selected orders.
  
  const finalSubtotal = displaySubtotal; // Simplified for now
  const discountAmount = (finalSubtotal * discount) / 100;
  const vatAmount = ((finalSubtotal - discountAmount) * vat) / 100;
  const finalTotal = finalSubtotal - discountAmount + vatAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1a1b1e] w-full max-w-7xl h-full md:h-[90vh] md:rounded-3xl overflow-hidden flex flex-col lg:flex-row border border-white/10 shadow-2xl"
      >
        {/* Main Header (Common for both mobile views) */}
        <div className="lg:hidden p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1b1e]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{activeTable.name}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-bold">
              {activeTable.status === 'empty' ? 'Bàn trống' : 'Đang dùng'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex border-b border-white/10 bg-[#151619]">
          <button 
            onClick={() => setViewMode('menu')}
            className={cn(
              "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all",
              viewMode === 'menu' ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5" : "text-gray-500"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Thực đơn
          </button>
          <button 
            onClick={() => setViewMode('order')}
            className={cn(
              "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all relative",
              viewMode === 'order' ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5" : "text-gray-500"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Đơn hàng
            {(currentOrder.length > 0 || committedOrders.length > 0) && (
              <span className="absolute top-3 right-4 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {currentOrder.length + committedOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Left: Menu Selection */}
        <div className={cn(
          "flex-1 flex-col border-r border-white/10 lg:flex min-h-0",
          viewMode === 'menu' ? "flex" : "hidden"
        )}>
          {/* Header (Desktop only) */}
          <div className="hidden lg:block p-6 border-b border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {activeTable.name}
                <span className="text-sm font-normal text-gray-500">Thêm món</span>
              </h2>
              <div className="flex items-center gap-2">
                 {/* Merge Button */}
                 <button 
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500 text-blue-500 hover:bg-blue-500/20 transition-all"
                >
                  <Users className="w-3 h-3" />
                  Gộp bàn
                </button>

                <button 
                  onClick={() => setIsPrintKitchenEnabled(!isPrintKitchenEnabled)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                    isPrintKitchenEnabled 
                      ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                      : "bg-white/5 border-white/10 text-gray-500"
                  )}
                >
                  <Printer className="w-3 h-3" />
                  {isPrintKitchenEnabled ? 'In bếp: BẬT' : 'In bếp: TẮT'}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Categories (Mobile & Desktop) */}
          <div className="p-4 lg:p-6 border-b border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Tìm món ăn..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all cursor-pointer",
                      activeCategory === cat ? "bg-emerald-500 text-black font-bold" : "bg-white/5 text-gray-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu List/Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-32 lg:pb-6 relative min-h-0 touch-pan-y">
            {isCashier ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                <Lock className="w-16 h-16 opacity-20" />
                <p className="text-center">Nhân viên thu ngân không có quyền chỉnh sửa đơn hàng.<br/>Vui lòng chỉ thực hiện thanh toán.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 text-left hover:border-emerald-500/30 transition-all cursor-pointer flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 h-auto md:h-full"
                  >
                    <div className="w-20 h-20 md:w-full md:h-auto md:aspect-video bg-gray-800 rounded-xl md:mb-3 overflow-hidden shrink-0">
                      <img 
                        src={item.image || `https://picsum.photos/seed/${item.id}/300/200`} 
                        alt={item.name}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 md:mt-auto">
                      <p className="font-bold text-white mb-1 text-sm md:text-base line-clamp-2">{item.name}</p>
                      <p className="text-emerald-500 font-mono font-bold text-sm">{item.price.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}đ</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mobile Floating Action Button */}
            {!isCashier && (
              <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%]">
                {currentOrder.length > 0 ? (
                  <button 
                    onClick={() => setViewMode('order')}
                    className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-3 animate-bounce-subtle"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Xem đơn & Báo bếp ({currentOrder.length})
                    <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                      {draftSubtotal.toLocaleString()}đ
                    </span>
                  </button>
                ) : committedOrders.length > 0 ? (
                  <button 
                    onClick={() => setViewMode('order')}
                    className="w-full bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-md flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                    Xem đơn & Thanh toán
                    <span className="bg-emerald-500 text-black px-2 py-0.5 rounded-lg text-xs">
                      {committedOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}đ
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary & Payment */}
        <div className={cn(
          "w-full lg:w-[450px] bg-[#151619] flex-col lg:flex min-h-0",
          viewMode === 'order' ? "flex h-full" : "hidden"
        )}>
          <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1b1e] lg:bg-transparent">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Chi tiết đơn hàng
            </h3>
            <div className="flex items-center gap-3">
              {!isCashier && currentOrder.length > 0 && (
                <button className="text-xs text-rose-500 hover:underline cursor-pointer" onClick={() => setCurrentOrder([])}>Xóa đơn mới</button>
              )}
              <button 
                onClick={() => setIsPrintKitchenEnabled(!isPrintKitchenEnabled)}
                className={cn(
                  "lg:hidden flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                  isPrintKitchenEnabled 
                    ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                    : "bg-white/5 border-white/10 text-gray-500"
                )}
              >
                <Printer className="w-3 h-3" />
                {isPrintKitchenEnabled ? 'Bật' : 'Tắt'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Committed Orders List (Restored per-order view) */}
            <div className="space-y-3">
              {committedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm italic border border-dashed border-white/10 rounded-xl">Chưa có đơn nào được báo bếp</div>
              ) : (
                committedOrders.map((order, orderIndex) => {
                  const isSelected = selectedOrdersToPay.includes(order.id);
                  const isSelectionMode = selectedOrdersToPay.length > 0;
                  
                  return (
                    <div 
                      key={order.id} 
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all",
                        isSelected ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-white/10",
                        isSelectionMode && !isSelected ? "opacity-50" : "opacity-100"
                      )}
                    >
                      {/* Order Header */}
                      <div 
                        onClick={() => {
                          setSelectedOrdersToPay(prev => 
                            prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                          );
                        }}
                        className={cn(
                          "p-3 flex justify-between items-center cursor-pointer transition-colors",
                          isSelected ? "bg-emerald-500/20" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border text-[10px]",
                            isSelected ? "bg-emerald-500 border-emerald-500 text-black" : "border-gray-500 text-transparent"
                          )}>
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-sm text-white">Đơn #{orderIndex + 1}</span>
                          <span className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded-full">
                            {format(new Date(order.startTime), 'HH:mm')}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{order.total.toLocaleString()}đ</span>
                      </div>
                      
                      {/* Order Items */}
                      <div className="p-3 space-y-3 bg-black/20">
                        {order.items.map((item, itemIndex) => {
                          const groupedAddOns: { name: string, quantity: number }[] = [];
                          item.selectedAddOns?.forEach(a => {
                            const existing = groupedAddOns.find(ga => ga.name === a.name);
                            if (existing) existing.quantity++;
                            else groupedAddOns.push({ name: a.name, quantity: 1 });
                          });

                          return (
                            <div key={`${order.id}-${itemIndex}`} className="space-y-1 pb-2 border-b border-white/5 last:border-0">
                              <div className="flex justify-between items-start text-sm">
                                <div className="flex-1">
                                  <div className="text-white font-medium flex items-center gap-2">
                                    {item.name}
                                    <span className="text-emerald-500 font-bold">x{item.quantity}</span>
                                  </div>
                                  {groupedAddOns.length > 0 && (
                                    <div className="text-[11px] text-emerald-500/90 font-medium mt-0.5">
                                      + {groupedAddOns.map(ga => `${ga.name}${ga.quantity > 1 ? ` x${ga.quantity}` : ''}`).join(', ')}
                                    </div>
                                  )}
                                  {item.note && <div className="text-[10px] text-gray-500 italic mt-0.5">"{item.note}"</div>}
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                  <div className="text-white font-mono">{(item.quantity * (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0))).toLocaleString()}đ</div>
                                  {!isCashier && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCommittedItem(item, order.id, itemIndex);
                                      }}
                                      className="text-blue-500 hover:text-blue-400 p-1 bg-blue-500/10 rounded"
                                    >
                                      <Settings className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Current Draft Order */}
            {currentOrder.length > 0 && (
              <div className="border border-dashed border-emerald-500/50 bg-emerald-500/5 rounded-xl p-3 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                  <span className="font-bold text-emerald-500 text-sm">Đơn mới (Chưa báo bếp)</span>
                  <span className="font-mono font-bold text-emerald-500">{draftSubtotal.toLocaleString()}đ</span>
                </div>
                {currentOrder.map((item, idx) => {
                  // Group add-ons for display (Task 2)
                  const groupedAddOns: { name: string, quantity: number }[] = [];
                  item.selectedAddOns?.forEach(a => {
                    const existing = groupedAddOns.find(ga => ga.name === a.name);
                    if (existing) existing.quantity++;
                    else groupedAddOns.push({ name: a.name, quantity: 1 });
                  });

                  return (
                    <div key={`${item.id}-${idx}`} className="space-y-1">
                      <div className="flex justify-between items-start text-sm">
                        <div className="text-white">
                          <span className="font-medium">{item.name}</span>
                          {groupedAddOns.length > 0 && (
                            <div className="text-[10px] text-emerald-500">
                              + {groupedAddOns.map(ga => `${ga.name}${ga.quantity > 1 ? ` x${ga.quantity}` : ''}`).join(', ')}
                            </div>
                          )}
                          {item.note && <div className="text-[10px] text-gray-400 italic">"{item.note}"</div>}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="font-bold">x{item.quantity}</span>
                           <button 
                              onClick={() => handleEditDraftItem(item, idx)} 
                              className="text-blue-500 hover:text-blue-400 p-1"
                           >
                              <Settings className="w-3 h-3" />
                           </button>
                           <button onClick={() => {
                              setCurrentOrder(prev => prev.filter((_, i) => i !== idx));
                           }} className="text-rose-500 hover:text-rose-400 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-white/5 border-t border-white/10 space-y-4">
            <div className="space-y-2 text-sm">
               {/* ... (Totals - Updated to reflect selection) ... */}
               <div className="flex justify-between items-center text-gray-400">
                <span>Tạm tính ({selectedOrdersToPay.length > 0 ? `${selectedOrdersToPay.length} đơn` : 'Tất cả'})</span>
                <span className="font-mono">{finalSubtotal.toLocaleString()}đ</span>
              </div>
              {/* ... Discount/VAT inputs ... */}
               <div className="flex justify-between items-center text-gray-400">
                <div className="flex items-center gap-2">
                  <span>Giảm giá (%)</span>
                  <input 
                    type="number" 
                    className="w-12 bg-black/40 border border-white/10 rounded px-1 text-center text-xs"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <span className="font-mono text-rose-400">-{discountAmount.toLocaleString()}đ</span>
              </div>
               <div className="flex justify-between items-center text-gray-400">
                <span>VAT ({vat}%)</span>
                <span className="font-mono">{vatAmount.toLocaleString()}đ</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-white text-2xl font-bold">
                <span>Tổng cộng</span>
                <span className="text-emerald-500 font-mono">{finalTotal.toLocaleString()}đ</span>
              </div>
            </div>

            {activeTable.status === 'occupied' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Phương thức thanh toán</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Tiền mặt' },
                    { id: 'transfer', label: 'Chuyển khoản' },
                    { id: 'qr', label: 'QR Code' }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                        paymentMethod === method.id ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      )}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
               {/* Buttons */}
                {currentOrder.length > 0 && (
                  <button 
                    onClick={handleCallDish}
                    disabled={isProcessing}
                    className={cn(
                      "col-span-2 py-4 rounded-2xl bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 cursor-pointer flex items-center justify-center gap-2 text-base",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-6 h-6" />
                        {activeTable.status === 'empty' ? 'MỞ BÀN & GỬI BẾP' : 'GỬI BẾP (BÁO CHẾ BIẾN)'}
                      </>
                    )}
                  </button>
               )}
               
               {activeTable.status === 'occupied' && (
                 <>
                    <button 
                      onClick={() => handlePayment(true)}
                      disabled={isProcessing}
                      className={cn(
                        "py-4 rounded-2xl border border-blue-500/30 text-blue-500 font-bold hover:bg-blue-500/10 cursor-pointer flex flex-col items-center justify-center gap-1",
                        isProcessing && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      ) : (
                        <span className="text-sm">THANH TOÁN & IN</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handlePayment(false)}
                      disabled={isProcessing}
                      className={cn(
                        "py-4 rounded-2xl bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 cursor-pointer flex items-center justify-center gap-2 text-base",
                        isProcessing && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        'THANH TOÁN'
                      )}
                    </button>
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Item Configuration Modal (New) */}
        <AnimatePresence>
          {configuringItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">{configuringItem.name}</h3>
                  <button onClick={() => setConfiguringItem(null)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>

                {/* Main Quantity */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <span className="text-gray-400">Số lượng món chính</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><Minus className="w-4 h-4" /></button>
                    <span className="text-xl font-bold font-mono w-8 text-center">{itemQuantity}</span>
                    <button onClick={() => setItemQuantity(itemQuantity + 1)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Add-ons */}
                {configuringItem.addOns && configuringItem.addOns.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-400 uppercase">Món ăn kèm</p>
                    {configuringItem.addOns.map(addon => {
                      const count = selectedAddOns.filter(a => a.id === addon.id).length;
                      return (
                        <div key={addon.id} className="flex justify-between items-center p-3 rounded-xl border border-white/10 bg-white/5">
                          <div>
                            <p className="font-medium text-white">{addon.name}</p>
                            <p className="text-xs text-emerald-500">+{addon.price.toLocaleString()}đ</p>
                          </div>
                          <div className="flex items-center gap-3">
                             {count > 0 && (
                               <button onClick={() => {
                                 const idx = selectedAddOns.findIndex(a => a.id === addon.id);
                                 if (idx > -1) {
                                   const newAddOns = [...selectedAddOns];
                                   newAddOns.splice(idx, 1);
                                   setSelectedAddOns(newAddOns);
                                 }
                               }} className="p-1 bg-white/10 rounded hover:bg-white/20"><Minus className="w-3 h-3" /></button>
                             )}
                             <span className={cn("text-sm font-bold w-4 text-center", count > 0 ? "text-white" : "text-gray-600")}>{count}</span>
                             <button onClick={() => setSelectedAddOns([...selectedAddOns, addon])} className="p-1 bg-white/10 rounded hover:bg-white/20"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Note */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-400 uppercase">Ghi chú</p>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    rows={3}
                    placeholder="VD: Không hành, ít cay..."
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setConfiguringItem(null)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleConfirmAddItem}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
                  >
                    Thêm vào đơn
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Merge Table Modal */}
        {showMergeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white">Gộp bàn</h3>
              <p className="text-sm text-gray-400">Chọn các bàn muốn gộp vào bàn <span className="font-bold text-white">{activeTable.name}</span>:</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {tables.filter(t => t.id !== activeTable.id && t.status === 'occupied').map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTablesToMerge(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                    }}
                    className={cn(
                      "w-full flex justify-between items-center p-3 rounded-xl border transition-all",
                      tablesToMerge.includes(t.id) 
                        ? "bg-blue-500/20 border-blue-500 text-blue-500" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <span>{t.name}</span>
                    {tablesToMerge.includes(t.id) && <Check className="w-4 h-4" />}
                  </button>
                ))}
                {tables.filter(t => t.id !== activeTable.id && t.status === 'occupied').length === 0 && (
                  <p className="text-center text-gray-500 italic py-4">Không có bàn nào đang hoạt động để gộp.</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowMergeModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    onMergeTables(activeTable.id, tablesToMerge);
                    setShowMergeModal(false);
                  }}
                  disabled={tablesToMerge.length === 0}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận gộp
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ReportsView = ({ invoices }: { invoices: Invoice[] }) => {
  const today = new Date();
  const todayInvoices = invoices.filter(inv => isSameDay(parseISO(inv.date), today));
  
  const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayOrders = todayInvoices.length;
  
  // Hourly data for today
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const hour = 8 + (i * 2);
    const label = `${hour.toString().padStart(2, '0')}:00`;
    const revenue = todayInvoices.reduce((sum, inv) => {
      const invHour = parseISO(inv.date).getHours();
      if (invHour >= hour && invHour < hour + 2) {
        return sum + inv.total;
      }
      return sum;
    }, 0);
    return { name: label, revenue };
  });

  // Top products from all time (or maybe just today? let's do all time for now)
  const productSales = invoices.reduce((acc: Record<string, { name: string, sales: number }>, inv) => {
    inv.items.forEach(item => {
      if (!acc[item.id]) acc[item.id] = { name: item.name, sales: 0 };
      acc[item.id].sales += item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map((p, i) => ({
      ...p,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
    }));

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Doanh thu hôm nay', value: `${todayRevenue.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}đ`, trend: '+100%', icon: BarChart3, color: 'text-emerald-500' },
          { label: 'Đơn hàng hôm nay', value: todayOrders.toString(), trend: '+100%', icon: UtensilsCrossed, color: 'text-blue-500' },
          { label: 'Tổng doanh thu', value: `${invoices.reduce((s, i) => s + i.total, 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}đ`, trend: '', icon: UserIcon, color: 'text-amber-500' },
          { label: 'Tổng đơn hàng', value: invoices.length.toString(), trend: '', icon: Clock, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-2">
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend && (
                <span className={cn("text-xs font-bold", stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500')}>
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">Biểu đồ doanh thu hôm nay (theo giờ)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(v: number) => [v.toLocaleString() + 'đ', 'Doanh thu']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">Top 5 món bán chạy nhất</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  formatter={(v: number) => [v.toLocaleString(), 'Số lượng']}
                />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={24}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KitchenView = ({ tables }: { tables: Table[] }) => {
  const activeOrders = tables.filter(t => t.status === 'occupied' && t.currentOrder && t.currentOrder.length > 0);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-full">
      {activeOrders.map(table => (
        <div key={table.id} className="bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 bg-emerald-500/10 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold text-emerald-400">{table.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              12m ago
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {table.orders?.filter(o => o.status === 'pending').map((order, orderIdx) => (
              <div key={order.id} className="space-y-2 border-b border-white/5 pb-3 last:border-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Đơn #{orderIdx + 1} - {format(parseISO(order.startTime), 'HH:mm')}</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <span className="bg-white/10 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="text-sm text-gray-200 font-bold">{item.name}</p>
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <div className="text-[10px] text-emerald-500">
                            {item.selectedAddOns.map(a => `+ ${a.name}`).join(', ')}
                          </div>
                        )}
                        {item.note && (
                          <p className="text-[10px] text-amber-400 italic mt-1">"{item.note}"</p>
                        )}
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-emerald-500 cursor-pointer">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <button className="w-full py-2 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl text-sm font-bold transition-all cursor-pointer">
              Hoàn thành tất cả
            </button>
          </div>
        </div>
      ))}
      {activeOrders.length === 0 && (
        <div className="col-span-full h-96 flex flex-col items-center justify-center text-gray-500 space-y-4">
          <ChefHat className="w-16 h-16 opacity-20" />
          <p className="text-xl font-medium">Hiện không có đơn hàng nào đang chờ</p>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('fnb_master_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<ViewType>('tables');
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [activeTableGroup, setActiveTableGroup] = useState<string>('all');
  const [activeTableStatus, setActiveTableStatus] = useState<'all' | 'empty' | 'occupied'>('all');
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryTransaction[]>([]);
  const [inventoryAudits, setInventoryAudits] = useState<InventoryAudit[]>([]);
  const [stockCardEntries, setStockCardEntries] = useState<StockCardEntry[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    storeName: 'FNB Master POS',
    address: '',
    phone: '',
    logo: '',
    adminUsername: 'admin',
    kitchenBellEnabled: true,
    vatPercent: 8,
    kitchenBillTemplate: 'Mẫu bill bếp mặc định',
    paymentBillTemplate: 'Mẫu bill thanh toán mặc định',
    inventoryCategories: ['Nguyên liệu', 'Đồ uống', 'Khác'],
    cashCategories: ['Bán hàng', 'Tiền điện', 'Tiền nước', 'Tiền mặt bằng', 'Nhập hàng', 'Lương nhân viên', 'Khác'],
    printers: [],
    silentPrinting: false,
    kitchenTemplate: {
      showTime: true,
      showStaffName: true,
      showStoreAddress: false,
      showStorePhone: false,
      showLogo: false,
      showNote: true,
      fontSize: 'medium'
    },
    paymentTemplate: {
      showTime: true,
      showStaffName: true,
      showStoreAddress: true,
      showStorePhone: true,
      showLogo: true,
      showNote: true,
      fontSize: 'medium'
    }
  });
  const [printData, setPrintData] = useState<{
    type: 'bill' | 'kitchen';
    tableName: string;
    items: OrderItem[];
    total?: number;
    discount?: number;
    vat?: number;
    staffName: string;
  } | null>(null);

  const triggerPrint = async (data: {
    type: 'bill' | 'kitchen';
    tableName: string;
    items: OrderItem[];
    total?: number;
    subtotal?: number;
    discount?: number;
    vat?: number;
    staffName: string;
    date?: string;
    timeIn?: string;
    timeOut?: string;
    note?: string;
  }) => {
    // 1. Find suitable printer
    const printers = systemSettings.printers || [];
    const printer = printers.find(p => p.isEnabled && p.isDefault && (p.type === data.type || p.type === 'both')) 
                 || printers.find(p => p.isEnabled && (p.type === data.type || p.type === 'both'));

    // 2. Get Template Settings
    const template = data.type === 'kitchen' 
      ? (systemSettings.kitchenTemplate || { showTime: true, showStaffName: true, showStoreAddress: false, showStorePhone: false, showLogo: false, showNote: true, fontSize: 'medium' })
      : (systemSettings.paymentTemplate || { showTime: true, showStaffName: true, showStoreAddress: true, showStorePhone: true, showLogo: true, showNote: true, fontSize: 'medium' });

    // 3. Generate Content
    const styles = `
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .store-name { font-size: 1.2em; font-weight: bold; }
        .title { font-size: 1.1em; font-weight: bold; margin: 10px 0; }
        .info { font-size: 0.9em; margin-bottom: 5px; }
        .items { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items th { text-align: left; border-bottom: 1px solid #000; }
        .items td { padding: 5px 0; }
        .total-section { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
        .text-small { font-size: 12px; }
        .text-medium { font-size: 14px; }
        .text-large { font-size: 16px; }
      </style>
    `;

    const fontSizeClass = `text-${template.fontSize}`;

    let content = `
      <html>
        <head>
          <title>In ${data.type === 'kitchen' ? 'Bếp' : 'Hóa đơn'}</title>
          ${styles}
        </head>
        <body class="${fontSizeClass}">
          <div class="header">
            ${template.showLogo && systemSettings.logo ? `<img src="${systemSettings.logo}" style="max-width: 50px; margin-bottom: 5px;" />` : ''}
            <div class="store-name">${systemSettings.storeName}</div>
            ${template.showStoreAddress && systemSettings.address ? `<div>${systemSettings.address}</div>` : ''}
            ${template.showStorePhone && systemSettings.phone ? `<div>${systemSettings.phone}</div>` : ''}
            <div class="title">${data.type === 'kitchen' ? 'PHIẾU BẾP' : 'HÓA ĐƠN THANH TOÁN'}</div>
          </div>

          <div class="info">
            <div>Bàn: <strong>${data.tableName}</strong></div>
            ${template.showTime && data.timeIn ? `<div>Giờ vào: ${new Date(data.timeIn).toLocaleString('vi-VN')}</div>` : ''}
            ${template.showTime && data.timeOut ? `<div>Giờ ra: ${new Date(data.timeOut).toLocaleString('vi-VN')}</div>` : ''}
            ${template.showTime && !data.timeIn && !data.timeOut ? `<div>Thời gian: ${data.date || new Date().toLocaleString('vi-VN')}</div>` : ''}
            ${template.showStaffName ? `<div>Nhân viên: ${data.staffName}</div>` : ''}
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width: 40%">Món</th>
                <th style="width: 20%; text-align: center">SL</th>
                ${data.type === 'bill' ? '<th style="width: 40%; text-align: right">Thành tiền</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: bold;">${item.name}</div>
                    ${item.selectedAddOns && item.selectedAddOns.length > 0 ? `
                      <div style="font-size: 0.8em; padding-left: 10px;">
                        ${Object.entries(item.selectedAddOns.reduce((acc, a) => {
                          acc[a.name] = (acc[a.name] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)).map(([name, count]) => `+ ${name} ${count > 1 ? `(x${count})` : ''}`).join('<br/>')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; vertical-align: top; font-weight: bold; font-size: 1.2em;">${item.quantity}</td>
                  ${data.type === 'bill' ? `<td style="text-align: right; vertical-align: top;">${((item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity).toLocaleString()}</td>` : ''}
                </tr>
                ${item.note && template.showNote ? `<tr><td colspan="3" style="font-style: italic; font-size: 0.9em; padding-left: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Ghi chú: ${item.note}</td></tr>` : ''}
              `).join('')}
            </tbody>
          </table>
    `;

    if (data.type === 'bill' && data.total !== undefined) {
      content += `
          <div class="total-section">
            ${data.note ? `<div style="font-style: italic; font-size: 0.9em; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">Ghi chú: ${data.note}</div>` : ''}
            <div class="row">
              <span>Tạm tính:</span>
              <span>${(data.subtotal !== undefined ? data.subtotal : data.items.reduce((acc, item) => acc + (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity, 0)).toLocaleString()}</span>
            </div>
            ${data.discount ? `
            <div class="row">
              <span>Giảm giá:</span>
              <span>-${data.discount.toLocaleString()}</span>
            </div>` : ''}
            ${data.vat ? `
            <div class="row">
              <span>VAT (${systemSettings.vatPercent}%):</span>
              <span>${data.vat.toLocaleString()}</span>
            </div>` : ''}
            <div class="row" style="font-weight: bold; font-size: 1.2em; margin-top: 5px;">
              <span>Tổng cộng:</span>
              <span>${data.total.toLocaleString()}</span>
            </div>
          </div>
      `;
    }

    content += `
          <div class="footer">
            <div>Cảm ơn quý khách!</div>
            <div>Hẹn gặp lại</div>
          </div>
        </body>
      </html>
    `;

    // 4. Handle Silent Printing via Print Agent (LAN)
    if (systemSettings.silentPrinting && printer) {
      try {
        const printData = {
          type: data.type,
          storeName: systemSettings.storeName,
          address: systemSettings.address,
          phone: systemSettings.phone,
          tableName: data.tableName,
          staffName: data.staffName,
          items: data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price + (item.selectedAddOns?.reduce((s: number, a: any) => s + a.price, 0) || 0),
            note: item.note,
          })),
          total: data.total,
          subtotal: data.subtotal,
          discount: data.discount,
          vat: data.vat,
        };
        const success = await PrinterService.printDirect(printer, printData);
        if (success) return;
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Lỗi máy in không xác định');
        return;
      }
    } else if (systemSettings.silentPrinting && !printer) {
      alert(`Không tìm thấy máy in cho ${data.type === 'kitchen' ? 'bếp' : 'hóa đơn'}! Kiểm tra cài đặt máy in.`);
      return;
    }

    // 5. Fallback to Browser Print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để in!');
      return;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after images load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [allActiveShifts, setAllActiveShifts] = useState<Shift[]>([]);

  // Firebase Sync
  useEffect(() => {
    if (!currentUser) return;

    const storeId = currentUser.storeId;

    // Sync Users
    const usersQuery = query(collection(db, 'users'), where('storeId', '==', storeId));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(usersData);
    });

    // Sync Menu
    const menuQuery = query(collection(db, 'menu'), where('storeId', '==', storeId));
    const unsubMenu = onSnapshot(menuQuery, (snapshot) => {
      if (snapshot.empty) {
        // Initialize menu if empty for new store
        INITIAL_MENU.forEach(async (item) => {
          await addDoc(collection(db, 'menu'), { ...item, storeId });
        });
      } else {
        const menuData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
        setMenu(menuData);
      }
    });

    // Sync Tables
    const tablesQuery = query(collection(db, 'tables'), where('storeId', '==', storeId));
    const unsubTables = onSnapshot(tablesQuery, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_TABLES.forEach(async (table) => {
          await addDoc(collection(db, 'tables'), { ...table, storeId });
        });
      } else {
        const tablesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Table));
        // Sort by the numeric part of the name to maintain order
        const sortedTables = tablesData.sort((a, b) => {
          const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        setTables(sortedTables);
      }
    });

    // Sync Shifts
    const shiftsQuery = query(collection(db, 'shifts'), where('storeId', '==', storeId));
    const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
      const shiftsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Shift));
      setShifts(shiftsData.filter(s => s.status === 'closed').sort((a, b) => b.startTime.localeCompare(a.startTime)));
      
      const openShifts = shiftsData.filter(s => s.status === 'open');
      setAllActiveShifts(openShifts);
      
      const myOpenShift = openShifts.find(s => s.staffId === currentUser?.id);
      setActiveShift(myOpenShift || null);
    });

    // Sync Invoices
    const invoicesQuery = query(collection(db, 'invoices'), where('storeId', '==', storeId));
    const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invoice));
      setInvoices(invoicesData);
    });

    // Sync Inventory Logs
    const logsQuery = query(collection(db, 'inventory_logs'), where('storeId', '==', storeId));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryTransaction));
      setInventoryLogs(logsData);
    });

    // Sync Inventory Audits
    const auditsQuery = query(collection(db, 'inventory_audits'), where('storeId', '==', storeId));
    const unsubAudits = onSnapshot(auditsQuery, (snapshot) => {
      const auditsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryAudit));
      setInventoryAudits(auditsData.sort((a, b) => b.date.localeCompare(a.date)));

      // Cleanup audits older than 45 days
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
      
      auditsData.forEach(async (audit) => {
        if (new Date(audit.date) < fortyFiveDaysAgo) {
          await deleteDoc(doc(db, 'inventory_audits', audit.id));
        }
      });
    });

    // Sync Stock Card
    const stockCardQuery = query(collection(db, 'stock_card'), where('storeId', '==', storeId));
    const unsubStockCard = onSnapshot(stockCardQuery, (snapshot) => {
      const stockCardData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StockCardEntry));
      setStockCardEntries(stockCardData.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // Sync Table Groups
    const groupsQuery = query(collection(db, 'table_groups'), where('storeId', '==', storeId));
    const unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TableGroup));
      setTableGroups(groupsData);
    });

    // Sync Cash Transactions
    const cashQuery = query(collection(db, 'cash_transactions'), where('storeId', '==', storeId));
    const unsubCash = onSnapshot(cashQuery, (snapshot) => {
      const cashData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CashTransaction));
      setCashTransactions(cashData.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // Sync Settings
    const settingsQuery = query(collection(db, 'settings'), where('storeId', '==', storeId));
    const unsubSettings = onSnapshot(settingsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const settingsData = snapshot.docs[0].data() as SystemSettings;
        setSystemSettings(prev => ({ ...prev, ...settingsData }));
      }
    });

    return () => {
      unsubUsers();
      unsubMenu();
      unsubTables();
      unsubShifts();
      unsubInvoices();
      unsubLogs();
      unsubAudits();
      unsubStockCard();
      unsubGroups();
      unsubCash();
      unsubSettings();
    };
  }, [currentUser]);

  // Authentication
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('fnb_master_user', JSON.stringify(user));
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fnb_master_user');
    setView('tables');
  };

  // Table Management
  const handleAddTable = async (name: string, groupId?: string) => {
    if (!currentUser) return false;
    
    // Check for duplicate name
    const isDuplicate = tables.some(t => t.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      alert(`Tên bàn "${name}" đã tồn tại. Vui lòng chọn tên khác.`);
      return false;
    }

    await addDoc(collection(db, 'tables'), {
      name,
      status: 'empty',
      currentOrder: [],
      storeId: currentUser.storeId,
      groupId: groupId || null
    });
    return true;
  };

  const handleUpdateTable = async (id: string, updates: Partial<Table>) => {
    // Check for duplicate name if name is being updated
    if (updates.name) {
      const isDuplicate = tables.some(t => t.id !== id && t.name.toLowerCase() === updates.name!.toLowerCase());
      if (isDuplicate) {
        alert(`Tên bàn "${updates.name}" đã tồn tại. Vui lòng chọn tên khác.`);
        return false;
      }
    }
    await updateDoc(doc(db, 'tables', id), updates);
    return true;
  };

  const handleDeleteTable = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      await deleteDoc(doc(db, 'tables', id));
    }
  };

  const handleAddTableGroup = async (name: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'table_groups'), {
      name,
      storeId: currentUser.storeId
    });
  };

  const handleDeleteTableGroup = async (id: string) => {
    if (window.confirm('Xóa nhóm bàn sẽ không xóa các bàn trong nhóm. Bạn có chắc chắn?')) {
      await deleteDoc(doc(db, 'table_groups', id));
    }
  };

  // Menu Management
  const handleAddItem = async (item: MenuItem) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'menu'), { 
      ...item, 
      storeId: currentUser.storeId,
      isInventory: item.isInventory || false 
    });
  };

  const handleDeleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id));
  };

  const handleUpdateItem = async (item: MenuItem) => {
    if (!item.id) return;
    await updateDoc(doc(db, 'menu', item.id), { ...item });
  };

  const handleDeleteCategory = (cat: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${cat}"? Việc này có thể ảnh hưởng đến việc hiển thị các món trong nhóm này.`)) {
      setCategories(prev => prev.filter(c => c !== cat));
    }
  };

  const handleAddCategory = (cat: string) => setCategories([...categories, cat]);

  // Inventory Management
  const handleImportStock = async (itemId: string, quantity: number, unitPrice: number) => {
    const item = menu.find(i => i.id === itemId);
    if (!item || !currentUser) return;

    const newStock = item.stock + quantity;
    const newCostPrice = unitPrice > 0 ? unitPrice : item.costPrice;

    const itemRef = doc(db, 'menu', itemId);
    await updateDoc(itemRef, { 
      stock: newStock,
      costPrice: newCostPrice
    });

    // Log transaction
    const log: InventoryTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId,
      itemName: item.name,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      type: 'import',
      date: new Date().toISOString()
    };
    const logRef = await addDoc(collection(db, 'inventory_logs'), { ...log, storeId: currentUser.storeId });

    // Record Stock Card
    const cardEntry: StockCardEntry = {
      id: Math.random().toString(36).substr(2, 9),
      itemId,
      itemName: item.name,
      date: log.date,
      type: 'import',
      referenceId: logRef.id,
      change: quantity,
      remaining: newStock,
      note: `Nhập kho: ${quantity} ${item.unit}`
    };
    await addDoc(collection(db, 'stock_card'), { ...cardEntry, storeId: currentUser.storeId });
  };

  const handleAuditInventory = async (audit: InventoryAudit) => {
    if (!currentUser) return;
    
    const auditRef = await addDoc(collection(db, 'inventory_audits'), { ...audit, storeId: currentUser.storeId });
    
    for (const auditItem of audit.items) {
      const item = menu.find(i => i.id === auditItem.itemId);
      if (item) {
        await updateDoc(doc(db, 'menu', item.id), { stock: auditItem.actualStock });
        
        // Record Stock Card
        const cardEntry: StockCardEntry = {
          id: Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemName: item.name,
          date: audit.date,
          type: 'audit',
          referenceId: auditRef.id,
          change: auditItem.discrepancy,
          remaining: auditItem.actualStock,
          note: `Kiểm kho: Chênh lệch ${auditItem.discrepancy} ${item.unit}`
        };
        await addDoc(collection(db, 'stock_card'), { ...cardEntry, storeId: currentUser.storeId });
      }
    }
  };

  const handleUpdateInventoryItem = async (item: MenuItem) => {
    const itemRef = doc(db, 'menu', item.id);
    await updateDoc(itemRef, { ...item });
  };

  const handleDeleteInventoryItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id));
  };

  const handleUpdateOrder = async (tableId: string, order: OrderItem[]) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !currentUser) return;

    // Create new OrderSession
    const subtotal = order.reduce((sum, item) => sum + (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity, 0);
    const vatAmount = Math.round(subtotal * (systemSettings.vatPercent || 0) / 100);
    const total = subtotal + vatAmount; // Discount is usually applied at checkout

    const newSession: OrderSession = {
      id: Math.random().toString(36).substr(2, 9),
      items: order,
      startTime: new Date().toISOString(),
      subtotal,
      discount: 0,
      vat: systemSettings.vatPercent || 0,
      total,
      status: 'pending',
      staffId: currentUser.id
    };

    const updatedOrders = [...(table.orders || []), newSession];

    await updateDoc(doc(db, 'tables', tableId), {
      status: 'occupied',
      orders: updatedOrders,
      currentOrder: [] // Clear draft
    });
  };

  const handleAddCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'storeId'>) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'cash_transactions'), {
      ...transaction,
      storeId: currentUser.storeId
    });
  };

  const handleResetAllTables = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin bàn và đưa tất cả về trạng thái trống?')) return;
    
    const batch = tables.map(t => updateDoc(doc(db, 'tables', t.id), {
      status: 'empty',
      orders: [],
      currentOrder: [],
      discount: 0,
      note: deleteField(),
      customerId: deleteField(),
      startTime: deleteField(),
      lastCommittedTotal: deleteField()
    }));
    
    await Promise.all(batch);
    alert('Đã đặt lại toàn bộ bàn thành công.');
  };

  const handleMergeTables = async (targetTableId: string, sourceTableIds: string[]) => {
    const targetTable = tables.find(t => t.id === targetTableId);
    if (!targetTable) return;

    let newOrders = [...(targetTable.orders || [])];
    const sourceNames: string[] = [];

    for (const sourceId of sourceTableIds) {
      const sourceTable = tables.find(t => t.id === sourceId);
      if (sourceTable && sourceTable.orders) {
        // Add merge note to each order session from source
        const mergedOrders = sourceTable.orders.map(o => ({
          ...o,
          note: o.note ? `${o.note} (Gộp từ ${sourceTable.name})` : `Gộp từ ${sourceTable.name}`
        }));
        newOrders = [...newOrders, ...mergedOrders];
        sourceNames.push(sourceTable.name);

        // Clear source table
        await updateDoc(doc(db, 'tables', sourceId), {
          status: 'empty',
          orders: [],
          currentOrder: [],
          startTime: deleteField()
        });
      }
    }

    await updateDoc(doc(db, 'tables', targetTableId), {
      orders: newOrders,
      status: 'occupied',
      note: targetTable.note ? `${targetTable.note} (Gộp ${sourceNames.join(', ')})` : `Gộp ${sourceNames.join(', ')}`
    });
  };

  const handleCheckout = async (tableId: string, ordersToPay: OrderSession[], discount: number, paymentMethod: 'cash' | 'transfer' | 'qr', shouldPrint: boolean = false) => {
    if (!currentUser) return;
    
    // Fetch fresh table data to avoid race conditions
    const tableDoc = await getDoc(doc(db, 'tables', tableId));
    if (!tableDoc.exists()) return;
    const table = { id: tableDoc.id, ...tableDoc.data() } as Table;

    // Void Detection (Silent logging, no alert to avoid double-alerting with item_void)
    if (activeShift) {
      const voidItemDetails: VoidItemDetail[] = [];
      let totalValueDiff = 0;

      ordersToPay.forEach(paySession => {
        const dbSession = table.orders?.find(o => o.id === paySession.id);
        if (dbSession) {
           // Compare items
           const dbItems = new Map<string, OrderItem>(dbSession.items.map(i => [`${i.id}-${i.price}-${JSON.stringify([...(i.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||'')))}-${i.note||''}`, i]));
           
           paySession.items.forEach(payItem => {
             const key = `${payItem.id}-${payItem.price}-${JSON.stringify([...(payItem.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||'')))}-${payItem.note||''}`;
             const dbItem = dbItems.get(key);
             if (dbItem) {
               if (payItem.quantity < dbItem.quantity) {
                 const diff = dbItem.quantity - payItem.quantity;
                 const valueDiff = diff * (dbItem.price + (dbItem.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0));
                 totalValueDiff += valueDiff;
                 voidItemDetails.push({
                   itemName: dbItem.name + (dbItem.selectedAddOns?.length ? ` (+${dbItem.selectedAddOns.length} món kèm)` : ''),
                   oldQuantity: dbItem.quantity,
                   newQuantity: payItem.quantity,
                   valueDiff: valueDiff
                 });
               }
             }
           });
           // Also check for missing items (quantity 0)
           dbItems.forEach((dbItem, key) => {
             const payItem = paySession.items.find(i => `${i.id}-${i.price}-${JSON.stringify([...(i.selectedAddOns || [])].sort((a,b)=>(a.id||'').localeCompare(b.id||'')))}-${i.note||''}` === key);
             if (!payItem) {
                const valueDiff = dbItem.quantity * (dbItem.price + (dbItem.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0));
                totalValueDiff += valueDiff;
                voidItemDetails.push({
                   itemName: dbItem.name + (dbItem.selectedAddOns?.length ? ` (+${dbItem.selectedAddOns.length} món kèm)` : ''),
                   oldQuantity: dbItem.quantity,
                   newQuantity: 0,
                   valueDiff: valueDiff
                 });
             }
           });
        }
      });

      if (voidItemDetails.length > 0) {
        const voidLog: VoidLog = {
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toISOString(),
          staffName: currentUser.name,
          tableName: table.name,
          itemName: '⚠️ CHÊNH LỆCH KHI THANH TOÁN',
          oldQuantity: 0,
          newQuantity: 0,
          valueDiff: totalValueDiff,
          type: 'bill_void',
          details: voidItemDetails
        };

        const updatedLogs = [...(activeShift.voidLogs || []), voidLog];
        await updateDoc(doc(db, 'shifts', activeShift.id), {
          voidLogs: updatedLogs
        });
      }
    }

    // Calculate totals for the invoice based on SELECTED orders
    const subtotal = ordersToPay.reduce((sum, o) => sum + o.subtotal, 0);
    const discountAmount = (subtotal * discount) / 100;
    const vatAmount = ((subtotal - discountAmount) * (systemSettings.vatPercent || 0)) / 100;
    const total = subtotal - discountAmount + vatAmount;

    // Combine notes from all orders being paid
    const combinedNotes = ordersToPay.filter(o => o.note).map(o => o.note).join('; ');

    // Create Invoice
    const allItems = ordersToPay.flatMap(o => o.items);
    
    // Group items by ID, name, price, and add-ons (Task 1)
    const groupedItems: OrderItem[] = [];
    allItems.forEach(item => {
      const itemKey = `${item.id}-${item.price}-${JSON.stringify([...(item.selectedAddOns || [])].sort((a, b) => (a.id||'').localeCompare(b.id||'')))}-${item.note || ''}`;
      const existing = groupedItems.find(i => {
        const existingKey = `${i.id}-${i.price}-${JSON.stringify([...(i.selectedAddOns || [])].sort((a, b) => (a.id||'').localeCompare(b.id||'')))}-${i.note || ''}`;
        return existingKey === itemKey;
      });
      
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.push({ ...item });
      }
    });

    const minStartTime = ordersToPay.reduce((min, o) => {
      if (!min) return o.startTime;
      return new Date(o.startTime) < new Date(min) ? o.startTime : min;
    }, '');

    const invoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      timeIn: minStartTime || table.startTime || new Date().toISOString(),
      items: groupedItems,
      subtotal,
      discount: discountAmount,
      vat: vatAmount,
      total,
      paymentMethod,
      tableId: table.id,
      tableName: table.name,
      staffId: currentUser.id,
      staffName: currentUser.name,
      storeId: currentUser.storeId,
      note: combinedNotes || table.note || ""
    };

    const invoiceRef = await addDoc(collection(db, 'invoices'), { ...invoice, storeId: currentUser.storeId });

    // Print Invoice if requested
    if (shouldPrint) {
      triggerPrint({
        type: 'bill',
        tableName: table.name,
        items: invoice.items,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        vat: invoice.vat,
        total: invoice.total,
        staffName: currentUser.name,
        timeIn: invoice.timeIn,
        timeOut: invoice.date,
        note: invoice.note
      });
    }

    // Update Table: Remove paid sessions
    const paidIds = new Set(ordersToPay.map(p => p.id));
    const remainingOrders = (table.orders || []).filter(o => !paidIds.has(o.id));

    // Determine the new startTime for the table if it's still occupied
    let newStartTime = table.startTime;
    if (remainingOrders.length > 0 && !newStartTime) {
      // If table is still occupied but has no startTime, use the earliest order's startTime
      newStartTime = remainingOrders.reduce((earliest, o) => {
        if (!o.startTime) return earliest;
        if (!earliest) return o.startTime;
        try {
          return new Date(o.startTime) < new Date(earliest) ? o.startTime : earliest;
        } catch (e) {
          return earliest || o.startTime;
        }
      }, '');
    }

    await updateDoc(doc(db, 'tables', tableId), {
      orders: remainingOrders,
      status: remainingOrders.length === 0 ? 'empty' : 'occupied',
      currentOrder: [],
      discount: 0, // Reset discount
      startTime: remainingOrders.length === 0 ? deleteField() : (newStartTime || new Date().toISOString())
    });

    // Record Cash Transaction
    if (paymentMethod === 'cash') {
      await addDoc(collection(db, 'cash_transactions'), {
        id: Math.random().toString(36).substr(2, 9),
        amount: total,
        type: 'income',
        reason: `Thanh toán bàn ${table.name}`,
        date: new Date().toISOString(),
        staffId: currentUser.id,
        staffName: currentUser.name,
        storeId: currentUser.storeId
      });
    }

    // Update Inventory (Simplified)
    for (const item of invoice.items) {
      if (item.type === 'goods') {
        const menuItem = menu.find(m => m.id === item.id);
        if (menuItem) {
           const newStock = menuItem.stock - item.quantity;
           await updateDoc(doc(db, 'menu', item.id), { stock: newStock });
           
           // Record Stock Card
           const cardEntry: StockCardEntry = {
             id: Math.random().toString(36).substr(2, 9),
             itemId: menuItem.id,
             itemName: menuItem.name,
             date: invoice.date,
             type: 'export',
             referenceId: invoiceRef.id,
             change: -item.quantity,
             remaining: newStock,
             note: `Bán hàng: ${invoice.id}`
           };
           await addDoc(collection(db, 'stock_card'), { ...cardEntry, storeId: currentUser.storeId });
        }
      } else if (item.type === 'dish' && item.recipe) {
        for (const recipeItem of item.recipe) {
          const ingredient = menu.find(m => m.id === recipeItem.ingredientId);
          if (ingredient) {
            const deduction = recipeItem.quantity * item.quantity;
            const newStock = ingredient.stock - deduction;
            await updateDoc(doc(db, 'menu', ingredient.id), { stock: newStock });

            // Record Stock Card for ingredients
            const cardEntry: StockCardEntry = {
              id: Math.random().toString(36).substr(2, 9),
              itemId: ingredient.id,
              itemName: ingredient.name,
              date: invoice.completedAt || invoice.date,
              type: 'sale',
              referenceId: invoiceRef.id,
              change: -deduction,
              remaining: newStock,
              note: `Bán hàng: ${item.name} x${item.quantity}`
            };
            await addDoc(collection(db, 'stock_card'), { ...cardEntry, storeId: currentUser.storeId });
          }
        }
      }
    }

    if (activeShift) {
      const isCash = paymentMethod === 'cash';
      await updateDoc(doc(db, 'shifts', activeShift.id), { 
        totalRevenue: activeShift.totalRevenue + total,
        totalCash: (activeShift.totalCash || 0) + (isCash ? total : 0),
        totalTransfer: (activeShift.totalTransfer || 0) + (!isCash ? total : 0)
      });
    }

    setSelectedTable(null);
  };

  // Shift Management
  const handleOpenShift = async (startCash: number) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'shifts'), {
      startTime: new Date().toISOString(),
      startCash,
      totalRevenue: 0,
      totalCash: 0,
      totalTransfer: 0,
      staffId: currentUser.id,
      staffName: currentUser.name,
      status: 'open',
      storeId: currentUser.storeId
    });
  };

  const handleCloseShift = async (endCash: number) => {
    if (!activeShift) return;
    await updateDoc(doc(db, 'shifts', activeShift.id), {
      endTime: new Date().toISOString(),
      endCash,
      status: 'closed'
    });
  };

  // User Management
  const handleAddUser = async (user: User) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'users'), { ...user, storeId: currentUser.storeId });
  };

  const handleDeleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { password: newPassword });
      alert('Đổi mật khẩu thành công!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  const handleUpdateSettings = async (settings: SystemSettings) => {
    setSystemSettings(settings);
    if (!currentUser) return;

    // Update Store Name
    const storeRef = doc(db, 'stores', currentUser.storeId);
    await updateDoc(storeRef, { name: settings.storeName });

    // Update Admin Password if provided
    if (settings.adminPassword) {
      const adminQuery = query(collection(db, 'users'), where('username', '==', settings.adminUsername), where('storeId', '==', currentUser.storeId));
      const adminSnap = await getDocs(adminQuery);
      if (!adminSnap.empty) {
        const adminDoc = adminSnap.docs[0];
        await updateDoc(doc(db, 'users', adminDoc.id), { password: settings.adminPassword });
      }
    }

    // Update Settings Collection
    const settingsQuery = query(collection(db, 'settings'), where('storeId', '==', currentUser.storeId));
    const settingsSnap = await getDocs(settingsQuery);
    if (!settingsSnap.empty) {
      await updateDoc(doc(db, 'settings', settingsSnap.docs[0].id), { ...settings });
    } else {
      await addDoc(collection(db, 'settings'), { ...settings, storeId: currentUser.storeId });
    }
  };

  if (!currentUser) {
    if (isRegistering) {
      return <RegisterStoreView onBack={() => setIsRegistering(false)} onSuccess={() => setIsRegistering(false)} />;
    }
    return <LoginView onLogin={handleLogin} onRegisterClick={() => setIsRegistering(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-emerald-500/30">
      <Sidebar activeView={view} setView={setView} onLogout={handleLogout} currentUser={currentUser} />
      
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header view={view} currentUser={currentUser} />
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'tables' && (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={() => setActiveTableGroup('all')}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm transition-all cursor-pointer",
                            activeTableGroup === 'all' ? "bg-emerald-500 text-black font-bold" : "bg-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          Tất cả khu vực
                        </button>
                        {tableGroups.map(group => (
                          <div key={group.id} className="relative group/group">
                            <button 
                              onClick={() => setActiveTableGroup(group.id)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm transition-all cursor-pointer",
                                activeTableGroup === group.id ? "bg-emerald-500 text-black font-bold" : "bg-white/5 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              {group.name}
                            </button>
                            {currentUser?.role === 'admin' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTableGroup(group.id);
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/group:opacity-100 transition-opacity cursor-pointer"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            )}
                          </div>
                        ))}
                        {currentUser?.role === 'admin' && (
                          <button 
                            onClick={() => setShowAddGroupModal(true)}
                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-emerald-500 hover:bg-white/10 cursor-pointer"
                            title="Thêm nhóm bàn"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {currentUser?.role === 'admin' && (
                        <button 
                          onClick={() => {
                            setNewTableName(`Bàn ${tables.length + 1}`);
                            setSelectedGroupId(activeTableGroup !== 'all' ? activeTableGroup : '');
                            setShowAddTableModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Thêm bàn
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 items-center p-1 bg-black/20 rounded-2xl w-fit">
                      {[
                        { id: 'all', label: 'Tất cả bàn', count: tables.length },
                        { id: 'empty', label: 'Bàn trống', count: tables.filter(t => t.status === 'empty').length },
                        { id: 'occupied', label: 'Đang dùng', count: tables.filter(t => t.status === 'occupied').length }
                      ].map(status => (
                        <button
                          key={status.id}
                          onClick={() => setActiveTableStatus(status.id as any)}
                          className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                            activeTableStatus === status.id 
                              ? "bg-white/10 text-white shadow-lg" 
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          {status.label}
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px]",
                            activeTableStatus === status.id ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-500"
                          )}>
                            {status.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <TableGrid 
                    tables={tables.filter(t => 
                      (activeTableGroup === 'all' || t.groupId === activeTableGroup) &&
                      (activeTableStatus === 'all' || t.status === activeTableStatus)
                    )} 
                    onSelectTable={(table) => {
                      if (currentUser?.role === 'cashier' && table.status === 'empty') {
                        alert('Nhân viên thu ngân không có quyền mở bàn trống!');
                        return;
                      }
                      if ((currentUser?.role === 'order' || currentUser?.role === 'staff' || currentUser?.role === 'cashier') && !activeShift) {
                        alert('Vui lòng mở ca làm việc trước khi thực hiện order!');
                        return;
                      }
                      setSelectedTable(table);
                    }}
                    onDeleteTable={handleDeleteTable}
                    onEditTable={setEditingTable}
                  />
                </div>
              )}
              {view === 'reports' && <ReportsView invoices={invoices} />}
              {view === 'kitchen' && <KitchenView tables={tables} />}
              {view === 'inventory' && (
                <InventoryView 
                  menu={menu} 
                  onImportStock={handleImportStock}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateInventoryItem}
                  onDeleteItem={handleDeleteInventoryItem}
                  categories={systemSettings.inventoryCategories}
                  onUpdateCategories={(cats) => setSystemSettings({...systemSettings, inventoryCategories: cats})}
                  audits={inventoryAudits}
                  onAudit={handleAuditInventory}
                  stockCard={stockCardEntries}
                  currentUser={currentUser}
                />
              )}
              {view === 'summary' && (
                <SummaryView 
                  invoices={invoices}
                  inventoryLogs={inventoryLogs}
                  cashTransactions={cashTransactions}
                  onAddCashTransaction={handleAddCashTransaction}
                  currentUser={currentUser}
                  settings={systemSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onPrint={triggerPrint}
                />
              )}
              {view === 'settings' && (
                <SettingsView 
                  settings={systemSettings}
                  onUpdateSettings={handleUpdateSettings}
                  currentUser={currentUser}
                  onResetAllTables={handleResetAllTables}
                  onChangePassword={handleChangePassword}
                />
              )}
              {view === 'customers' && <CustomerView customers={[]} />}
              {view === 'shifts' && (
                <ShiftView 
                  activeShift={activeShift} 
                  allActiveShifts={allActiveShifts}
                  history={shifts} 
                  onOpenShift={handleOpenShift}
                  onCloseShift={handleCloseShift}
                  currentUser={currentUser}
                />
              )}
              {view === 'menu_mgmt' && (
                <MenuMgmtView 
                  menu={menu} 
                  onAddItem={handleAddItem} 
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
              {view === 'user_mgmt' && (
                <UserMgmtView 
                  users={users} 
                  onAddUser={handleAddUser} 
                  onDeleteUser={handleDeleteUser} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      {selectedTable && (
        <MenuOrdering 
          selectedTable={selectedTable} 
          tables={tables}
          onClose={() => setSelectedTable(null)}
          onUpdateOrder={handleUpdateOrder}
          onCheckout={handleCheckout}
          onMergeTables={handleMergeTables}
          menu={menu}
          categories={categories}
          vatPercent={systemSettings.vatPercent}
          onPrint={triggerPrint}
          staffName={currentUser.name}
          currentUser={currentUser}
          onUpdateTable={handleUpdateTable}
          onLogVoid={async (log) => {
            if (activeShift) {
              const updatedLogs = [...(activeShift.voidLogs || []), log];
              await updateDoc(doc(db, 'shifts', activeShift.id), {
                voidLogs: updatedLogs
              });
            }
          }}
          activeShift={activeShift}
        />
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Thêm bàn mới</h3>
              <button onClick={() => setShowAddTableModal(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên bàn</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Nhóm bàn</label>
                <select 
                  className="w-full bg-[#1a1b1e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">-- Không có nhóm --</option>
                  {tableGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowAddTableModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={async () => {
                  const success = await handleAddTable(newTableName, selectedGroupId);
                  if (success) setShowAddTableModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Chỉnh sửa bàn</h3>
              <button onClick={() => setEditingTable(null)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên bàn</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({...editingTable, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Nhóm bàn</label>
                <select 
                  className="w-full bg-[#1a1b1e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={editingTable.groupId || ''}
                  onChange={(e) => setEditingTable({...editingTable, groupId: e.target.value || undefined})}
                >
                  <option value="">-- Không có nhóm --</option>
                  {tableGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setEditingTable(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={async () => {
                  const success = await handleUpdateTable(editingTable.id, { name: editingTable.name, groupId: editingTable.groupId || null });
                  if (success) setEditingTable(null);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Thêm nhóm bàn mới</h3>
              <button onClick={() => setShowAddGroupModal(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên nhóm</label>
                <input 
                  type="text" 
                  placeholder="VD: Tầng 1, Tầng 2, Sân vườn..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowAddGroupModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (newGroupName) {
                    handleAddTableGroup(newGroupName);
                    setNewGroupName('');
                    setShowAddGroupModal(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Area */}
      {printData && (
        <div id="print-area" className="hidden print:block">
          {(() => {
            const template = printData.type === 'bill' ? systemSettings.paymentTemplate : systemSettings.kitchenTemplate;
            return (
              <>
                <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                  {template.showLogo && systemSettings.logo && (
                    <img src={systemSettings.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2 grayscale" />
                  )}
                  <h1 className="text-xl font-bold uppercase">{systemSettings.storeName}</h1>
                  {template.showStoreAddress && <p className="text-xs">{systemSettings.address}</p>}
                  {template.showStorePhone && <p className="text-xs">ĐT: {systemSettings.phone}</p>}
                </div>

                <div className="border-b border-dashed border-black pb-2 mb-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{printData.type === 'bill' ? 'HÓA ĐƠN THANH TOÁN' : 'PHIẾU CHẾ BIẾN'}</span>
                    <span>{printData.tableName}</span>
                  </div>
                  {template.showTime && printData.timeIn && (
                    <div className="flex justify-between text-[10px] mt-1">
                      <span>Giờ vào: {format(new Date(printData.timeIn), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  )}
                  {template.showTime && printData.timeOut && (
                    <div className="flex justify-between text-[10px] mt-1">
                      <span>Giờ ra: {format(new Date(printData.timeOut), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  )}
                  {template.showTime && !printData.timeIn && !printData.timeOut && (
                    <div className="flex justify-between text-[10px] mt-1">
                      <span>Ngày: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  )}
                  {template.showStaffName && (
                    <div className="flex justify-between text-[10px] mt-1">
                      <span>NV: {printData.staffName}</span>
                    </div>
                  )}
                </div>

                <table className={cn("w-full mb-4", template.fontSize === 'small' ? 'text-[10px]' : template.fontSize === 'large' ? 'text-sm' : 'text-xs')}>
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left py-1">Tên món</th>
                      <th className="text-center py-1">SL</th>
                      {printData.type === 'bill' && <th className="text-right py-1">T.Tiền</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {printData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-1">
                          <div className="font-bold">{item.name}</div>
                          {template.showNote && item.note && (
                            <div className="text-[10px] italic">Ghi chú: {item.note}</div>
                          )}
                          {item.selectedAddOns?.map(addon => (
                            <div key={addon.id} className="text-[10px] ml-2">+ {addon.name}</div>
                          ))}
                        </td>
                        <td className="text-center py-1">{item.quantity}</td>
                        {printData.type === 'bill' && (
                          <td className="text-right py-1">
                            {((item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity).toLocaleString()}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {printData.type === 'bill' && (
                  <div className="space-y-1 border-t border-black pt-2">
                    <div className="flex justify-between text-xs">
                      <span>Tạm tính:</span>
                      <span>{(printData.subtotal !== undefined ? printData.subtotal : printData.items.reduce((sum, item) => sum + (item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity, 0)).toLocaleString()}đ</span>
                    </div>
                    {(printData.discount || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Giảm giá:</span>
                        <span>-{(printData.discount || 0).toLocaleString()}đ</span>
                      </div>
                    )}
                    {(printData.vat || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>VAT ({systemSettings.vatPercent}%):</span>
                        <span>{(printData.vat || 0).toLocaleString()}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-dashed border-black">
                      <span>TỔNG CỘNG:</span>
                      <span>{printData.total?.toLocaleString()}đ</span>
                    </div>
                  </div>
                )}

                <div className="text-center mt-8 text-[10px] italic">
                  {printData.type === 'bill' ? 'Cảm ơn Quý khách. Hẹn gặp lại!' : 'Vui lòng chế biến món nhanh!'}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const Header = ({ view, currentUser }: { view: ViewType, currentUser: User | null }) => {
  const titles: Record<ViewType, string> = {
    tables: 'Sơ đồ phòng bàn',
    menu_mgmt: 'Quản lý thực đơn',
    kitchen: 'Điều phối nhà bếp',
    reports: 'Báo cáo doanh thu',
    inventory: 'Quản lý kho hàng',
    customers: 'Khách hàng (CRM)',
    shifts: 'Quản lý ca làm việc',
    user_mgmt: 'Quản lý nhân viên',
    summary: 'Tổng kết & Báo cáo',
    settings: 'Cài đặt hệ thống'
  };

  return (
    <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]/80 backdrop-blur-md z-10 shrink-0">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider truncate max-w-[200px] md:max-w-none">
          {titles[view]}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
          {format(new Date(), 'eeee, dd MMMM yyyy')} • {currentUser?.name}
        </p>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        {view === 'tables' && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
              <span>Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span>Đang dùng</span>
            </div>
          </div>
        )}
        
        <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0a0a]" />
        </button>
      </div>
    </header>
  );
};
