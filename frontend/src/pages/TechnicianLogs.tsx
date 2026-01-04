/**
 * Technician Logs Page Component
 * Displays technician list with expandable access history
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techniciansApi, accessLogsApi, toolboxesApi } from '../services/api';
import type { Technician, AccessLog, Toolbox } from '../types/api.types';

export default function TechnicianLogs() {
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState({
    searchText: '',
    statusFilter: 'all' as 'all' | 'active' | 'inactive',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Data fetching
  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: techniciansApi.getAll,
  });

  const { data: toolboxes = [] } = useQuery({
    queryKey: ['toolboxes'],
    queryFn: () => toolboxesApi.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: techniciansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to delete technician';
      alert(message);
      setDeleteConfirmId(null);
    },
  });

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    if (!technicians) return [];

    let filtered = [...technicians];

    // Search filter
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (tech) =>
          tech.first_name.toLowerCase().includes(search) ||
          tech.last_name.toLowerCase().includes(search) ||
          tech.employee_id.toLowerCase().includes(search) ||
          tech.email?.toLowerCase().includes(search) ||
          tech.department?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((tech) => tech.status === filters.statusFilter);
    }

    return filtered;
  }, [technicians, filters.searchText, filters.statusFilter]);

  // Paginated technicians
  const paginatedTechnicians = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredTechnicians.slice(startIndex, endIndex);
  }, [filteredTechnicians, pagination.currentPage, pagination.pageSize]);

  const totalPages = Math.ceil(filteredTechnicians.length / pagination.pageSize);

  // Handlers
  const toggleRowExpansion = (technicianId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(technicianId)) {
        next.delete(technicianId);
      } else {
        next.add(technicianId);
      }
      return next;
    });
  };

  const handleEdit = (technician: Technician) => {
    setEditingTechnician(technician);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTechnician(null);
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="layout-container max-w-[1400px] mx-auto p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Technician Logs
          </h2>
          <p className="text-slate-500">Manage technicians and view their access history.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Technician
        </button>
      </header>

      {/* Search and Filter Bar */}
      <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="pl-10 pr-4 h-10 w-64 rounded-full bg-slate-50 border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="Search technicians..."
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.statusFilter}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, statusFilter: e.target.value as any }))
            }
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-full pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Pagination Info */}
        <p className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-medium text-slate-900">
            {filteredTechnicians.length === 0
              ? 0
              : (pagination.currentPage - 1) * pagination.pageSize + 1}
            -{Math.min(pagination.currentPage * pagination.pageSize, filteredTechnicians.length)}
          </span>{' '}
          of <span className="font-medium text-slate-900">{filteredTechnicians.length}</span>{' '}
          technicians
        </p>
      </section>

      {/* Technicians Table */}
      <section className="bg-surface-light rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-8"></th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Technician
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Employee ID
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="py-4 px-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedTechnicians && paginatedTechnicians.length > 0 ? (
                paginatedTechnicians.map((technician) => (
                  <TechnicianRow
                    key={technician.id}
                    technician={technician}
                    toolboxes={toolboxes}
                    isExpanded={expandedRows.has(technician.id)}
                    onToggleExpand={() => toggleRowExpansion(technician.id)}
                    onEdit={() => handleEdit(technician)}
                    onDelete={() => setDeleteConfirmId(technician.id)}
                    getInitials={getInitials}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No technicians found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTechnicians.length > pagination.pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage >= totalPages}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </section>

      {/* Add/Edit Technician Modal */}
      {isModalOpen && (
        <TechnicianModal
          technician={editingTechnician}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Technician?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this technician? This action cannot be undone and
              will also remove all associated access logs.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Technician Row Component with Expandable Access History
function TechnicianRow({
  technician,
  toolboxes,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getInitials,
}: {
  technician: Technician;
  toolboxes: Toolbox[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getInitials: (firstName: string, lastName: string) => string;
}) {
  return (
    <>
      <tr className="group hover:bg-slate-50 transition-colors">
        <td className="py-4 px-6">
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-all"
          >
            <span
              className={`material-symbols-outlined text-base transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              chevron_right
            </span>
          </button>
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
              {getInitials(technician.first_name, technician.last_name)}
            </div>
            <div>
              <p className="font-medium text-slate-900">
                {technician.first_name} {technician.last_name}
              </p>
            </div>
          </div>
        </td>
        <td className="py-4 px-6">
          <span className="text-sm text-slate-700">{technician.employee_id}</span>
        </td>
        <td className="py-4 px-6">
          <span className="text-sm text-slate-700">{technician.email || 'N/A'}</span>
        </td>
        <td className="py-4 px-6">
          <span className="text-sm text-slate-700">{technician.department || 'N/A'}</span>
        </td>
        <td className="py-4 px-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              technician.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {technician.status || 'active'}
          </span>
        </td>
        <td className="py-4 px-6 text-right">
          <div className="flex gap-2 justify-end">
            <button
              onClick={onEdit}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 bg-slate-50/50">
            <AccessHistoryPanel technicianId={technician.id} toolboxes={toolboxes} />
          </td>
        </tr>
      )}
    </>
  );
}

// Access History Panel Component
function AccessHistoryPanel({
  technicianId,
  toolboxes,
}: {
  technicianId: string;
  toolboxes: Toolbox[];
}) {
  const { data: accessLogs, isLoading } = useQuery({
    queryKey: ['access-logs', technicianId],
    queryFn: () => accessLogsApi.getAll({ technician_id: technicianId }),
    enabled: !!technicianId,
  });

  const getToolbox = (toolboxId: string) => {
    return toolboxes.find((t) => t.id === toolboxId);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
        Access History
      </h4>
      {isLoading ? (
        <p className="text-sm text-slate-500 py-4">Loading access history...</p>
      ) : accessLogs && accessLogs.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Toolbox
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Timestamp
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Items Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessLogs.map((log: AccessLog) => {
                const toolbox = getToolbox(log.toolbox_id);
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-base">
                          home_repair_service
                        </span>
                        <span className="font-medium text-slate-900">
                          {toolbox?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {log.action_type || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{formatDateTime(log.timestamp)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700">
                          {log.items_after || 0}/{log.items_before || 0}
                        </span>
                        {log.items_missing > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                            {log.items_missing} missing
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-4">No access history found.</p>
      )}
    </div>
  );
}

// Add/Edit Technician Modal Component
function TechnicianModal({
  technician,
  onClose,
  onSuccess,
}: {
  technician: Technician | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    nfc_card_uid: technician?.nfc_card_uid || '',
    employee_id: technician?.employee_id || '',
    first_name: technician?.first_name || '',
    last_name: technician?.last_name || '',
    email: technician?.email || '',
    phone: technician?.phone || '',
    department: technician?.department || '',
    status: technician?.status || 'active',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: techniciansApi.create,
    onSuccess: () => {
      setErrorMessage(null);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to create technician';
      setErrorMessage(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Technician> }) =>
      techniciansApi.update(id, data),
    onSuccess: () => {
      setErrorMessage(null);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to update technician';
      setErrorMessage(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Clean up optional fields: convert empty strings to undefined
    const cleanedData = {
      ...formData,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      department: formData.department.trim() || undefined,
    };

    if (technician) {
      updateMutation.mutate({ id: technician.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData as any);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          {technician ? 'Edit Technician' : 'Add New Technician'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NFC Card UID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              NFC Card UID *
            </label>
            <input
              type="text"
              required
              value={formData.nfc_card_uid}
              onChange={(e) => setFormData({ ...formData, nfc_card_uid: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., ABCD1234"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Employee ID *
            </label>
            <input
              type="text"
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., EMP001"
            />
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Department and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-black hover:opacity-90 font-medium disabled:opacity-50"
            >
              {isLoading
                ? 'Saving...'
                : technician
                ? 'Update Technician'
                : 'Add Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
