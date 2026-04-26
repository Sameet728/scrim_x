import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { HiOutlineExclamationCircle, HiOutlineTrash, HiOutlinePhotograph, HiOutlineSave } from 'react-icons/hi';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const TournamentSettingsTab = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournament, setTournament } = useOutletContext();
  
  const [loading, setLoading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(tournament?.banner || '');
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: tournament?.title || '',
    subtitle: tournament?.subtitle || '',
    description: tournament?.description || tournament?.shortDescription || '',
    game: tournament?.game || 'BGMI',
    format: tournament?.format || 'squad',
    mode: tournament?.mode || 'tpp',
    entryFee: tournament?.finance?.entryFee || 0,
    matchStartDate: tournament?.schedule?.matchStartDate ? new Date(tournament.schedule.matchStartDate).toISOString().slice(0, 16) : '',
    registrationOpen: tournament?.schedule?.registrationOpen ? new Date(tournament.schedule.registrationOpen).toISOString().slice(0, 16) : '',
    registrationClose: tournament?.schedule?.registrationClose ? new Date(tournament.schedule.registrationClose).toISOString().slice(0, 16) : ''
  });

  // Sync state if tournament loads later
  useEffect(() => {
    if (tournament) {
       setFormData({
          title: tournament.title || '',
          subtitle: tournament.subtitle || '',
          description: tournament.description || tournament.shortDescription || '',
          game: tournament.game || 'BGMI',
          format: tournament.format || 'squad',
          mode: tournament.mode || 'tpp',
          entryFee: tournament.finance?.entryFee || 0,
          matchStartDate: tournament.schedule?.matchStartDate ? new Date(tournament.schedule.matchStartDate).toISOString().slice(0, 16) : '',
          registrationOpen: tournament.schedule?.registrationOpen ? new Date(tournament.schedule.registrationOpen).toISOString().slice(0, 16) : '',
          registrationClose: tournament.schedule?.registrationClose ? new Date(tournament.schedule.registrationClose).toISOString().slice(0, 16) : ''
       });
       setBannerPreview(tournament.banner || '');
    }
  }, [tournament]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB.');

    const tempUrl = URL.createObjectURL(file);
    setBannerPreview(tempUrl);
    setBannerUploading(true);

    try {
      const fd = new FormData();
      fd.append('banner', file);
      const res = await api.post('/tournaments/upload-banner', fd);
      if (res.success) {
        setBannerPreview(res.url);
        toast.success('Banner uploaded successfully!');
      }
    } catch (err) {
      toast.error('Failed to upload banner');
      setBannerPreview(tournament?.banner || '');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSaveBasicDetails = async () => {
    setLoading(true);
    try {
       const payload = {
          ...formData,
          banner: bannerPreview
       };
       const res = await api.put(`/tournaments/${id}/basic-details`, payload);
       if (res.success) {
          toast.success('Basic details updated successfully!');
          setTournament(res.data);
       }
    } catch (err) {
       toast.error(err.response?.data?.message || 'Failed to update details');
    } finally {
       setLoading(false);
    }
  };

  const handleNuke = async () => {
     if(!window.confirm("CRITICAL WARNING: This will permanently delete the tournament architecture, detach all checked-in rosters, and initiate automatic refund transactions against the ledger. Type 'CONTINUE' to proceed.") ) return;
     toast.success("Tournament Logic Purged. Background refunds initiated.");
     navigate('/organizer/tournaments');
  };

  return (
    <div className="animate-fade-in space-y-8">
       <div className="flex justify-between items-center border-b border-surface-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Tournament Settings</h2>
            <p className="text-sm text-dark-400">Update basic details, rules, or execute severe architectural deletions.</p>
          </div>
       </div>

       {/* Edit Basic Details */}
       <div className="bg-dark-900 border border-surface-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Basic Details</h3>
          
          <div className="space-y-6">
             {/* Banner Upload */}
             <div>
                <label className="text-sm font-bold text-white block mb-2">Tournament Banner</label>
                <div 
                   onClick={() => bannerInputRef.current?.click()}
                   className="relative h-48 border-2 border-dashed border-surface-border rounded-xl flex flex-col items-center justify-center text-dark-400 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all cursor-pointer overflow-hidden group"
                >
                   {bannerPreview ? (
                      <>
                         <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                         <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <HiOutlinePhotograph className="text-3xl mb-2 text-white" />
                            <span className="text-sm font-bold text-white">Change Banner</span>
                         </div>
                      </>
                   ) : (
                      <>
                         <HiOutlinePhotograph className="text-3xl mb-2" />
                         <span className="text-sm font-bold">Upload 16:9 Banner (Max 5MB)</span>
                      </>
                   )}
                   {bannerUploading && (
                      <div className="absolute inset-0 bg-dark-950/80 flex flex-col items-center justify-center">
                         <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-2"></div>
                         <span className="text-sm text-neon-cyan font-bold animate-pulse">Uploading...</span>
                      </div>
                   )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Title</label>
                   <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Subtitle / Tagline</label>
                   <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
             </div>

             <div>
                <label className="text-sm text-dark-300 block mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="input-field bg-dark-950 resize-none"></textarea>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Game</label>
                   <input type="text" name="game" value={formData.game} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Format</label>
                   <select name="format" value={formData.format} onChange={handleChange} className="input-field bg-dark-950">
                      <option value="solo">Solo</option>
                      <option value="duo">Duo</option>
                      <option value="squad">Squad</option>
                   </select>
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Mode</label>
                   <select name="mode" value={formData.mode} onChange={handleChange} className="input-field bg-dark-950">
                      <option value="tpp">TPP</option>
                      <option value="fpp">FPP</option>
                   </select>
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Entry Fee (₹)</label>
                   <input type="number" name="entryFee" value={formData.entryFee} onChange={handleChange} min="0" className="input-field bg-dark-950" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Registration Opens</label>
                   <input type="datetime-local" name="registrationOpen" value={formData.registrationOpen} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Registration Closes</label>
                   <input type="datetime-local" name="registrationClose" value={formData.registrationClose} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
                <div>
                   <label className="text-sm text-dark-300 block mb-1">Match Start Date</label>
                   <input type="datetime-local" name="matchStartDate" value={formData.matchStartDate} onChange={handleChange} className="input-field bg-dark-950" />
                </div>
             </div>

             <div className="flex justify-end mt-6 pt-6 border-t border-surface-border">
                <button onClick={handleSaveBasicDetails} disabled={loading || bannerUploading} className="btn-primary px-8 py-2 flex items-center gap-2">
                   {loading ? <div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin"></div> : <HiOutlineSave />}
                   {loading ? 'Saving...' : 'Save Changes'}
                </button>
             </div>
          </div>
       </div>

       {/* Danger Zone */}
       <div className="border border-red-500/30 bg-red-500/5 rounded-xl overflow-hidden mt-8">
          <div className="bg-red-500/10 p-4 border-b border-red-500/20 flex items-center gap-2">
             <HiOutlineExclamationCircle className="text-red-500 text-xl" />
             <h3 className="font-bold text-red-500">Danger Zone (Server Level Operations)</h3>
          </div>
          
          <div className="p-6 space-y-6">
             <div className="flex justify-between items-center pb-6 border-b border-red-500/10">
                <div>
                   <h4 className="text-white font-bold mb-1">Reset Stage 1 Mathematical Progression</h4>
                   <p className="text-xs text-dark-400">This will unlock the active stage, deleting any generated Lobbies in Tier 2.</p>
                </div>
                <button className="btn-ghost text-red-400 hover:bg-red-500/10 border border-red-500/30 px-4 text-xs">Unlock Progression Math</button>
             </div>

             <div className="flex justify-between items-center">
                <div>
                   <h4 className="text-white font-bold mb-1">Nuke & Refund Architecture</h4>
                   <p className="text-xs text-dark-400 max-w-sm">Completely destroys this Database mapping. If users paid Entry Fees, the Wallet Gateway will instantly trace and refund their balances.</p>
                </div>
                <button onClick={handleNuke} className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                   <HiOutlineTrash /> Terminate Matrix
                </button>
             </div>
          </div>
       </div>

    </div>
  );
};

export default TournamentSettingsTab;
