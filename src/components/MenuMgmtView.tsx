import React, { useState, useRef } from 'react';
import { UtensilsCrossed, Plus, Edit2, Trash2, Search, Image as ImageIcon, Check, X, Layers, ListPlus, Info, Download, Upload } from 'lucide-react';
import { MenuItem, CATEGORIES, MenuItemType, RecipeItem, AddOnItem } from '../types';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export const MenuMgmtView = ({ menu, onAddItem, onDeleteItem, onUpdateItem, categories, onAddCategory, onDeleteCategory }: { 
  menu: MenuItem[], 
  onAddItem: (item: MenuItem) => void,
  onDeleteItem: (id: string) => void,
  onUpdateItem: (item: MenuItem) => void,
  categories: string[],
  onAddCategory: (cat: string) => void,
  onDeleteCategory: (cat: string) => void
}) => {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'recipe' | 'addons'>('general');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [isQuickUpdate, setIsQuickUpdate] = useState(false);
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = menu.map(item => {
      // Format recipe as CODE:QUANTITY|CODE:QUANTITY
      const recipeStr = item.recipe?.map(r => {
        const ingredient = menu.find(m => m.id === r.ingredientId);
        return `${ingredient?.code || r.ingredientId}:${r.quantity}`;
      }).join('|') || '';

      // Format add-ons as NAME:PRICE|NAME:PRICE
      const addOnsStr = item.addOns?.map(a => `${a.name}:${a.price}`).join('|') || '';

      return {
        'Mã món': item.code,
        'Tên món': item.name,
        'Giá bán': item.price,
        'Giá vốn': item.costPrice,
        'Nhóm': item.category,
        'Đơn vị': item.unit,
        'Loại': item.type === 'goods' ? 'Hàng hóa' : 'Món ăn',
        'Loại hệ thống': item.type, // dish or goods
        'Trạng thái': item.status === 'available' ? 'Đang bán' : 'Hết món',
        'Tồn kho': item.stock,
        'Thành phần (Công thức)': recipeStr,
        'Món thêm': addOnsStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thực đơn");
    XLSX.writeFile(wb, `Thuc_don_${new Date().getTime()}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      data.forEach((row, index) => {
        // Determine type from 'Loại hệ thống' or 'Loại'
        let type: MenuItemType = 'dish';
        if (row['Loại hệ thống'] === 'goods' || row['Loại hệ thống'] === 'dish') {
          type = row['Loại hệ thống'] as MenuItemType;
        } else {
          type = row['Loại'] === 'Hàng hóa' ? 'goods' : 'dish';
        }

        const prefix = type === 'goods' ? 'HH' : 'MA';
        const count = menu.filter(i => i.type === type).length + index + 1;
        const code = `${prefix}${count.toString().padStart(3, '0')}`;

        // Parse recipe
        let recipe: RecipeItem[] = [];
        const recipeStr = row['Thành phần (Công thức)'];
        if (recipeStr && typeof recipeStr === 'string') {
          const parts = recipeStr.split('|');
          parts.forEach(part => {
            const [ingCode, qty] = part.split(':');
            if (ingCode && qty) {
              const ingredient = menu.find(m => m.code === ingCode);
              if (ingredient) {
                recipe.push({
                  ingredientId: ingredient.id,
                  name: ingredient.name,
                  quantity: Number(qty),
                  unit: ingredient.unit
                });
              }
            }
          });
        }

        // Parse add-ons
        let addOns: AddOnItem[] = [];
        const addOnsStr = row['Món thêm'];
        if (addOnsStr && typeof addOnsStr === 'string') {
          const parts = addOnsStr.split('|');
          parts.forEach(part => {
            const [name, price] = part.split(':');
            if (name && price) {
              addOns.push({
                id: Math.random().toString(36).substr(2, 5),
                name: name.trim(),
                price: Number(price)
              });
            }
          });
        }

        onAddItem({
          id: Math.random().toString(36).substr(2, 9),
          code: row['Mã món'] || code,
          name: row['Tên món'] || 'Món mới',
          price: Number(row['Giá bán']) || 0,
          costPrice: Number(row['Giá vốn']) || 0,
          category: row['Nhóm'] || categories[1] || 'Món chính',
          unit: row['Đơn vị'] || 'Đĩa',
          type,
          status: row['Trạng thái'] === 'Hết món' ? 'out_of_stock' : 'available',
          stock: Number(row['Tồn kho']) || 0,
          recipe,
          addOns,
          isInventory: false
        });
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`Đã nhập thành công ${data.length} món ăn!`);
    };
    reader.readAsBinaryString(file);
  };

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    costPrice: 0,
    category: categories[1] || 'Món chính',
    unit: 'Đĩa',
    type: 'dish',
    status: 'available',
    stock: 0,
    recipe: [],
    addOns: []
  });

  const filtered = menu.filter(item => {
    const matchesCat = activeCategory === 'Tất cả' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    const notInventory = !item.isInventory;
    return matchesCat && matchesSearch && notInventory;
  });

  const handleQuickSave = () => {
    Object.entries(quickPrices).forEach(([id, price]) => {
      const item = menu.find(i => i.id === id);
      if (item && item.price !== (price as number)) {
        onUpdateItem({ ...item, price: price as number });
      }
    });
    setIsQuickUpdate(false);
    setQuickPrices({});
  };

  const handleSave = () => {
    if (!newItem.name || !newItem.price) return;
    
    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        ...newItem as MenuItem,
      });
    } else {
      // Auto-generate code
      const prefix = newItem.type === 'goods' ? 'HH' : 'MA';
      const count = menu.filter(i => i.type === newItem.type).length + 1;
      const code = `${prefix}${count.toString().padStart(3, '0')}`;

      onAddItem({
        ...newItem as MenuItem,
        id: Math.random().toString(36).substr(2, 9),
        code,
        stock: newItem.stock || 0,
        isInventory: false
      });
    }
    setShowAdd(false);
    setEditingItem(null);
    setNewItem({ name: '', price: 0, costPrice: 0, category: categories[1], unit: 'Đĩa', type: 'dish', status: 'available', stock: 0, recipe: [], addOns: [], image: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
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
        
        // Quality 0.7 to keep it well under 1MB
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setNewItem({ ...newItem, image: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setShowAdd(true);
  };

  const addRecipeItem = () => {
    const recipe = newItem.recipe || [];
    setNewItem({ ...newItem, recipe: [...recipe, { ingredientId: '', name: '', quantity: 0, unit: 'kg' }] });
  };

  const addAddOn = () => {
    const addOns = newItem.addOns || [];
    setNewItem({ ...newItem, addOns: [...addOns, { id: Math.random().toString(36).substr(2, 5), name: '', price: 0 }] });
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-emerald-500" />
          Quản lý Thực đơn
        </h3>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => {
              if (isQuickUpdate) {
                handleQuickSave();
              } else {
                setIsQuickUpdate(true);
                const prices: Record<string, number> = {};
                filtered.forEach(item => prices[item.id] = item.price);
                setQuickPrices(prices);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
              isQuickUpdate ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-emerald-500 hover:bg-white/10"
            )}
          >
            {isQuickUpdate ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isQuickUpdate ? 'Lưu giá nhanh' : 'Cập nhật giá nhanh'}
          </button>
          {isQuickUpdate && (
            <button 
              onClick={() => setIsQuickUpdate(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-rose-500 hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          )}
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm món mới
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên món..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-emerald-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat} className="relative group/cat">
              <button
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm whitespace-nowrap transition-all cursor-pointer border",
                  activeCategory === cat 
                    ? "bg-emerald-500 border-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                {cat}
              </button>
              {cat !== 'Tất cả' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(cat);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/cat:opacity-100 transition-all shadow-lg hover:bg-rose-600 cursor-pointer z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="aspect-video bg-gray-800 relative">
              <img 
                src={item.image || `https://picsum.photos/seed/${item.id}/400/300`} 
                alt={item.name}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => handleEdit(item)}
                  className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-emerald-500 cursor-pointer"
                ><Edit2 className="w-4 h-4" /></button>
                <button 
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-rose-500 cursor-pointer"
                ><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-mono text-gray-300">{item.code}</span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  item.status === 'available' ? "bg-emerald-500/80 text-black" : "bg-rose-500/80 text-white"
                )}>
                  {item.status === 'available' ? 'Đang bán' : 'Hết món'}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-white truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.category} • {item.type === 'goods' ? 'Hàng hóa' : 'Món ăn'}</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Giá bán</p>
                  {isQuickUpdate ? (
                    <input 
                      type="number" 
                      className="w-full bg-white/10 border border-emerald-500/50 rounded-lg py-1 px-2 text-sm font-mono font-bold text-emerald-500 focus:outline-none"
                      value={quickPrices[item.id] || 0}
                      onChange={(e) => setQuickPrices({...quickPrices, [item.id]: Number(e.target.value)})}
                    />
                  ) : (
                    <p className="text-lg font-mono font-bold text-emerald-500">{item.price.toLocaleString()}đ</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Tồn kho</p>
                  <p className="text-sm font-mono text-gray-400">{item.stock} {item.unit}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingItem ? 'Chỉnh sửa món' : 'Thêm món mới'}</h3>
              <button 
                onClick={() => {
                  setShowAdd(false);
                  setEditingItem(null);
                }} 
                className="text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex border-b border-white/5">
              {[
                { id: 'general', label: 'Thông tin chung', icon: Info },
                { id: 'recipe', label: 'Thành phần', icon: Layers },
                { id: 'addons', label: 'Món thêm', icon: ListPlus }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all border-b-2",
                    activeTab === tab.id ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : "border-transparent text-gray-500 hover:text-white"
                  )}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <div className="w-40 h-24 bg-gray-800 rounded-xl overflow-hidden border border-white/10">
                      {newItem.image ? (
                        <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-all cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      {newItem.image ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                    </label>
                    <p className="text-[10px] text-gray-500">Dung lượng tối đa 1MB. Ảnh sẽ tự động thu nhỏ.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Loại mặt hàng</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setNewItem({...newItem, type: 'goods'})}
                          className={cn("py-3 rounded-xl border text-sm font-bold transition-all", newItem.type === 'goods' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/10 text-gray-500")}
                        >
                          Hàng hóa (Sẵn có)
                        </button>
                        <button 
                          onClick={() => setNewItem({...newItem, type: 'dish'})}
                          className={cn("py-3 rounded-xl border text-sm font-bold transition-all", newItem.type === 'dish' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/10 text-gray-500")}
                        >
                          Món ăn (Chế biến)
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tên món</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Nhóm hàng hóa</label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-[#1a1b1e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                          value={newItem.category}
                          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        >
                          {categories.filter(c => c !== 'Tất cả').map(c => (
                            <option key={c} value={c} className="bg-[#1a1b1e] text-white">{c}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setShowAddCat(true)}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-500 hover:bg-white/10"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Đơn vị tính</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        placeholder="Đĩa, Ly, Lon..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Giá bán</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Giá vốn</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                        value={newItem.costPrice}
                        onChange={(e) => setNewItem({...newItem, costPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recipe' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400 italic">Định lượng các thành phần để tự động trừ kho khi bán.</p>
                    <button 
                      onClick={addRecipeItem}
                      className="text-xs text-emerald-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm thành phần
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newItem.recipe?.map((r, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Tên nguyên liệu</label>
                          <select 
                            className="w-full bg-[#1a1b1e] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                            value={r.ingredientId}
                            onChange={(e) => {
                              const selected = menu.find(m => m.id === e.target.value);
                              if (selected) {
                                const recipe = [...(newItem.recipe || [])];
                                recipe[idx] = {
                                  ingredientId: selected.id,
                                  name: selected.name,
                                  quantity: recipe[idx].quantity,
                                  unit: selected.unit
                                };
                                setNewItem({...newItem, recipe});
                              }
                            }}
                          >
                            <option value="" className="bg-[#1a1b1e] text-white">-- Chọn nguyên liệu --</option>
                            {menu.filter(m => m.type === 'goods' || m.category === 'Nguyên liệu').map(m => (
                              <option key={m.id} value={m.id} className="bg-[#1a1b1e] text-white">{m.code} - {m.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Số lượng</label>
                          <input 
                            type="number" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                            value={r.quantity}
                            onChange={(e) => {
                              const recipe = [...(newItem.recipe || [])];
                              recipe[idx].quantity = Number(e.target.value);
                              setNewItem({...newItem, recipe});
                            }}
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Đơn vị</label>
                          <input 
                            type="text" 
                            readOnly
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-gray-500"
                            value={r.unit}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const recipe = (newItem.recipe || []).filter((_, i) => i !== idx);
                            setNewItem({...newItem, recipe});
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'addons' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400 italic">Các món ăn kèm hoặc tùy chọn thêm cho món này.</p>
                    <button 
                      onClick={addAddOn}
                      className="text-xs text-emerald-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm món kèm
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newItem.addOns?.map((addon, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Tên món kèm</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                            value={addon.name}
                            onChange={(e) => {
                              const addOns = [...(newItem.addOns || [])];
                              addOns[idx].name = e.target.value;
                              setNewItem({...newItem, addOns});
                            }}
                          />
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Giá thêm</label>
                          <input 
                            type="number" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                            value={addon.price}
                            onChange={(e) => {
                              const addOns = [...(newItem.addOns || [])];
                              addOns[idx].price = Number(e.target.value);
                              setNewItem({...newItem, addOns});
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const addOns = (newItem.addOns || []).filter((_, i) => i !== idx);
                            setNewItem({...newItem, addOns});
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button 
                onClick={() => {
                  setShowAdd(false);
                  setEditingItem(null);
                }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
              >
                {editingItem ? 'Cập nhật' : 'Lưu mặt hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white">Thêm nhóm hàng mới</h3>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="Tên nhóm (VD: Lẩu, Nướng...)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAddCat(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (newCat) {
                    onAddCategory(newCat);
                    setNewCat('');
                    setShowAddCat(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
              >
                Thêm nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
