import React from 'react';
import { cn } from '@/lib/utils';

const Table = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200", className)}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = "" }) => {
  return (
    <thead className={cn("bg-gray-50", className)}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = "" }) => {
  return (
    <tbody className={cn("bg-white divide-y divide-gray-200", className)}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = "", onClick }) => {
  return (
    <tr 
      className={cn("hover:bg-gray-50", className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableHead = ({ children, className = "" }) => {
  return (
    <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </th>
  );
};

const TableCell = ({ children, className = "" }) => {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-900", className)}>
      {children}
    </td>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export default Table;
