import React, { useState } from 'react';

// Multi-select dropdown for picking available blood bags (with a running mL
// total). Shared by the Send-to-Storage form and the Bulk "Give Loan" picker.
const MultiBagSelect = ({ availableBags, selectedBags, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBag = (bagId) => {
    const isSelected = selectedBags.includes(bagId);
    let newSelected;
    if (isSelected) {
      newSelected = selectedBags.filter(id => id !== bagId);
    } else {
      newSelected = [...selectedBags, bagId];
    }
    onChange(newSelected);
  };

  const selectedVolumeMl = availableBags
    .filter((bag) => selectedBags.includes(bag._id))
    .reduce((sum, bag) => sum + (Number(bag.component?.volumeMl) || 0), 0);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 text-left border rounded-md text-sm bg-white flex items-center justify-between shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 border-gray-300"
      >
        <span className="truncate">
          {selectedBags.length === 0 ? "Select blood bags..." : `${selectedBags.length} bag(s) selected · ${selectedVolumeMl} mL`}
        </span>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md p-2 space-y-1 shadow-inner">
          {availableBags.length === 0 ? (
            <div className="text-xs text-gray-500 p-2 text-center">No bags available in stock</div>
          ) : (
            availableBags.map((bag) => {
              const isChecked = selectedBags.includes(bag._id);
              return (
                <label
                  key={bag._id}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-red-50 cursor-pointer text-sm transition-colors duration-150 ${
                    isChecked ? "bg-red-50 text-red-900 font-bold" : "text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBag(bag._id)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span>
                      Bag: {bag.bagNo} ({bag.component?.componentType || '—'}
                      {bag.bag?.bloodGroup ? `, ${bag.bag.bloodGroup}${bag.bag.rh === 'Positive' ? '+' : bag.bag.rh === 'Negative' ? '-' : ''}` : ''}) —{' '}
                      {bag.component?.volumeMl ? `${bag.component.volumeMl} mL` : 'Vol: —'}
                    </span>
                    <span className="text-xs text-gray-400">Exp: {bag.component?.expiryDate ? new Date(bag.component.expiryDate).toLocaleDateString() : '—'}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiBagSelect;
