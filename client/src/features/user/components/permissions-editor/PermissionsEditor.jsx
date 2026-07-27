import { ACCESS_MODULES } from '@/config/access-registry';
import ModuleRow from './ModuleRow';

// Replaces the old flat ModuleArray checkbox table: one expandable row per
// module, each either granting one permission level to every page under
// it, or switched to per-page permissions for individual control.
export default function PermissionsEditor({ draft, onChange }) {
  const updateModule = (moduleId, state) => {
    onChange({ ...draft, [moduleId]: state });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {ACCESS_MODULES.map((module) => (
        <ModuleRow
          key={module.id}
          module={module}
          state={draft[module.id]}
          onChange={(state) => updateModule(module.id, state)}
        />
      ))}
    </div>
  );
}
