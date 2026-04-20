# Component-Wise Blood Compatibility + Crossmatch Rules

Implement medically-accurate, component-specific ABO/Rh compatibility and crossmatch rules into the existing FIFO-based requisition matching system. The current backend does **exact match only** (same bloodGroup + same Rh). This upgrade replaces that with proper transfusion medicine rules per component type.

## Proposed Changes

### Backend — Compatibility Engine

#### [NEW] [blood-compatibility.js](file:///d:/Projects/Projects/blood-bank/server/utils/blood-compatibility.js)

A pure-logic utility module containing all compatibility rules. Zero DB dependencies — easily unit-testable.

**Functions exported:**

| Function | Purpose |
|---|---|
| `getCompatibleDonorGroups(recipientGroup, componentType)` | Returns array of acceptable ABO groups |
| `isRhCompatible(recipientRh, donorRh, componentType)` | Boolean Rh check per component rules |
| `requiresCrossmatch(componentType)` | `true` for RBC only |
| `getCompatibilityStrictness(componentType)` | Returns `'high'` / `'medium'` / `'low'` / `'very-low'` |
| `isComponentCompatible(recipient, donor, componentType)` | Master check combining ABO + Rh |

**Compatibility matrices encoded:**

```
ABO for RBC (Strict):     O→O | A→A,O | B→B,O | AB→A,B,AB,O
ABO for FFP (Reverse):    O→O,A,B,AB | A→A,AB | B→B,AB | AB→AB
ABO for Platelet (Pref):  O→O | A→A | B→B | AB→any (fallback: any→any)
ABO for Cryo (Optional):  any→any (preferred: same group)

Rh rules:
  RBC:      Rh− can only receive Rh−; Rh+ can receive both
  FFP:      Rh ignored
  Platelet: Rh preferred match, not mandatory
  Cryo:     Rh ignored
```

---

### Backend — Updated Match Controller

#### [MODIFY] [request-controller.js](file:///d:/Projects/Projects/blood-bank/server/controllers/request-controller.js)

**`matchRequest` function changes:**

1. **Replace exact-match `$match` stage** with compatibility-aware filtering:
   - Instead of `{ 'bag.bloodGroup': rc.bloodGroup, 'bag.rh': rc.rh }`, use `{ 'bag.bloodGroup': { $in: compatibleGroups } }` + Rh filter per component rules.
   
2. **FIFO ordering preserved**: `{ $sort: { inStockDate: 1, 'component.expiryDate': 1 } }` remains unchanged.

3. **Prefer exact match first** (for Platelets & Cryo): Sort puts exact ABO+Rh matches first via a computed `matchPriority` field, then falls back to compatible alternates.

4. **Crossmatch flag**: For RBC, set `crossmatchRequired: true` on each matched inventory item in the response. The `matchedInventory` sub-documents will include a `crossmatchStatus` field.

5. **Edge conditions handled**:
   - Expired components excluded (`expiryDate >= now`)
   - Already reserved/issued units excluded (`status: 'in-stock'` filter)
   - Concurrent reservation race condition (existing `modifiedCount` check preserved)
   - If no compatible units exist, return shortage with `compatibleGroupsSearched` info

6. **Response enriched**: Each matched item now includes `{ compatibilityType: 'exact' | 'compatible', crossmatchRequired: boolean }`.

---

### Backend — Model Update

#### [MODIFY] [hospital-request-model.js](file:///d:/Projects/Projects/blood-bank/server/models/hospital-request-model.js)

1. Add `'Cryo'` to the `componentType` enum (currently only `RBC`, `FFP`, `Platelet`)
2. Extend `matchedInventory` sub-schema with:
   - `compatibilityType: { type: String, enum: ['exact', 'compatible'], default: 'exact' }`
   - `crossmatchRequired: { type: Boolean, default: false }`
   - `crossmatchStatus: { type: String, enum: ['pending', 'compatible', 'incompatible'], default: 'pending' }`

---

### Backend — New Crossmatch Endpoint

#### [MODIFY] [request-controller.js](file:///d:/Projects/Projects/blood-bank/server/controllers/request-controller.js)

Add `updateCrossmatch` handler:
- `PATCH /requests/:id/crossmatch` — Updates crossmatch status for a specific matched inventory item
- Payload: `{ inventoryId, crossmatchStatus: 'compatible' | 'incompatible' }`
- If any RBC unit is marked `incompatible`, auto-release that unit back to `in-stock` and attempt to find a replacement

