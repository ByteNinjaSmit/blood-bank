import { ShieldCheck, ShieldX, Droplet, Calendar, Building2 } from 'lucide-react'

interface UnitDetails {
    unitId: string
    componentType: string
    aboGroup: string
    rhFactor: string
    status: string
    collectedAt: string
    expiresAt: string
    issuingHospitalName: string | null
}

const COMPONENT_LABELS: Record<string, string> = {
    WB: 'Whole Blood',
    PRBC: 'Packed Red Blood Cells',
    FFP: 'Fresh Frozen Plasma',
    RDP: 'Random Donor Platelets',
    CRYO: 'Cryoprecipitate',
}

const STATUS_LABELS: Record<string, string> = {
    COLLECTED: 'Collected',
    IN_TESTING: 'Under Testing',
    QUARANTINE: 'In Quarantine',
    RELEASED: 'Released — Available',
    RESERVED: 'Reserved',
    CROSSMATCHED: 'Crossmatched',
    ISSUED: 'Issued',
    TRANSFUSED: 'Transfused',
    RETURNED_UNUSED: 'Returned Unused',
    DISCARDED: 'Discarded',
    EXPIRED: 'Expired',
}

function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchUnit(unitId: string): Promise<UnitDetails | null> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    try {
        const res = await fetch(`${backendUrl}/api/v2/verify/${encodeURIComponent(unitId)}`, {
            cache: 'no-store',
        })
        if (!res.ok) return null
        const json = await res.json()
        return json?.data ?? null
    } catch {
        return null
    }
}

export default async function VerifyUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
    const { unitId } = await params
    const unit = await fetchUnit(unitId)

    if (!unit) {
        return (
            <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <ShieldX className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-2">Not Found</h1>
                    <p className="text-sm text-gray-500">
                        This code does not correspond to a valid, active blood unit issued by Sanjivani Blood Centre.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-emerald-600 text-white px-6 py-5 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 shrink-0" />
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">Authentic</p>
                        <p className="text-lg font-black leading-tight">Verified Blood Unit</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Sanjivani Blood Centre
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                            <Droplet className="w-5 h-5 text-[#8B0000] shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Blood Group</p>
                                <p className="text-base font-black text-gray-900">
                                    {unit.aboGroup} {unit.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Unit ID</p>
                            <p className="text-xs font-bold text-gray-900 font-mono break-all">{unit.unitId}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Component</p>
                            <p className="text-xs font-bold text-gray-900">
                                {COMPONENT_LABELS[unit.componentType] || unit.componentType}
                            </p>
                        </div>

                        <div className="col-span-2 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                            <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Collected</p>
                                    <p className="text-xs font-bold text-gray-900">{formatDate(unit.collectedAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Expires</p>
                                    <p className="text-xs font-bold text-gray-900">{formatDate(unit.expiresAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</p>
                            <p className="text-xs font-bold text-gray-900">{STATUS_LABELS[unit.status] || unit.status}</p>
                        </div>

                        {unit.issuingHospitalName && (
                            <div className="col-span-2 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                                <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Issued To</p>
                                    <p className="text-xs font-bold text-gray-900">{unit.issuingHospitalName}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-[10px] text-gray-400 pt-2">
                        This unit exists in Sanjivani Blood Centre&apos;s records and its current status is shown above.
                    </p>
                </div>
            </div>
        </div>
    )
}
