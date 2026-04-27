import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { HiLightningBolt, HiTrash, HiSearch, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const AdminScrims = () => {
  const [scrims, setScrims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchScrims = async () => {
    try {
      const data = await api.get('/admin/scrims');
      setScrims(data.scrims);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch scrims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrims();
  }, []);

  // Clear selection whenever search changes
  useEffect(() => { setSelected([]); }, [search]);

  const handleDeleteScrim = async (id, title) => {
    if (!window.confirm(`⚠️ DESTRUCTIVE ACTION\n\nAre you sure you want to permanently delete scrim "${title}"?\n\nThis will remove the scrim and all associated registrations, results, and chat messages.\n\nThis CANNOT be undone.`)) {
      return;
    }
    try {
      setDeleting(id);
      await api.delete(`/admin/scrims/${id}`);
      toast.success(`Scrim "${title}" has been deleted`);
      fetchScrims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete scrim');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`⚠️ BULK DESTRUCTIVE ACTION\n\nYou are about to permanently delete ${selected.length} scrim(s) and ALL their associated data (registrations, chats, results).\n\nThis CANNOT be undone. Proceed?`)) return;

    try {
      setBulkDeleting(true);
      const res = await api.delete('/admin/scrims/bulk', { data: { ids: selected } });
      toast.success(res.message || `${selected.length} scrim(s) deleted successfully.`);
      setSelected([]);
      fetchScrims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const statusColors = {
    open: 'success',
    registrations_open: 'success',
    ongoing: 'warning',
    live: 'warning',
    completed: 'neutral',
    cancelled: 'danger',
    full: 'info'
  };

  const filtered = scrims.filter(scrim => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      scrim.title?.toLowerCase().includes(s) ||
      scrim.organizer?.username?.toLowerCase().includes(s) ||
      scrim.organizer?.organizerProfile?.displayName?.toLowerCase().includes(s) ||
      scrim.status?.toLowerCase().includes(s)
    );
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.includes(s._id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => prev.filter(id => !filtered.find(s => s._id === id)));
    } else {
      const newIds = filtered.map(s => s._id).filter(id => !selected.includes(id));
      setSelected(prev => [...prev, ...newIds]);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading) return <DashboardLayout><div className="flex justify-center p-12"><Loader /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col min-h-[80vh]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <HiLightningBolt className="text-neon-cyan" /> Scrim Management
            </h1>
            <p className="text-dark-400">Global overview and control of all scrims on the platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-dark-400">Total: <span className="text-neon-cyan font-bold">{scrims.length}</span></div>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scrims..."
                className="input-field pl-9 py-2 text-sm w-56"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <HiCheckCircle className="text-red-400 text-xl" />
              <span className="text-white font-semibold text-sm">
                <span className="text-red-400 font-bold">{selected.length}</span> scrim{selected.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected([])}
                className="btn-ghost text-xs text-dark-300 flex items-center gap-1"
              >
                <HiXCircle /> Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
              >
                {bulkDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                ) : (
                  <><HiTrash /> Delete {selected.length} Selected</>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-dark-900 border-b border-surface-border text-xs text-dark-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-surface-border bg-dark-800 accent-neon-cyan cursor-pointer"
                      title="Select all visible"
                    />
                  </th>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Date &amp; Time</th>
                  <th className="p-4">Prize Pool</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(scrim => (
                  <tr
                    key={scrim._id}
                    className={`hover:bg-dark-850/50 transition-colors ${selected.includes(scrim._id) ? 'bg-red-500/5 border-l-2 border-red-500/50' : ''}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(scrim._id)}
                        onChange={() => toggleSelect(scrim._id)}
                        className="w-4 h-4 rounded border-surface-border bg-dark-800 accent-neon-cyan cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link to={`/scrims/${scrim._id}`} className="text-white font-medium hover:text-neon-cyan transition-colors">
                          {scrim.title}
                        </Link>
                        <p className="text-xs text-dark-400 mt-1 flex items-center gap-2">
                          {scrim.game} • {scrim.format} • {scrim.slots?.enrolled || 0}/{scrim.slots?.total || scrim.slotCount || 0} Teams
                          {scrim.isElite && <span className="px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 text-[10px] font-bold">PRO</span>}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {scrim.organizer ? (
                        <div className="flex items-center space-x-2">
                          <Link to={`/organizer/${scrim.organizer.organizerProfile?.slug || scrim.organizer._id}`} className="text-sm font-medium hover:underline text-dark-200">
                            {scrim.organizer.organizerProfile?.displayName || scrim.organizer.username}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-dark-500 italic">Unknown</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-dark-300">
                      {scrim.schedule?.date ? new Date(scrim.schedule.date).toLocaleDateString() : scrim.date ? new Date(scrim.date).toLocaleDateString() : 'N/A'} <br />
                      <span className="text-dark-500 text-xs">{scrim.schedule?.time || scrim.startTime || ''}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-neon-cyan font-medium">₹{scrim.prizePool?.total || scrim.prizePool || 0}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[scrim.status] || 'neutral'}>
                        {scrim.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteScrim(scrim._id, scrim.title)}
                        disabled={deleting === scrim._id}
                        className="btn-ghost py-1.5 px-3 text-xs inline-flex items-center gap-1 text-red-400 hover:bg-red-400/10 hover:border-red-400/20 disabled:opacity-50"
                      >
                        <HiTrash className="text-sm" /> {deleting === scrim._id ? 'Deleting...' : 'Terminate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-dark-500">
                      {search ? 'No scrims match your search.' : 'No scrims have been hosted yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminScrims;
