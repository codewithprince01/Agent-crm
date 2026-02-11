import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import agentService from '../../services/agentService';
import externalSearchService from '../../services/externalSearchService';
import {
  Building, Globe, Check, Save, Loader2, Shield, Search, Star, ShieldAlert, ShieldCheck
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/toast';

const AgentList = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentAgent, setCurrentAgent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    company_name: '',
    company_type: '',
    city: '',
    state: '',
    country: 'India',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Access Assignment Modal State
  const [accessModal, setAccessModal] = useState({
    isOpen: false,
    agent: null
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('approved');

  const fetchAgents = async (page = 1) => {
    try {
      setLoading(true);
      const data = await agentService.getAgents({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
      });
      setAgents(data.data || []);
      setPagination({
        ...pagination,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAgents(1);
  }, [debouncedSearch, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAgents(newPage);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentAgent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
      company_type: '',
      city: '',
      state: '',
      country: 'India',
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (agent) => {
    setModalMode('edit');
    setCurrentAgent(agent);
    setFormData({
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      company_name: agent.company_name || '',
      company_type: agent.company_type || '',
      city: agent.city || '',
      state: agent.state || '',
      country: agent.country || 'India',
      status: agent.status || 'active',
      // Password is intentionally left blank for security
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAgent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
      company_type: '',
      city: '',
      state: '',
      country: 'India',
      status: 'active',
    });
    setFormError('');
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (modalMode === 'add') {
        await agentService.createAgent(formData);
        toast.success('Agent created successfully');
      } else {
        await agentService.updateAgent(currentAgent._id, formData);
        toast.success('Agent updated successfully');
      }
      closeModal();
      fetchAgents(pagination.page);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Operation failed';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await agentService.deleteAgent(deleteConfirm._id);
      toast.success(`Agent "${deleteConfirm.companyName}" deleted successfully`);
      setDeleteConfirm(null);
      fetchAgents(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete agent');
      setDeleteConfirm(null);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agents</h1>
        <button
          onClick={() => navigate('/agents/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 cursor-pointer"
        >
          Add New Agent
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search agents by name, email, company or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold text-gray-700 min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {agents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country & University</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent, index) => (
                  <tr key={agent._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {agent.firstName} {agent.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.companyName}</div>
                      <div className="text-xs text-gray-500">{agent.companyType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.email}</div>
                      <div className="text-xs text-gray-500">{agent.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.city}, {agent.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-3 p-2.5 bg-gray-50/80 border border-gray-100 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group/access min-w-[180px]">
                        <div className="flex-1 min-w-0">
                          {agent.accessibleCountries?.length > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-gray-800 truncate">
                                {agent.accessibleCountries.join(', ')}
                              </span>
                              {agent.accessibleUniversities?.length > 0 && (
                                <span className="text-[9px] text-blue-600 font-black uppercase mt-0.5">
                                  {agent.accessibleUniversities.length} Institutions
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic font-medium">Not Assigned</span>
                          )}
                        </div>
                        <button
                          onClick={() => setAccessModal({ isOpen: true, agent })}
                          className="p-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-100 shrink-0"
                          title="Edit Access"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/agents/view/${agent._id}`)}
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/agents/edit/${agent._id}`)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="Edit Agent"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(agent)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Delete Agent"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-white">
            <div className="text-gray-300 text-6xl mb-4 flex justify-center">
              <Building size={64} />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Agents Found</h3>
            <p className="text-gray-500 mb-6 font-medium">
              Start by adding your first agent to the system.
            </p>
            <button
              onClick={() => navigate('/agents/create')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
            >
              Add First Agent
            </button>
          </div>
        )}

        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{pagination.total}</span>{' '}
              results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 ${pagination.page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 cursor-pointer'
                  }`}
              >
                Previous
              </button>

              {(() => {
                const pages = [];
                const totalPages = pagination.totalPages;
                const currentPage = pagination.page;

                if (totalPages > 0) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className={`px-3 py-1 border rounded text-sm ${currentPage === 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                    >
                      1
                    </button>
                  );
                }

                if (currentPage > 3) {
                  pages.push(
                    <span key="ellipsis-1" className="px-2 py-1 text-gray-500">
                      ...
                    </span>
                  );
                }

                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-1 border rounded text-sm ${currentPage === i
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                    >
                      {i}
                    </button>
                  );
                }

                if (currentPage < totalPages - 2) {
                  pages.push(
                    <span key="ellipsis-2" className="px-2 py-1 text-gray-500">
                      ...
                    </span>
                  );
                }

                if (totalPages > 1) {
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-3 py-1 border rounded text-sm ${currentPage === totalPages
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 ${pagination.page === pagination.totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 cursor-pointer'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Add New Agent' : 'Edit Agent'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {formError}
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                </div>
              </div>

              {/* Company Information */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_type"
                      value={formData.company_type}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : modalMode === 'add' ? 'Create Agent' : 'Update Agent'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent{' '}
              <strong>{deleteConfirm?.companyName}</strong> and their associated account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Assignment Modal */}
      <AccessAssignmentModal
        isOpen={accessModal.isOpen}
        onClose={() => {
          setAccessModal({ isOpen: false, agent: null });
          fetchAgents(pagination.page);
        }}
        agent={accessModal.agent}
      />
    </div>
  );
};

const AccessAssignmentModal = ({ isOpen, onClose, agent }) => {
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('countries');
  const [univSearchTerm, setUnivSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen && agent) {
      const agentCountries = agent.accessibleCountries || [];
      setSelectedCountries(agentCountries);
      setSelectedUniversities(agent.accessibleUniversities || []);
      loadData(agentCountries);
      setActiveTab('countries');
    }
  }, [isOpen, agent]);

  const loadData = async (initialCountryCodes) => {
    try {
      setFetchLoading(true);
      const countriesData = await externalSearchService.getCountries();
      const cList = countriesData.data || countriesData || [];
      setCountries(cList);

      if (initialCountryCodes.length > 0) {
        const univPromises = initialCountryCodes.map(code =>
          externalSearchService.getUniversities({ website: code })
            .then(res => (res.data || res || []).map(u => ({ ...u, countryCode: code })))
            .catch(() => [])
        );
        const results = await Promise.all(univPromises);
        setUniversities(results.flat());
      } else {
        setUniversities([]);
      }
    } catch (err) {
      console.error('Failed to load access control data', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleToggleCountry = async (countryCode) => {
    const isSelected = selectedCountries.includes(countryCode);
    if (isSelected) {
      setSelectedCountries(prev => prev.filter(c => c !== countryCode));
      setUniversities(prev => prev.filter(u => u.countryCode !== countryCode));
    } else {
      setSelectedCountries(prev => [...prev, countryCode]);
      try {
        const res = await externalSearchService.getUniversities({ website: countryCode });
        const newUnivs = (res.data || res || []).map(u => ({ ...u, countryCode }));
        setUniversities(prev => [...prev, ...newUnivs]);
      } catch (err) {
        toast.error(`Failed to fetch universities for ${countryCode}`);
      }
    }
  };

  const handleToggleUniversity = (univId) => {
    const idStr = univId.toString();
    setSelectedUniversities(prev =>
      prev.includes(idStr)
        ? prev.filter(id => id !== idStr)
        : [...prev, idStr]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await agentService.updateAgent(agent._id, {
        accessible_countries: selectedCountries,
        accessible_universities: selectedUniversities
      });
      toast.success('Access control updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update access control');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[600px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-xl border border-gray-200 shadow-lg p-0 flex flex-col bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Access Control Center</DialogTitle>
          <DialogDescription>
            Manage global market and institutional access for {agent?.companyName}.
          </DialogDescription>
        </DialogHeader>

        {/* Compact Professional Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white min-h-[80px] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">Access Assignment</h2>
              <p className="text-[10px] text-blue-600 font-black mt-2 uppercase tracking-widest">
                Agent: {agent?.companyName || 'Agent'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="text-center px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50 min-w-[70px]">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Markets</div>
                <div className="text-sm font-bold text-gray-800 leading-none">{selectedCountries.length}</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50 min-w-[70px]">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Institutions</div>
                <div className="text-sm font-bold text-gray-800 leading-none">{selectedUniversities.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/30 px-2 shrink-0">
          <button
            onClick={() => setActiveTab('countries')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'countries'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Markets
            </div>
          </button>
          <button
            onClick={() => setActiveTab('universities')}
            disabled={selectedCountries.length === 0}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'universities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              } ${selectedCountries.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="w-3.5 h-3.5" />
              Institutions
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'countries' ? (
            <div className="h-full flex flex-col">
              <div className="px-6 py-3 bg-white/10 border-b border-gray-50 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Market Access Network</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {countries.length > 0 ? (
                  countries.map((country) => (
                    <button
                      key={country.website || country.name}
                      onClick={() => handleToggleCountry(country.website || country.name)}
                      className={`w-full group flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-200 ${selectedCountries.includes(country.website || country.name)
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm shadow-blue-100/50'
                        : 'border-gray-50 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedCountries.includes(country.website || country.name)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-200 group-hover:border-gray-300'
                          }`}>
                          {selectedCountries.includes(country.website || country.name) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-black text-gray-900 leading-none">{country.name}</div>
                          <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Proxy: {country.website}</div>
                        </div>
                      </div>
                      {selectedCountries.includes(country.website || country.name) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-200" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search available institutions..."
                    value={univSearchTerm}
                    onChange={(e) => setUnivSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100/50 transition-all text-sm font-semibold shadow-inner"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                {fetchLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Syncing Nodes</p>
                    </div>
                  </div>
                )}
                {universities.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <ShieldAlert className="w-12 h-12 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Node Connectivity</p>
                  </div>
                ) : (
                  universities
                    .filter(u => u.name.toLowerCase().includes(univSearchTerm.toLowerCase()))
                    .map((univ) => (
                      <button
                        key={univ.id || univ.university_id}
                        onClick={() => handleToggleUniversity(univ.id || univ.university_id)}
                        className={`w-full group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${selectedUniversities.includes((univ.id || univ.university_id).toString())
                          ? 'border-emerald-600 bg-emerald-50/30'
                          : 'border-gray-50 bg-white hover:border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${selectedUniversities.includes((univ.id || univ.university_id).toString())
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'border-gray-200 group-hover:border-gray-300'
                            }`}>
                            {selectedUniversities.includes((univ.id || univ.university_id).toString()) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-sm font-black text-gray-900 truncate leading-none">{univ.name}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{univ.countryCode}</span>
                              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic">Verified Campus Node</span>
                            </div>
                          </div>
                        </div>
                        {selectedUniversities.includes((univ.id || univ.university_id).toString()) && (
                          <Star className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Protocol
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || fetchLoading}
              className="px-6 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentList;
