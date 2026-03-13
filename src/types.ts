export type UserRole = 'admin' | 'staff' | 'kitchen' | 'manager' | 'order' | 'cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  storeId: string;
}

export interface Store {
  id: string;
  name: string;
  createdAt: string;
}

export type MenuItemType = 'goods' | 'dish';

export interface RecipeItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  code: string; // Mã hàng hóa tự động sinh
  name: string;
  price: number;
  costPrice: number;
  category: string;
  image?: string;
  status: 'available' | 'out_of_stock';
  stock: number;
  minStock?: number;
  unit: string;
  type: MenuItemType;
  recipe?: RecipeItem[];
  addOns?: AddOnItem[];
  isInventory?: boolean; // Phân biệt hàng trong kho (nguyên liệu) và hàng thực đơn
}

export interface OrderItem extends MenuItem {
  quantity: number;
  note?: string;
  isCompleted?: boolean;
  selectedAddOns?: AddOnItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  level: 'Normal' | 'Silver' | 'Gold' | 'Diamond';
  lastVisit?: string;
}

export interface OrderSession {
  id: string;
  items: OrderItem[];
  startTime: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  status: 'pending' | 'completed' | 'paid';
  paymentMethod?: 'cash' | 'transfer' | 'qr';
  staffId?: string;
  note?: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'empty' | 'occupied' | 'reserved' | 'paying';
  currentOrder?: OrderItem[]; // Deprecated, used for migration or temporary draft
  orders?: OrderSession[]; // New: Multiple independent orders
  startTime?: string;
  customerId?: string;
  discount?: number;
  vat?: number;
  groupId?: string;
  note?: string;
  lastCommittedTotal?: number; // Track the highest committed order value
}

export interface TableGroup {
  id: string;
  name: string;
  storeId: string;
}

export interface VoidItemDetail {
  itemName: string;
  oldQuantity: number;
  newQuantity: number;
  valueDiff: number;
}

export interface VoidLog {
  id: string;
  time: string;
  staffName: string;
  tableName: string;
  itemName: string; // Keep for backward compatibility or summary
  oldQuantity: number;
  newQuantity: number;
  valueDiff: number; // Positive number indicating the lost revenue
  type?: 'item_void' | 'bill_void';
  details?: VoidItemDetail[]; // List of changed items
}

export interface Shift {
  id: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  endCash?: number;
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  staffId: string;
  staffName?: string;
  status: 'open' | 'closed';
  storeId: string;
  voidLogs?: VoidLog[]; // Track suspicious reductions
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  type: 'import' | 'export' | 'return' | 'audit';
  date: string;
  note?: string;
  referenceId?: string;
}

export interface AuditItem {
  itemId: string;
  itemName: string;
  systemStock: number;
  actualStock: number;
  discrepancy: number;
  unit: string;
}

export interface InventoryAudit {
  id: string;
  date: string;
  items: AuditItem[];
  staffId: string;
  staffName: string;
  note?: string;
}

export interface StockCardEntry {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'sale' | 'import' | 'export' | 'return' | 'audit';
  referenceId: string;
  change: number;
  remaining: number;
  note?: string;
}

export interface Invoice {
  id: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr';
  date: string;
  timeIn?: string;
  completedAt?: string;
  staffId: string;
  staffName: string;
  storeId: string;
  note?: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  category: string;
  note?: string;
  staffId: string;
  staffName: string;
  storeId: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  connectionType: 'lan' | 'bluetooth' | 'usb';
  ipAddress?: string;
  port?: number;
  deviceId?: string; // For Bluetooth/USB
  type: 'bill' | 'kitchen' | 'both';
  isEnabled: boolean;
  isDefault?: boolean;
  paperSize: '58mm' | '80mm';
}

export interface PrintTemplateSettings {
  showTime: boolean;
  showStaffName: boolean;
  showStoreAddress: boolean;
  showStorePhone: boolean;
  showLogo: boolean;
  showNote: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface SystemSettings {
  storeName: string;
  address?: string;
  phone?: string;
  logo?: string;
  adminUsername: string;
  adminPassword?: string;
  kitchenBellEnabled: boolean;
  vatPercent: number;
  kitchenBillTemplate: string;
  paymentBillTemplate: string;
  inventoryCategories: string[];
  cashCategories: string[];
  printers: PrinterConfig[];
  silentPrinting: boolean;
  kitchenTemplate: PrintTemplateSettings;
  paymentTemplate: PrintTemplateSettings;
}

export type ViewType = 'tables' | 'menu_mgmt' | 'kitchen' | 'reports' | 'inventory' | 'customers' | 'shifts' | 'user_mgmt' | 'summary' | 'settings';

export const CATEGORIES = ['Tất cả', 'Món chính', 'Khai vị', 'Đồ uống', 'Tráng miệng', 'Combo'];

export const INITIAL_MENU: MenuItem[] = [
  { 
    id: '1', 
    code: 'MA001', 
    name: 'Phở Bò Tái Lăn', 
    price: 65000, 
    costPrice: 25000, 
    category: 'Món chính', 
    status: 'available', 
    stock: 50, 
    unit: 'Tô', 
    type: 'dish', 
    recipe: [{ ingredientId: 'raw_beef', name: 'Thịt bò', quantity: 0.1, unit: 'kg' }],
    addOns: [
      { id: 'a1', name: 'Thêm thịt', price: 20000 },
      { id: 'a2', name: 'Thêm trứng', price: 5000 },
      { id: 'a3', name: 'Quẩy (2 chiếc)', price: 5000 }
    ]
  },
  { 
    id: '2', 
    code: 'MA002', 
    name: 'Bún Chả Hà Nội', 
    price: 55000, 
    costPrice: 20000, 
    category: 'Món chính', 
    status: 'available', 
    stock: 40, 
    unit: 'Suất', 
    type: 'dish',
    addOns: [
      { id: 'a4', name: 'Thêm chả', price: 15000 },
      { id: 'a5', name: 'Thêm bún', price: 5000 }
    ]
  },
  { id: '3', code: 'MA003', name: 'Nem Rán', price: 45000, costPrice: 15000, category: 'Khai vị', status: 'available', stock: 100, unit: 'Đĩa', type: 'dish' },
  { id: '4', code: 'HH001', name: 'Coca Cola', price: 15000, costPrice: 8000, category: 'Đồ uống', status: 'available', stock: 200, unit: 'Lon', type: 'goods' },
  { id: '5', code: 'HH002', name: 'Bia Heineken', price: 25000, costPrice: 18000, category: 'Đồ uống', status: 'available', stock: 150, unit: 'Lon', type: 'goods' },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Bàn ${i + 1}`,
  status: 'empty',
  currentOrder: [],
}));

export const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', name: 'Quản trị viên', password: '123', role: 'admin', storeId: 'default' },
  { id: '2', username: 'staff1', name: 'Nhân viên 1', password: '123', role: 'staff', storeId: 'default' },
];
