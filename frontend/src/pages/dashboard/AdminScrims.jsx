import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { HiLightningBolt, HiTrash, HiSearch } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const AdminScrims = () => {
  const [scrims, setScrims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

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

        <div className="card p-0 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-dark-900 border-b border-surface-border text-xs text-dark-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Prize Pool</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(scrim => (
                  <tr key={scrim._id} className="hover:bg-dark-850/50 transition-colors">
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
                    <td colSpan="6" className="p-12 text-center text-dark-500">
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
