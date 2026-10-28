import { useEffect, useState } from 'react';
import { listCmsSections, seedCmsHome, updateCmsSection, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { useAuth } from '../auth/AuthContext';
export default function CmsPage() {
    return (<RequirePermission permission="cms:read">
      <CmsInner />
    </RequirePermission>);
}
function CmsInner() {
    const { hasPermission } = useAuth();
    const [sections, setSections] = useState([]);
    const [error, setError] = useState(null);
    const load = () => listCmsSections('home')
        .then((res) => {
        const data = res.data;
        setSections(data.sections || res.data || []);
    })
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load CMS'));
    useEffect(() => {
        load();
    }, []);
    async function toggle(s) {
        if (!hasPermission('cms:write'))
            return;
        const next = s.status === 'published' ? 'draft' : 'published';
        try {
            await updateCmsSection(s.id, { status: next });
            await load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Update failed');
        }
    }
    async function seed() {
        if (!hasPermission('cms:write'))
            return;
        try {
            await seedCmsHome();
            await load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Seed failed');
        }
    }
    return (<div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">CMS — Home</h1>
        {hasPermission('cms:write') && (<button type="button" onClick={seed} className="text-sm px-3 py-1.5 border border-stone-300 rounded-lg bg-white">
            Seed default home
          </button>)}
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="space-y-2">
        {sections.map((s) => (<div key={s.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{s.title || s.type || s.section_type || `Section #${s.id}`}</p>
              <p className="text-xs text-stone-400">
                {s.section_type || s.type} · {s.status}
              </p>
            </div>
            {hasPermission('cms:write') && (<button type="button" onClick={() => toggle(s)} className="text-xs underline text-stone-600">
                {s.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>)}
          </div>))}
        {!sections.length && <p className="text-stone-400 text-sm">No sections — try seed.</p>}
      </div>
    </div>);
}