#### [MODIFY] [request-routes.js](file:///d:/Projects/Projects/blood-bank/server/routers/request-routes.js)

Add route: `router.patch('/:id/crossmatch', requestController.updateCrossmatch);`

---

### Frontend — API Service

#### [MODIFY] [requisitionApi.js](file:///d:/Projects/Projects/blood-bank/client/src/services/requisitionApi.js)

Add:
- `updateCrossmatch(requestId, { inventoryId, crossmatchStatus })` — calls `PATCH /requests/:id/crossmatch`
- `getCompatibilityInfo(componentType, bloodGroup, rh)` — calls `GET /requests/compatibility-info` (new endpoint returning rules for display)

---

### Frontend — Hook Update

#### [MODIFY] [useRequisition.js](file:///d:/Projects/Projects/blood-bank/client/src/page/requisition/hooks/useRequisition.js)

Add:
- `handleCrossmatchUpdate(inventoryId, status)` — calls API and refreshes request
- Track `crossmatchUpdating` state

---

### Frontend — Match Review Step (Major UI Enhancement)

#### [MODIFY] [MatchReviewStep.jsx](file:///d:/Projects/Projects/blood-bank/client/src/page/requisition/steps/MatchReviewStep.jsx)

Enhanced match results display:
1. **Compatibility badge per row**: Show `🟢 Exact` or `🟡 Compatible` tag next to each matched unit
2. **Crossmatch column**: For RBC rows, show crossmatch status badge (`⏳ Pending`, `✅ Compatible`, `❌ Incompatible`) with action buttons
3. **Component-wise grouping**: Group matched inventory by component type with sub-headers
4. **Compatibility info panel**: Collapsible panel showing the active compatibility rules being applied

---

### Frontend — New Compatibility Reference Component

#### [NEW] [CompatibilityMatrix.jsx](file:///d:/Projects/Projects/blood-bank/client/src/page/requisition/components/CompatibilityMatrix.jsx)

A collapsible reference card showing the full compatibility matrix for all 4 components. Displayed at the top of the Match Review step. Color-coded cells:
- 🟢 Green = Allowed
- 🟡 Yellow = Preferred only
- 🔴 Red = Not allowed

Shows ABO rules, Rh rules, crossmatch requirement, and strictness level per component.

---

### Frontend — Approve/Issue Step Update

#### [MODIFY] [ApproveIssueStep.jsx](file:///d:/Projects/Projects/blood-bank/client/src/page/requisition/steps/ApproveIssueStep.jsx)

1. **Block issue if any RBC crossmatch is `pending` or `incompatible`** — Show warning banner
2. Show compatibility and crossmatch status columns in the issue preview table

---

### Backend — Compatibility Info Endpoint  

#### [MODIFY] [request-controller.js](file:///d:/Projects/Projects/blood-bank/server/controllers/request-controller.js)

Add `getCompatibilityInfo` handler:
- `GET /requests/compatibility-info?componentType=RBC&bloodGroup=A&rh=Positive`
- Returns `{ compatibleDonorGroups: [...], rhRule: '...', crossmatchRequired: boolean, strictness: '...' }`
- Pure logic, no DB query — used by frontend to show real-time compatibility info as user selects component type

#### [MODIFY] [request-routes.js](file:///d:/Projects/Projects/blood-bank/server/routers/request-routes.js)

Add route: `router.get('/compatibility-info', requestController.getCompatibilityInfo);`

---

## Edge Conditions Handled

| Condition | Handling |
|---|---|
| O Rh− (universal RBC donor) is in short supply | FIFO + exact-match-first sort ensures O− is used for O− patients first, only falls back to compatible recipients after |
| AB patient requesting RBC | All groups eligible; sorted by exact first (AB), then compatible (A, B, O) |
| Rh− patient for Platelets | Prefer Rh− but accept Rh+ (with `compatibilityType: 'compatible'` flag) |
| Crossmatch fails on RBC | Auto-unreserve the incompatible unit, attempt replacement from remaining in-stock |
| Cryo with no same-group available | Accept any group (strictness = very low) |
| FFP for O patient | Accepts O, A, B, AB (reverse ABO) |
| Concurrent reservation race | Existing `modifiedCount` check + rollback logic preserved |
