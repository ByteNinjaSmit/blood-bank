import React from "react";

const RowsPerPageBar = ({ rowsPerPage, onChange }) => {
  return (
    <div className="flex items-center justify-end px-6 py-3 border-b border-red-100 bg-white">
      <div className="flex items-center gap-2 text-sm">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default RowsPerPageBar;
