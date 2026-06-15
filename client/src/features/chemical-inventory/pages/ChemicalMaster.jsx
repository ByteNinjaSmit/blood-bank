import React, { useState } from 'react';
import { Plus, X, Search, Settings } from 'lucide-react';
import {
  useChemicalList,
  useCategoryList,
  useManufacturerList,
  useCreateChemical,
  useDeleteChemical,
  useCreateCategory,
} from '../queries';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';

export default function ChemicalMaster() {
  const { user } = useAuth();
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Category States
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [showMfgSuggestions, setShowMfgSuggestions] = useState(false);

  // Create Chemical States
  const [chemForm, setChemForm] = useState({
    name: '',
    categoryId: '',
    manufacturer: '',
    unitType: 'Bottle',
    minStockLevel: 0,
    reorderLevel: 0,
  });

  const { data: chemicals, isLoading: loadingChems } = useChemicalList();
  const { data: categories } = useCategoryList();
  const { data: manufacturers } = useManufacturerList();
  
  const createChemical = useCreateChemical();
  const deleteChemical = useDeleteChemical();
  const createCategory = useCreateCategory();

  const isAdmin = user?.role === 'system-admin' || user?.role === 'admin' || user?.role === 'bbo';

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    createCategory.mutateAsync({
      name: catName.trim(),
      description: catDesc.trim(),
    }).then(() => {
      toast.success('Category created successfully!');
      setCatName('');
      setCatDesc('');
      setShowCategoryDrawer(false);
    }).catch((err) => {
      toast.error(err.message || 'Failed to create category');
    });
  };

  const handleAddChemical = (e) => {
    e.preventDefault();
    const { name, categoryId, manufacturer, unitType, minStockLevel, reorderLevel } = chemForm;
    if (!name.trim() || !categoryId || !manufacturer.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    createChemical.mutateAsync({
      name: name.trim(),
      categoryId,
      manufacturer: manufacturer.trim(),
      unitType,
      minStockLevel: Number(minStockLevel),
      reorderLevel: Number(reorderLevel),
    }).then(() => {
      toast.success('Chemical created successfully!');
      setChemForm({
        name: '',
        categoryId: '',
        manufacturer: '',
        unitType: 'Bottle',
        minStockLevel: 0,
        reorderLevel: 0,
      });
      setShowAddDrawer(false);
    }).catch((err) => {
      toast.error(err.message || 'Failed to register chemical');
    });
  };

  const handleDeleteChem = (id) => {
    if (!window.confirm('Are you sure you want to delete this chemical?')) return;
    deleteChemical.mutateAsync(id).then(() => {
      toast.success('Chemical soft-deleted successfully');
    }).catch((err) => {
      toast.error(err.message || 'Failed to delete chemical');
    });
  };

  const filteredChemicals = (chemicals || []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.categoryId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.manufacturerId?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chemical Master</h1>
          <p className="text-sm text-gray-500 font-medium">Configure chemical specifications, unit types, and reorder levels</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCategoryDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-700/20 bg-red-50 text-red-800 text-sm font-semibold rounded-lg hover:bg-red-100/60 shadow-sm transition-colors"
            >
              <Settings className="w-4 h-4" /> Add Category
            </button>
          )}
          <button
            onClick={() => setShowAddDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Chemical
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, category, manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Chemical Name', 'Category', 'Manufacturer', 'Unit Type', 'Min Stock', 'Reorder Level', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingChems ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">Loading chemical list...</td></tr>
              ) : filteredChemicals.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No chemicals registered.</td></tr>
              ) : filteredChemicals.map((chem) => (
                <tr key={chem._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{chem.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{chem.categoryId?.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{chem.manufacturerId?.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-medium">{chem.unitType}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{chem.minStockLevel}</td>
                  <td className="px-5 py-3 text-sm text-red-700 font-bold">{chem.reorderLevel}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${chem.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'} border`}>
                      {chem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDeleteChem(chem._id)}
                      className="text-xs text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Add Category Drawer */}
      {showCategoryDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCategoryDrawer(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
              <h2 className="text-base font-bold">Add New Master Category</h2>
              <button onClick={() => setShowCategoryDrawer(false)} className="text-red-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCategory} className="flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Category Name *</label>
                <input required value={catName} onChange={(e) => setCatName(e.target.value)} className={fieldClass} placeholder="e.g. Blood Grouping Reagents" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Description</label>
                <textarea rows="4" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className={fieldClass} placeholder="Enter category descriptions" />
              </div>
              <div className="pt-4 border-t flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCategoryDrawer(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900">Save Category</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Add Chemical Drawer */}
      {showAddDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddDrawer(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
              <h2 className="text-base font-bold">Register Chemical Specifications</h2>
              <button onClick={() => setShowAddDrawer(false)} className="text-red-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddChemical} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Chemical / Reagent Name *</label>
                <input required value={chemForm.name} onChange={(e) => setChemForm({ ...chemForm, name: e.target.value })} className={fieldClass} placeholder="e.g. Anti-A" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Category *</label>
                <select required value={chemForm.categoryId} onChange={(e) => setChemForm({ ...chemForm, categoryId: e.target.value })} className={`${fieldClass} bg-white`}>
                  <option value="">Select Category...</option>
                  {(categories || []).map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Manufacturer *</label>
                <input
                  required
                  type="text"
                  value={chemForm.manufacturer}
                  onChange={(e) => {
                    setChemForm({ ...chemForm, manufacturer: e.target.value });
                    setShowMfgSuggestions(true);
                  }}
                  onFocus={() => setShowMfgSuggestions(true)}
                  onBlur={() => setShowMfgSuggestions(false)}
                  className={fieldClass}
                  placeholder="Type or select manufacturer..."
                />
                {showMfgSuggestions && (manufacturers || []).length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {(manufacturers || [])
                      .filter((mfg) =>
                        mfg.name.toLowerCase().includes((chemForm.manufacturer || '').toLowerCase())
                      )
                      .map((mfg) => (
                        <button
                          key={mfg._id}
                          type="button"
                          onMouseDown={() => {
                            setChemForm({ ...chemForm, manufacturer: mfg.name });
                            setShowMfgSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-900 transition-colors"
                        >
                          {mfg.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Unit Type *</label>
                <select required value={chemForm.unitType} onChange={(e) => setChemForm({ ...chemForm, unitType: e.target.value })} className={`${fieldClass} bg-white`}>
                  {['Bottle', 'Kit', 'Card', 'Pack', 'Bag'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Min Stock Level *</label>
                  <input required type="number" min="0" value={chemForm.minStockLevel} onChange={(e) => setChemForm({ ...chemForm, minStockLevel: Number(e.target.value) })} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Reorder Level *</label>
                  <input required type="number" min="0" value={chemForm.reorderLevel} onChange={(e) => setChemForm({ ...chemForm, reorderLevel: Number(e.target.value) })} className={fieldClass} />
                </div>
              </div>

              <div className="pt-4 border-t flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddDrawer(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createChemical.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-60">
                  {createChemical.isPending ? 'Registering…' : 'Register Chemical'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
