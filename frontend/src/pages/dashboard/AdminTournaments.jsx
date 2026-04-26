import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { HiFlag, HiTrash, HiSearch } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchTournaments = async () => {
    try {
      const data = await api.get('/admin/tournaments');
      setTournaments(data.tournaments);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleDeleteTournament = async (id, title) => {
    if (!window.confirm(`⚠️ DESTRUCTIVE ACTION\n\nAre you sure you want to permanently delete tournament "${title}"?\n\nThis will remove:\n• All registrations\n• All groups, stages & slots\n• All results & disputes\n• All chat messages\n\nThis CANNOT be undone.`)) {
      return;
    }

    try {
      setDeleting(id);
      await api.delete(`/admin/tournaments/${id}`);
      toast.success(`Tournament "${title}" has been deleted`);
      fetchTournaments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete tournament');
    } finally {
      setDeleting(null);
    }
  };

  const statusColors = {
    draft: 'neutral',
    published: 'info',
    registrations_open: 'success',
    ongoing: 'warning',
    completed: 'neutral',
    cancelled: 'danger'
  };

  const filtered = tournaments.filter(t => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.organizer?.username?.toLowerCase().includes(s) ||
      t.organizer?.organizerProfile?.displayName?.toLowerCase().includes(s) ||
      t.shortCode?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  });

  if (loading) return <DashboardLayout><div className="flex justify-center p-12"><Loader /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col min-h-[80vh]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <HiFlag className="text-neon-cyan" /> Tournament Management
            </h1>
            <p className="text-dark-400">Global overview and control of all tournaments on the platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-dark-400">Total: <span className="text-neon-cyan font-bold">{tournaments.length}</span></div>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tournaments..."
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
                  <th className="p-4">Tournament</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Type & Format</th>
                  <th className="p-4">Teams</th>
                  <th className="p-4">Prize Pool</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(tournament => (
                  <tr key={tournament._id} className="hover:bg-dark-850/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <Link to={`/tournaments/${tournament._id}`} className="text-white font-medium hover:text-neon-cyan transition-colors">
                          {tournament.title}
                        </Link>
                        <p className="text-xs text-dark-400 mt-1 flex items-center gap-2">
                          {tournament.game} • {tournament.shortCode}
                          {tournament.visibility === 'Private' && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-bold">PRIVATE</span>}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {tournament.organizer ? (
                        <div className="flex items-center space-x-2">
                          <Link to={`/organizer/${tournament.organizer.organizerProfile?.slug || tournament.organizer._id}`} className="text-sm font-medium hover:underline text-dark-200">
                            {tournament.organizer.organizerProfile?.displayName || tournament.organizer.username}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-dark-500 italic">Unknown</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-dark-300">
                      {tournament.tournamentType || 'Custom'} <br />
                      <span className="text-dark-500 text-xs">{tournament.format?.toUpperCase()} • {tournament.mode?.toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">{tournament.registrationCount || 0}</span>
                      <span className="text-dark-500">/{tournament.participation?.maxTeams || '∞'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-neon-cyan font-medium">₹{tournament.finance?.totalPrizePool || 0}</span>
                      {tournament.finance?.entryFee > 0 && (
                        <p className="text-xs text-dark-500 mt-0.5">Entry: ₹{tournament.finance.entryFee}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[tournament.status] || 'neutral'}>
                        {tournament.status?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleDeleteTournament(tournament._id, tournament.title)} 
                        disabled={deleting === tournament._id}
                        className="btn-ghost py-1.5 px-3 text-xs inline-flex items-center gap-1 text-red-400 hover:bg-red-400/10 hover:border-red-400/20 disabled:opacity-50"
                      >
                        <HiTrash className="text-sm" /> {deleting === tournament._id ? 'Deleting...' : 'Terminate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-dark-500">
                      {search ? 'No tournaments match your search.' : 'No tournaments have been created yet.'}
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

export default AdminTournaments;
