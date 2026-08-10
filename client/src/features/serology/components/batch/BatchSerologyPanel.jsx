import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DEFAULT_TESTS } from "./use-batch-serology";

const RESULT_CELL_CLASSES = {
  Negative: "border-gray-200 text-gray-700",
  Reactive: "border-red-300 bg-red-50 text-red-700 font-medium",
  Shadeness: "border-orange-300 bg-orange-50 text-orange-700 font-medium",
};

// The matrix grid: rows = selected bags, columns = the 5 TTI parameters.
// Every cell defaults to Negative (see use-batch-serology's defaultRow) —
// the user only needs to touch the cells that are Reactive or Shadeness.
// Pure staging/editing here — the confirm + sign-off step happens back on
// BatchSerologyQueuePanel once this closes, mirroring how "Enter
// Components" / BatchSeparateModal only stages data for Component
// Separation's batch queue rather than submitting anything itself.
export default function BatchSerologyPanel({
  open,
  onOpenChange,
  bags,
  matrix,
  setCell,
  removeBag,
}) {
  const counts = { Negative: 0, Reactive: 0, Shadeness: 0 };
  bags.forEach((bag) => {
    const row = matrix.get(bag._id) || {};
    DEFAULT_TESTS.forEach((t) => {
      const v = row[t.key] || "Negative";
      counts[v] = (counts[v] || 0) + 1;
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Batch Enter Results — {bags.length} bag(s)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {bags.length * DEFAULT_TESTS.length} results total
            </span>
            <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              {counts.Negative || 0} Negative
            </span>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              {counts.Reactive || 0} Reactive
            </span>
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              {counts.Shadeness || 0} Shadeness
            </span>
          </div>

          <div className="max-h-[50vh] overflow-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  {DEFAULT_TESTS.map((t) => (
                    <th key={t.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.label}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bags.map((bag) => {
                  const row = matrix.get(bag._id) || {};
                  return (
                    <tr key={bag._id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bag.bagNo}</div>
                        <div className="text-xs text-gray-500">{bag.bloodGroup} {bag.rh}</div>
                      </td>
                      {DEFAULT_TESTS.map((t) => {
                        const value = row[t.key] || "Negative";
                        return (
                          <td key={t.key} className="px-2 py-2">
                            <select
                              value={value}
                              onChange={(e) => setCell(bag._id, t.key, e.target.value)}
                              className={`w-32 px-2 py-1.5 border rounded-md text-xs focus:ring-red-400 focus:border-red-400 ${RESULT_CELL_CLASSES[value] || RESULT_CELL_CLASSES.Negative}`}
                            >
                              <option value="Negative">Negative</option>
                              <option value="Reactive">Reactive</option>
                              <option value="Shadeness">Shadeness</option>
                            </select>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          title="Remove from batch"
                          onClick={() => removeBag(bag._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {bags.length === 0 && (
                  <tr>
                    <td colSpan={DEFAULT_TESTS.length + 2} className="px-3 py-6 text-center text-gray-400">
                      No bags selected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
