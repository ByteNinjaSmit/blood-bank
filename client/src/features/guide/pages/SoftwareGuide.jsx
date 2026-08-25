import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Keyboard,
  FileText,
  UserPlus,
  Tent,
  Droplets,
  TestTube,
  CalendarRange,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

// Shared row for a keyboard key + what it does. Presentational only —
// this whole page is static reference content, no forms/API calls.
function ShortcutRow({ keys, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-2.5">
      <div className="flex flex-wrap gap-1 sm:w-48 shrink-0">
        {keys.map((k) => (
          <kbd
            key={k}
            className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
          >
            {k}
          </kbd>
        ))}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

// One clickable "go to this page" chip. Used at the top of every workflow
// section so the guide doubles as a jump-menu, not just reference text.
function PageLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {children}
    </Link>
  );
}

function PageLinks({ links }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {links.map((l) => (
        <PageLink key={l.to} to={l.to}>{l.label}</PageLink>
      ))}
    </div>
  );
}

function StepList({ steps }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-red-100 text-red-800 text-xs font-bold">
            {i + 1}
          </span>
          <div className="text-sm text-gray-600 leading-relaxed">
            {step.title && <span className="font-semibold text-gray-800 block mb-0.5">{step.title}</span>}
            <span>{step.text}</span>
            {step.fields && (
              <ul className="mt-1.5 ml-1 space-y-1 list-disc list-inside text-gray-500">
                {step.fields.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SubHeading({ children }) {
  return <h4 className="font-semibold text-gray-800 text-sm mt-5 mb-2 first:mt-0">{children}</h4>;
}

function Note({ children }) {
  return (
    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

function Warn({ children }) {
  return (
    <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

const SECTIONS = [
  {
    id: "controls",
    icon: Keyboard,
    title: "Website Controls & Keyboard Shortcuts",
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-3">
          Almost every data-entry form in this system (Donor Creation, Camp Registration, Component
          Separation, TTD Testing, Requisition, Purchase Orders, User Creation, Chemical Inventory, and
          more) is wired for full keyboard-only entry, so an operator entering dozens of records a day
          never has to reach for the mouse. The rules below apply consistently across all of them.
        </p>

        <SubHeading>Moving between fields</SubHeading>
        <div className="divide-y divide-gray-100">
          <ShortcutRow keys={["Enter"]}>
            Moves the cursor from the current text box, number box, date box, or textarea straight to the
            next field in the form — it never submits the page by itself. On a dropdown (
            <code className="px-1 bg-gray-100 rounded">&lt;select&gt;</code>), the <em>first</em> Enter
            opens the native options list (so Up/Down can browse it); a <em>second</em> Enter always
            confirms whichever option is highlighted — even if you didn't actually change it — and
            advances to the next field, instead of re-opening the list.
          </ShortcutRow>
          <ShortcutRow keys={["↑", "↓"]}>
            While a dropdown's option list is open, Up/Down highlights the option above/below (native
            browser behaviour — unaffected). Inside batch data-entry grids (Batch Component Separation,
            Batch TTD Testing), Up/Down jumps to the same column one row up or down, so you can walk down
            a column of bags exactly like in a spreadsheet.
          </ShortcutRow>
          <ShortcutRow keys={["←", "→"]}>
            Inside a text/number box, Left/Right first move the text cursor as normal. Only once the
            cursor is already at the very start of the text (←) or the very end (→) does pressing the
            arrow again jump to the previous/next field — so short values (blood group, bag number, etc.)
            can be tabbed through with two taps of the arrow key without ever leaving the keyboard's home
            row. On a dropdown, Left/Right always jumps straight to the previous/next field and
            intentionally does <em>not</em> cycle the dropdown's own value (browsers do this by default,
            and it was disabled here because it too easily changes a blood-group/component dropdown by
            accident while tabbing through). Inside a batch grid, Left/Right instead move across columns
            in the same row.
          </ShortcutRow>
        </div>

        <SubHeading>Repeatable sections (Ctrl+G / Ctrl+B)</SubHeading>
        <p className="text-sm text-gray-600 mb-2">
          Some forms are built from repeatable blocks — for example, Bulk Transfer and Send-to-Storage on
          the{" "}
          <Link to="/inventory/issue" className="text-red-800 font-medium hover:underline">Inventory → Issue</Link>{" "}
          page, where each block is one blood group/component and holds a list of bag rows underneath it.
        </p>
        <div className="divide-y divide-gray-100">
          <ShortcutRow keys={["Ctrl", "G"]}>
            Adds a brand-new section to the form (e.g. a new blood-group/component block). Works from
            anywhere inside the form, not just inside an existing section.
          </ShortcutRow>
          <ShortcutRow keys={["Ctrl", "B"]}>
            Adds a new item/row (e.g. one more bag) inside whichever section your cursor was last focused
            in. If you press it before focusing any field yet (e.g. right after opening the modal), it
            falls back to the last section in the list.
          </ShortcutRow>
        </div>
        <Note>
          These two shortcuts only work while your cursor is somewhere inside that form's container —
          click or Tab into any field first. They will not fire if focus is outside the modal/panel.
        </Note>

        <SubHeading>Batch data-entry grids</SubHeading>
        <p className="text-sm text-gray-600">
          Batch Component Separation and Batch TTD Testing use an Excel-style grid: Up/Down/Left/Right
          move between cells (row/column), and Enter moves to the next column, wrapping around to the
          first column of the next row when it reaches the end of a row — so you can fill in an entire
          batch of bags top-to-bottom, left-to-right, using only the keyboard.
        </p>
      </div>
    ),
  },
  {
    id: "requisition",
    icon: FileText,
    title: "Creating a Requisition",
    links: [
      { to: "/requisition", label: "Requisition Workflow" },
      { to: "/requisition/list", label: "Requisition List" },
      { to: "/hospital/add", label: "Add Hospital" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          A requisition is the full lifecycle of a hospital's blood request — from raising it, through
          matching and crossmatch, to approval, issue, and finally marking it complete. Open{" "}
          <Link to="/requisition" className="text-red-800 font-medium hover:underline">Requisition → Requisition Workflow</Link>{" "}
          to start; it is a 4-step wizard.
        </p>
        <StepList
          steps={[
            {
              title: "Step 1 — Request Details",
              text: "Pick the requesting hospital from the dropdown, or click Add Hospital to register a new one on the spot without leaving the page.",
              fields: [
                "Hospital and treating doctor's name",
                "Patient details: name, address, age & unit (years/days), sex, MRN, diagnosis, Hb, indication/indication category",
                "Transfusion history: previous transfusions, approximate date, any reaction",
                "Pregnancy history (if applicable): number of pregnancies, miscarriages, children with haemolytic disease",
                "Requested components: one row per component type, with blood group, Rh, and units needed — add as many rows as required",
              ],
            },
            {
              title: "Step 2 — Match Review",
              text: "Click Match to let the system propose bags from inventory against every requested component. Review any shortages shown, then work through each proposed bag: perform the crossmatch, confirm compatibility, and confirm the recipient's ABO/Rh grouping. A banner flags any PRBC bag matched on a compatible (non-exact) substitute group so you can review it before proceeding. You can reject an individual bag or an entire component from here if it isn't usable, with a reason recorded either way.",
            },
            {
              title: "Step 3 — Approve & Issue",
              text: "You cannot continue until every proposed bag's crossmatch and grouping are complete — the wizard shows exactly what's missing. Once complete, Approve the request (medical officer step, logged), then Issue the approved units to the hospital. Units can be issued component-by-component.",
            },
            {
              title: "Step 4 — Complete",
              text: "After the hospital confirms receipt/transfusion, review the patient & requisition summary and click Complete Request to close it out.",
            },
          ]}
        />
        <Warn>
          RBC issue always requires a passing crossmatch. A medical-officer override is possible but is
          logged — it is not a way to skip the check silently.
        </Warn>
      </div>
    ),
  },
  {
    id: "donor-inhouse",
    icon: UserPlus,
    title: "In-house Donor Creation",
    links: [
      { to: "/master-register/donor-creation", label: "Donor Creation" },
      { to: "/master-register/donors", label: "All Donors" },
      { to: "/master-register/donations", label: "All Donations" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Open{" "}
          <Link to="/master-register/donor-creation" className="text-red-800 font-medium hover:underline">
            Master Register → Donor Creation
          </Link>
          . This is a 6-step wizard covering registration, medical screening, examination, bag/collection
          details, QA, and final review.
        </p>
        <StepList
          steps={[
            {
              title: "Step 1 — Donor Profile",
              text: "First choose whether this is a Repeated Donation (an existing donor giving again) or a new donor. For a repeated donation, search by name/phone/UID and select the matching donor to auto-fill their profile; for a new donor, fill the form from scratch.",
              fields: ["Name, date of birth, sex, contact number, address (with state dropdown)", "UID and any prior donation history fields shown once a donor is selected"],
            },
            {
              title: "Step 2 — Medical History",
              text: "Answer every screening question with Yes/No. Any answer that indicates an unhealthy condition automatically marks the donor unfit and pre-fills the deferral reason — you don't set that manually.",
            },
            {
              title: "Step 3 — Exam & Fitness",
              text: "Record vitals and the fitness decision.",
              fields: ["Blood Pressure (e.g. 120/80)", "Haemoglobin (Hb gm%) — must be at least 12.5 gm% or the form flags it", "Weight and other exam fields, plus the final fit/unfit decision"],
            },
            {
              title: "Step 4 — Bag Info (only if the donor is fit)",
              text: "If the donor was marked unfit at Step 2 or 3, the wizard skips straight to submission — there is no bag/collection step for a deferred donor.",
              fields: ["Bag Type — Double Bag (DB) or Triple Bag (TB)", "Batch Number — chosen from currently active/opened batches for that bag type (loads only after Bag Type is picked)", "Bag Number and other collection details"],
            },
            {
              title: "Step 5 — QA Checklist",
              text: "Tick off the three quality checks before the donation can be finalised.",
              fields: ["Empty bag examined for cracks, leakage, and expiry", "Blood collected within standard time limits (3–5 minutes)", "Double-check verification performed matching bag label and profile details"],
            },
            {
              title: "Step 6 — Review",
              text: "Review the full donor + donation record end-to-end, then submit to create it.",
            },
          ]}
        />
        <Note>
          You can save a draft at any step and come back to it later — the in-progress form is kept via a
          draft link, so you don't lose data if you need to stop mid-entry. This wizard is also reused for
          camp-linked donor creation (opened with a camp ID in the URL from the Camp Donation screens).
        </Note>
      </div>
    ),
  },
  {
    id: "camp-donation",
    icon: Droplets,
    title: "Camp Donation Creation",
    links: [
      { to: "/camp-donation", label: "Camp Donation Management" },
      { to: "/camp-listing", label: "Camp Listing" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Open{" "}
          <Link to="/camp-donation" className="text-red-800 font-medium hover:underline">Camp → Camp Donations</Link>
          , select the relevant camp, and click <span className="font-semibold">Add Donation</span> (the
          Plus button) to open the donation form for that camp.
        </p>
        <StepList
          steps={[
            { title: "Donor identity", text: "First name, middle name, last name, UID (must be exactly 12 digits), date of birth, sex." },
            { title: "Contact & address", text: "Phone (exactly 10 digits), email, address line 1/2, city, district, state (dropdown of all Indian states), pincode." },
            { title: "Donation details", text: "Occupation, weight (kg, must be greater than 0), blood group + Rh, eligibility status, and last donation date (if a repeat donor)." },
            { text: "Save to register the donation against that camp — it then appears in the camp's donation list and in the combined All Donations register." },
          ]}
        />
        <Note>
          Camp Donation Management also has its own filter bar (search, bag type, blood group, status,
          date range) and a sort toggle, plus an Excel export button, above the donation table.
        </Note>
      </div>
    ),
  },
  {
    id: "camp-create",
    icon: Tent,
    title: "Creating a Camp",
    links: [
      { to: "/camp-registration", label: "Camp Registration" },
      { to: "/camp-listing", label: "Camp Listing" },
      { to: "/camp-donors", label: "Camp Donors" },
      { to: "/camp-reports", label: "Camp Reports" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Open{" "}
          <Link to="/camp-registration" className="text-red-800 font-medium hover:underline">Camp → Camp Registration</Link>
          . This is a 3-step wizard.
        </p>
        <StepList
          steps={[
            { title: "Step 1 — Site & Name", text: "Enter the Site ID (auto-uppercased as you type) and the Camp Name." },
            { title: "Step 2 — Address & Contact", text: "Enter the camp address, a 10-digit contact phone number, and an optional email address (validated if entered)." },
            { title: "Step 3 — Dates & Volunteers", text: "Set the camp's start date and end date — the end date cannot be earlier than the start date. Add volunteer/staff names one at a time (duplicates are rejected with a toast) before submitting to create the camp." },
          ]}
        />
        <Note>
          Once created, the camp shows up in Camp Listing; from there you can open Camp Details to manage
          its donors and donations, or view Camp Reports for its performance/collection outcomes.
        </Note>
      </div>
    ),
  },
  {
    id: "component",
    icon: Droplets,
    title: "Component Separation",
    links: [
      { to: "/component/separate", label: "Separate Components" },
      { to: "/component/list", label: "Components List" },
      { to: "/component/near-expiry", label: "Component Near-Expiry" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Open{" "}
          <Link to="/component/separate" className="text-red-800 font-medium hover:underline">Component → Separate Components</Link>
          . Whole Blood bags (DB/TB) can be separated into PRBC, FFP, RDP (platelets) and CRYO; SDP
          (apheresis) bags are already a single separated product and are only ever separated as SDP.
          Each bag shows only the component types it hasn't already produced.
        </p>

        <SubHeading>Normal — single bag</SubHeading>
        <StepList
          steps={[
            { text: "Click a bag in the worklist to open its separation form." },
            { text: "Choose the component type, then fill in Volume (mL), first-spin RPM, second-spin RPM, and Separation Time." },
            { text: "Repeat within the same modal for every other component type that bag yields." },
            { text: "Click Mark as Complete on the bag once every component is entered, then confirm with your signature in the signature dialog that pops up." },
          ]}
        />

        <SubHeading>Batch mode</SubHeading>
        <StepList
          steps={[
            { text: 'Turn on the "Multiple Separate" switch above the worklist.' },
            { text: "Pick the bag type to batch (the dropdown that appears next to the switch), then select multiple bags — selected bags move out of the plain list into the batch queue panel." },
            { text: "Enter component type / volume / RPM (1st & 2nd spin) / separation time for each bag directly in the batch panel — the grid supports the same Up/Down/Left/Right/Enter navigation described in Website Controls." },
            { text: "Confirm the entire batch at once with a single signature, instead of signing off bag by bag." },
          ]}
        />
        <Note>
          Use the pencil/Edit action on an already-separated bag to correct its recorded components or
          RPM values after the fact. The worklist can be sorted Newest First, Oldest First, or Ascending
          by Bag No via the sort dropdown, and refreshed with the circular-arrow button.
        </Note>
      </div>
    ),
  },
  {
    id: "ttd",
    icon: TestTube,
    title: "TTD Testing (Serology)",
    links: [
      { to: "/labs/ttd", label: "TTD Testing" },
      { to: "/labs/ttd-testing", label: "TTD Testing Results" },
    ],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Open{" "}
          <Link to="/labs/ttd" className="text-red-800 font-medium hover:underline">Labs → TTD Testing</Link>
          . Every collected bag is tested for HIV, HBsAg, HCV, VDRL and Malaria (MP) before its units can
          leave quarantine — a unit cannot reach Released status without a released TTD result.
        </p>

        <SubHeading>Worklist tabs</SubHeading>
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-semibold text-gray-800">Pending</span> — untested bags; this is the only
          tab eligible for Batch Test entry.{" "}
          <span className="font-semibold text-gray-800">Shadeness — Retest Needed</span> — bags held with
          an indeterminate result, awaiting a single-bag retest.{" "}
          <span className="font-semibold text-gray-800">Pending-Retest</span> — bags held for retest for
          another recorded reason.
        </p>

        <SubHeading>Normal — single bag</SubHeading>
        <StepList
          steps={[
            { text: "Click a bag to open its test entry form." },
            { text: "Enter a result for HIV, HBsAg, HCV, VDRL, and MP (Malaria), plus the test date and time." },
            { text: "Click Save Results. Correcting a bag that's already in Shadeness or Pending-Retest status requires typing an edit reason — this is enforced, not optional." },
          ]}
        />

        <SubHeading>Batch mode</SubHeading>
        <StepList
          steps={[
            { text: 'Turn on the "Batch Test" switch (only visible on the Pending tab) and select multiple bags to queue them.' },
            { text: "Enter results for every queued bag in the batch panel." },
            { text: "Confirm the whole batch with one signature." },
          ]}
        />
        <Note>
          The worklist has its own filter bar: search by Bag No, a From/To date range, and a sort
          dropdown, plus a Refresh button. Finalised results can be reviewed separately on{" "}
          <Link to="/labs/ttd-testing" className="text-red-800 font-medium hover:underline">TTD Testing Results</Link>.
        </Note>
      </div>
    ),
  },
  {
    id: "reports",
    icon: CalendarRange,
    title: "Monthly Report & Yearly Report",
    links: [
      { to: "/reports/monthly", label: "Monthly Report" },
      { to: "/reports/yearly", label: "Yearly Report" },
    ],
    body: (
      <div className="space-y-4 text-sm text-gray-600">
        <div>
          <SubHeading>Monthly Report</SubHeading>
          <p>
            Open{" "}
            <Link to="/reports/monthly" className="text-red-800 font-medium hover:underline">Reports → Monthly Report</Link>
            . Pick a Month and Year from the two dropdowns at the top (it defaults to last month). The
            page then loads these sections for that period: Collection, Donor Stats, Testing & Stock,
            Issued/Discarded, Indication, Chemical Stock, Camp-wise, and Data Notes. Use the circular
            Refresh button to re-fetch the latest data for the selected period, and Print (top-right) to
            print or save the report as a PDF via the browser's print dialog.
          </p>
        </div>
        <div>
          <SubHeading>Yearly Report</SubHeading>
          <p>
            Open{" "}
            <Link to="/reports/yearly" className="text-red-800 font-medium hover:underline">Reports → Yearly Report</Link>
            . Pick a Year from the dropdown (the current year plus the last 4 years are available). The
            same set of sections loads, aggregated for the full year, with the same Refresh and Print
            actions.
          </p>
        </div>
        <Note>
          Both reports read live from the database for the selected period — there's nothing to manually
          "create"; simply choose the period and the report generates itself.
        </Note>
      </div>
    ),
  },
  {
    id: "filters",
    icon: Filter,
    title: "Filters on List Pages",
    links: [
      { to: "/master-register/donors", label: "All Donors" },
      { to: "/component/list", label: "Components List" },
      { to: "/inventory/stock", label: "Inventory Stock" },
    ],
    body: (
      <div className="text-sm text-gray-600 space-y-2">
        <p>
          Every register/list page in the system — Donors, Donations, Camp Donors, Camp Donations,
          Components, Inventory Stock/Reserve/Issue, Requisitions, Discards, and every MIS report page —
          has a filter bar directly above its table. It typically includes:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>A search box (by name, bag number, UID, or ID depending on the page)</li>
          <li>A From/To date range</li>
          <li>Dropdowns for status, blood group, component type, or bag type where relevant to that page</li>
          <li>A sort control (e.g. Newest First / Oldest First / Ascending by Bag No)</li>
          <li>A Refresh button to re-fetch, and on several pages an Excel export button</li>
        </ul>
        <p>
          Use the filter bar to narrow the table down to the records you need instead of scrolling
          through the full list — filters apply immediately or on pressing Search/Enter depending on the
          field.
        </p>
      </div>
    ),
  },
];

export default function SoftwareGuide() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <BookOpen className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Software Guide</h1>
            <p className="text-gray-500 text-sm">
              How to use the keyboard controls and step through each workflow in this system — with
              direct links to every page mentioned.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Accordion type="multiple" defaultValue={["controls"]}>
              {SECTIONS.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2 text-base">
                      <section.icon className="w-4 h-4 text-red-800" />
                      {section.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {section.links && <PageLinks links={section.links} />}
                    {section.body}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
