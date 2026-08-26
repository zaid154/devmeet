import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { useAdmin } from '../context/AdminContext';
import { BASE_URL } from '../../utils/constants';

const AdminMediaCMS = () => {
  const { isSuperAdmin } = useAdmin();
  const [mediaList, setMediaList] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    restrictedCount: 0,
    totalStorageMB: '0.00'
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Form States
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadEntityType, setUploadEntityType] = useState('cms');
  const [uploadTags, setUploadTags] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchMedia(1);
    fetchStats();
  }, [entityFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/media/stats`, { withCredentials: true });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch media stats:', e);
    }
  };

  const fetchMedia = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        entityType: entityFilter,
        status: statusFilter
      });

      const res = await axios.get(`${BASE_URL}/admin/media?${params.toString()}`, {
        withCredentials: true
      });

      if (res.data.success) {
        setMediaList(res.data.data.items || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error('Failed to fetch media list:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedia(1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setFeedbackMsg({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setActionLoading(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('entityType', uploadEntityType);
      formData.append('tags', uploadTags);

      const res = await axios.post(`${BASE_URL}/admin/media/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowUploadModal(false);
        resetUploadForm();
        fetchMedia(1);
        fetchStats();
      }
    } catch (e) {
      setFeedbackMsg({
        type: 'error',
        text: e.response?.data?.message || 'Upload failed. Please check file format and size.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedMedia) return;

    setActionLoading(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await axios.put(`${BASE_URL}/admin/media/${selectedMedia._id}/replace`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowReplaceModal(false);
        resetUploadForm();
        fetchMedia(pagination.page);
        fetchStats();
      }
    } catch (e) {
      setFeedbackMsg({
        type: 'error',
        text: e.response?.data?.message || 'Failed to replace file on Cloudinary.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedia) return;

    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/media/${selectedMedia._id}`,
        {
          title: uploadTitle,
          description: uploadDescription,
          entityType: uploadEntityType,
          tags: uploadTags
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        setShowEditModal(false);
        resetUploadForm();
        fetchMedia(pagination.page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (media) => {
    const nextStatus = media.status === 'active' ? 'restricted' : 'active';
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/media/${media._id}/status`,
        { status: nextStatus },
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchMedia(pagination.page);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedMedia) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/admin/media/${selectedMedia._id}`, {
        withCredentials: true
      });
      if (res.data.success) {
        setShowDeleteModal(false);
        setSelectedMedia(null);
        fetchMedia(pagination.page);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setPreviewUrl('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadEntityType('cms');
    setUploadTags('');
    setSelectedMedia(null);
    setFeedbackMsg({ type: '', text: '' });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openReplaceModal = (media) => {
    setSelectedMedia(media);
    setPreviewUrl(media.secure_url);
    setShowReplaceModal(true);
  };

  const openEditModal = (media) => {
    setSelectedMedia(media);
    setUploadTitle(media.title || '');
    setUploadDescription(media.description || '');
    setUploadEntityType(media.entityType || 'cms');
    setUploadTags(Array.isArray(media.tags) ? media.tags.join(', ') : '');
    setShowEditModal(true);
  };

  const openDeleteModal = (media) => {
    setSelectedMedia(media);
    setShowDeleteModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🖼️</span> Media CMS & Cloudinary Manager
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Secure backend-managed media pipeline. Upload, replace, restrict, and delete Cloudinary assets.
            </p>
          </div>
          <button
            onClick={() => {
              resetUploadForm();
              setShowUploadModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
          >
            <span>➕</span> Upload New Media
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assets</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalCount}</p>
            <p className="text-xs text-slate-500 mt-1">Registered in Cloudinary</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Media</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.activeCount}</p>
            <p className="text-xs text-slate-500 mt-1">Visible across platform</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Restricted Media</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.restrictedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Hidden / Moderated</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Storage Consumed</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-2">{stats.totalStorageMB} <span className="text-sm font-semibold text-slate-400">MB</span></p>
            <p className="text-xs text-slate-500 mt-1">Portfolio-CMS folder</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search by title, publicId, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="all">All Types</option>
              <option value="cms">CMS Assets</option>
              <option value="profile">Profile Photos</option>
              <option value="gallery">Gallery Photos</option>
              <option value="portfolio">Portfolio</option>
              <option value="project">Projects</option>
              <option value="chat">Chat Attachments</option>
              <option value="announcement">Announcements</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="restricted">Restricted</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ☰ Table
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid / Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500 mt-4">Loading Cloudinary Assets...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <span className="text-5xl">📁</span>
            <h3 className="text-lg font-bold text-slate-900 mt-4">No Media Assets Found</h3>
            <p className="text-sm text-slate-500 mt-1">Upload an asset or adjust your filters.</p>
            <button
              onClick={() => {
                resetUploadForm();
                setShowUploadModal(true);
              }}
              className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Upload First Asset
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {mediaList.map((item) => (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border ${
                  item.status === 'restricted' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                } overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}
              >
                {/* Media Preview Container */}
                <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                  {item.resourceType === 'video' ? (
                    <video
                      src={item.secure_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={item.secure_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-black/60 text-white backdrop-blur-xs">
                      {item.entityType}
                    </span>
                    {item.status === 'restricted' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500 text-white shadow-xs">
                        Restricted
                      </span>
                    )}
                  </div>

                  {/* Size badge */}
                  <div className="absolute bottom-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-black/60 text-white backdrop-blur-xs">
                      {(item.bytes / 1024).toFixed(0)} KB {item.width > 0 && `• ${item.width}x${item.height}`}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm truncate" title={item.title}>
                      {item.title || 'Untitled Asset'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono truncate mt-0.5" title={item.publicId}>
                      {item.publicId}
                    </p>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <button
                      onClick={() => copyToClipboard(item.secure_url, item._id)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                      title="Copy Public URL"
                    >
                      {copiedId === item._id ? '✅' : '📋'}
                    </button>
                    <button
                      onClick={() => openReplaceModal(item)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-all font-medium flex items-center gap-1"
                      title="Replace file on Cloudinary"
                    >
                      <span>🔄</span> Replace
                    </button>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`p-1.5 rounded-lg transition-all font-medium ${
                        item.status === 'active'
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={item.status === 'active' ? 'Restrict' : 'Restore'}
                    >
                      {item.status === 'active' ? '🔒' : '🔓'}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                      title="Edit metadata"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-all"
                      title="Delete asset"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Preview</th>
                    <th className="py-3 px-4">Title / Public ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size & Dimensions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mediaList.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-all">
                      <td className="py-3 px-4">
                        <img
                          src={item.secure_url}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="truncate max-w-[200px]">{item.title}</div>
                        <div className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{item.publicId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 uppercase">
                          {item.entityType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {(item.bytes / 1024).toFixed(1)} KB
                        {item.width > 0 && <span className="block text-[10px] text-slate-400">{item.width}x{item.height}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyToClipboard(item.secure_url, item._id)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded"
                            title="Copy URL"
                          >
                            {copiedId === item._id ? '✅' : '📋'}
                          </button>
                          <button
                            onClick={() => openReplaceModal(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Replace File"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            title="Toggle Status"
                          >
                            {item.status === 'active' ? '🔒' : '🔓'}
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-sm">
            <p className="text-slate-500">
              Showing Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchMedia(pagination.page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchMedia(pagination.page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: UPLOAD NEW MEDIA */}
        {/* ========================================================================= */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Upload Media to Cloudinary</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {feedbackMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    feedbackMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Media File (Images / Videos)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50 relative">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                        <p className="text-xs text-slate-500 font-medium">{uploadFile?.name}</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <span className="text-3xl">📤</span>
                        <p className="text-sm font-semibold text-slate-700">Click or Drag file to upload</p>
                        <p className="text-xs text-slate-400">JPG, PNG, WEBP, GIF, MP4 (Max 50MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Asset Title
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Hero Banner, Project Preview"
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Entity Type & Tags */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Entity Category
                    </label>
                    <select
                      value={uploadEntityType}
                      onChange={(e) => setUploadEntityType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                    >
                      <option value="cms">CMS Asset</option>
                      <option value="portfolio">Portfolio</option>
                      <option value="project">Project</option>
                      <option value="gallery">Gallery</option>
                      <option value="profile">Profile</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="design, hero, dark"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Provide notes or context for this asset..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !uploadFile}
                    className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Uploading to Cloudinary...' : 'Upload Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: REPLACE ASSET ATOMICALLY */}
        {/* ========================================================================= */}
        {showReplaceModal && selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Replace Asset on Cloudinary</h3>
                <button
                  onClick={() => setShowReplaceModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Uploading a new file will automatically replace <strong className="text-slate-800">{selectedMedia.title}</strong> and destroy the old asset on Cloudinary.
              </p>

              {feedbackMsg.text && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {feedbackMsg.text}
                </div>
              )}

              <form onSubmit={handleReplaceSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50 relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Replacement" className="max-h-40 mx-auto rounded-xl object-contain" />
                  ) : (
                    <div className="py-3">
                      <span className="text-3xl">🔄</span>
                      <p className="text-sm font-semibold text-slate-700 mt-1">Select Replacement File</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReplaceModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !uploadFile}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Replacing on Cloudinary...' : 'Confirm Replace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: EDIT METADATA */}
        {/* ========================================================================= */}
        {showEditModal && selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Edit Asset Metadata</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={uploadEntityType}
                    onChange={(e) => setUploadEntityType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="cms">CMS Asset</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="project">Project</option>
                    <option value="gallery">Gallery</option>
                    <option value="profile">Profile</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tags</label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: DELETE CONFIRMATION */}
        {/* ========================================================================= */}
        {showDeleteModal && selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Asset Permanently?</h3>
              <p className="text-xs text-slate-500">
                This will destroy <strong className="text-slate-800">{selectedMedia.title}</strong> directly from Cloudinary and remove its metadata. This cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteSubmit}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminMediaCMS;
