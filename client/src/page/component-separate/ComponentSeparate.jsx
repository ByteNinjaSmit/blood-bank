import React, { useState, useEffect } from "react";
import { ArrowLeft, TestTube, Loader2, Scissors, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ComponentSeparate = () => {
  const { API, authorizationToken } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bagIdByBagNo, setBagIdByBagNo] = useState({});
  const [showSeparateModal, setShowSeparateModal] = useState(false);
  const [activeBag, setActiveBag] = useState(null);
  const [separateForm, setSeparateForm] = useState({ componentType: "RBC", volumeMl: 250 });

  const getBagVolumeStats = (bag) => {
    if (!bag) return { used: 0, total: 0, remaining: 0 };
    const total = bag.volumeGmMl || 0;
    const used = Array.isArray(bag.components)
      ? bag.components.reduce((acc, c) => acc + (Number(c.volumeMl) || 0), 0)
      : 0;
    const remaining = total - used;
    return { used, total, remaining };
  };

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const [bagsRes, donationRes] = await Promise.all([
        axios.get(`${API}/api/component/bags-to-separate`, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }),
        axios.get(`${API}/api/donation/list`, {
          params: { status: "collected", page: 1, limit: 1000 },
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }),
      ]);
      console.log("Bags to separate response:", bagsRes.data);

      const bagsData = Array.isArray(bagsRes.data?.bags) ? bagsRes.data.bags : [];
      setBags(bagsData);

      const donationList = Array.isArray(donationRes.data?.data) ? donationRes.data.data : [];
      const map = {};
      donationList.forEach((d) => {
        if (d?.bagNo && d?._id) map[d.bagNo] = d._id;
      });
      setBagIdByBagNo(map);
    } catch (error) {
      toast.error(error.response.data.message);
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
  }, []);

  const openSeparate = (bag) => {
    const { remaining } = getBagVolumeStats(bag);
    setActiveBag(bag);
    // Default to remaining or 250, whichever is smaller
    setSeparateForm({ componentType: "RBC", volumeMl: Math.min(250, remaining) });
    setShowSeparateModal(true);
  };

  const submitSeparate = async () => {
    if (!activeBag) return;
    const { remaining } = getBagVolumeStats(activeBag);
    const inputVolume = Number(separateForm.volumeMl);

    if (inputVolume > remaining) {
      toast.error(`Cannot separate ${inputVolume}mL. Only ${remaining}mL remaining.`);
      return;
    }

    const donationId = bagIdByBagNo[activeBag.bagNo];
    if (!donationId) {
      toast.error("Unable to resolve donationId for this bag");
      return;
    }
    try {
      setIsActionLoading(true);
      await axios.post(
        `${API}/api/component/separate`,
        {
          donationId,
          componentType: separateForm.componentType,
          volumeMl: inputVolume,
        },
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      );
      toast.success("Component separated successfully");
      setShowSeparateModal(false);
      
      // Auto-complete separation if volume is now 0
      if (remaining - inputVolume <= 0) {
        toast.info("Volume exhausted. Marking separation as completed.");
        await markCompleted(activeBag);
      } else {
        await fetchBags();
      }
      
      setActiveBag(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to separate component";
      toast.error(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const markCompleted = async (bag) => {
    const donationId = bagIdByBagNo[bag.bagNo];
    if (!donationId) {
      toast.error("Unable to resolve donationId for this bag");
      return;
    }
    try {
      setIsActionLoading(true);
      await axios.post(
        `${API}/api/component/separation-completed`,
        { donationId },
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      );
      toast.success("Marked separation as completed");
      await fetchBags();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to mark as completed";
      toast.error(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-3 text-red-800 border border-red-200 hover:bg-red-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <TestTube className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bags to Separate</h1>
              <p className="text-gray-600 mt-1">Fetch, separate, and complete in a few clicks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="text-sm text-gray-600">{bags.length} bag(s) ready</div>
            <Button onClick={fetchBags} variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Components</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading bags...
                      </div>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No collected blood bags found.</td>
                  </tr>
                ) : (
                  bags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.bloodGroup} {bag.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                        {(() => {
                          const { used, total } = getBagVolumeStats(bag);
                          return (
                            <div className="flex flex-col">
                              <span>{used} / {total} mL</span>
                              <div className="w-20 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full ${used >= total ? 'bg-green-500' : 'bg-red-500'}`} 
                                  style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.collectionDate ? new Date(bag.collectionDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {Array.isArray(bag.components) && bag.components.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bag.components.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100">
                                {c.componentType} {c.volumeMl}mL
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => openSeparate(bag)} 
                            disabled={isActionLoading}
                            title="Separate Component"
                          >
                            <Scissors className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => markCompleted(bag)} 
                            disabled={isActionLoading}
                            title="Mark Separation as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Dialog open={showSeparateModal} onOpenChange={setShowSeparateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Separate Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Bag: <span className="font-medium text-gray-900">{activeBag?.bagNo}</span></span>
              <span className="text-gray-600">
                Remaining: <span className={`font-medium ${getBagVolumeStats(activeBag).remaining <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {getBagVolumeStats(activeBag).remaining} mL
                </span>
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={separateForm.componentType}
                onChange={(e) => setSeparateForm((s) => ({ ...s, componentType: e.target.value }))}
              >
                <option value="RBC">Red Blood Cells</option>
                <option value="FFP">Fresh Frozen Plasma</option>
                <option value="Platelet">Platelets</option>
                <option value="Cryo">Cryoprecipitate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume (mL)</label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-md ${
                  Number(separateForm.volumeMl) > getBagVolumeStats(activeBag).remaining ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                value={separateForm.volumeMl}
                onChange={(e) => setSeparateForm((s) => ({ ...s, volumeMl: e.target.value }))}
                min={1}
                max={getBagVolumeStats(activeBag).remaining}
              />
              {Number(separateForm.volumeMl) > getBagVolumeStats(activeBag).remaining && (
                <p className="text-xs text-red-500 mt-1">Cannot exceed remaining volume.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeparateModal(false)}>Cancel</Button>
            <Button 
              onClick={submitSeparate} 
              disabled={isActionLoading || Number(separateForm.volumeMl) > getBagVolumeStats(activeBag).remaining || Number(separateForm.volumeMl) <= 0}
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Separate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentSeparate;