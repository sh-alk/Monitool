/**
 * Dashboard Page Component
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, accessLogsApi, toolboxesApi, techniciansApi, imagesApi, API_BASE_URL } from '../services/api';
import type { AccessLog, DashboardStats, Toolbox, Technician } from '../types/api.types';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Filter and pagination state
  const [filters, setFilters] = useState({
    searchText: '',
    filterType: 'all' as 'all' | 'in_use' | 'missing_items',
    dateRange: 'all' as 'all' | 'last_24_hours' | 'last_7_days' | 'last_30_days',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 50,
  });
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openActionsDropdown, setOpenActionsDropdown] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(filters.searchText);
      setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.searchText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openActionsDropdown) {
        setOpenActionsDropdown(null);
      }
    };
    if (openActionsDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openActionsDropdown]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recent access logs
  const { data: accessLogs, isLoading: logsLoading } = useQuery<AccessLog[]>({
    queryKey: ['access-logs'],
    queryFn: () => accessLogsApi.getAll({ limit: 50 }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch toolboxes for lookup
  const { data: toolboxes = [] } = useQuery<Toolbox[]>({
    queryKey: ['toolboxes'],
    queryFn: () => toolboxesApi.getAll(),
  });

  // Fetch technicians for lookup
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: () => techniciansApi.getAll(),
  });

  // Helper functions to lookup related data
  const getToolbox = (toolboxId: string): Toolbox | undefined => {
    return toolboxes.find((t) => t.id === toolboxId);
  };

  const getTechnician = (technicianId: string): Technician | undefined => {
    return technicians.find((t) => t.id === technicianId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Filtered logs based on search, filter type, and date range
  const filteredLogs = useMemo(() => {
    if (!accessLogs) return [];

    let filtered = [...accessLogs];

    // Search filter (toolbox name, zone, technician name, employee ID)
    if (debouncedSearchText) {
      const search = debouncedSearchText.toLowerCase();
      filtered = filtered.filter((log) => {
        const toolbox = getToolbox(log.toolbox_id);
        const technician = getTechnician(log.technician_id);
        return (
          toolbox?.name.toLowerCase().includes(search) ||
          toolbox?.zone?.toLowerCase().includes(search) ||
          technician?.first_name.toLowerCase().includes(search) ||
          technician?.last_name.toLowerCase().includes(search) ||
          technician?.employee_id.toLowerCase().includes(search)
        );
      });
    }

    // Filter type
    if (filters.filterType === 'missing_items') {
      filtered = filtered.filter((log) => log.items_missing > 0);
    } else if (filters.filterType === 'in_use') {
      filtered = filtered.filter((log) => log.items_missing === 0);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (filters.dateRange === 'last_24_hours') {
        cutoffDate.setHours(now.getHours() - 24);
      } else if (filters.dateRange === 'last_7_days') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'last_30_days') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((log) => new Date(log.timestamp) >= cutoffDate);
    }

    return filtered;
  }, [accessLogs, debouncedSearchText, filters.filterType, filters.dateRange, toolboxes, technicians]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, pagination.currentPage, pagination.pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pagination.pageSize);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: accessLogsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      alert('Failed to delete log: ' + (error?.response?.data?.detail || 'Unknown error'));
    },
  });

  // Handler functions
  const handleFilterChange = (filterType: 'all' | 'in_use' | 'missing_items') => {
    setFilters((prev) => ({ ...prev, filterType }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDateRangeChange = (dateRange: 'all' | 'last_24_hours' | 'last_7_days' | 'last_30_days') => {
    setFilters((prev) => ({ ...prev, dateRange }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePreviousPage = () => {
    setPagination((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }));
  };

  const handleViewDetails = (logId: string) => {
    setSelectedLogId(logId);
    setIsDetailsModalOpen(true);
    setOpenActionsDropdown(null);
  };

  const handleDeleteClick = (logId: string) => {
    setDeleteConfirmId(logId);
    setOpenActionsDropdown(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
    }
  };

  return (
    <div className="layout-container max-w-[1400px] mx-auto p-6 md:p-10 flex flex-col gap-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Dashboard
          </h2>
          <p className="text-slate-500">Real-time tracking of inventory and technician access logs.</p>
        </div>
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-black font-medium text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Log Entry
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Checkouts Today */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-slate-900">inventory_2</span>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-normal">Total Checkouts Today</p>
          <div className="flex items-baseline gap-3">
            <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
              {statsLoading ? '...' : stats?.total_checkouts_today || 0}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> 12%
            </span>
          </div>
        </div>

        {/* Missing Items */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light border border-l-4 border-l-primary border-y border-r border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-6 opacity-10">
            <span className="material-symbols-outlined text-6xl text-primary">warning</span>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-normal">Missing Items</p>
          <div className="flex items-baseline gap-3">
            <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
              {statsLoading ? '...' : stats?.missing_items || 0}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-slate-900">
              Action Required
            </span>
          </div>
        </div>

        {/* Active Technicians */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-slate-900">engineering</span>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-normal">Active Technicians</p>
          <div className="flex items-baseline gap-3">
            <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
              {statsLoading ? '...' : stats?.active_technicians || 0}
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-surface-light p-4 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="pl-10 pr-4 h-10 w-64 rounded-full bg-slate-50 border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="Search logs..."
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
            />
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex items-center justify-center gap-x-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filters.filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => handleFilterChange('in_use')}
              className={`flex items-center justify-center gap-x-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filters.filterType === 'in_use'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              In Use
            </button>
            <button
              onClick={() => handleFilterChange('missing_items')}
              className={`flex items-center justify-center gap-x-2 rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                filters.filterType === 'missing_items'
                  ? 'bg-slate-900 text-white shadow-md border-slate-900'
                  : 'bg-primary/10 text-slate-900 hover:bg-primary/20 border-primary/20'
              }`}
            >
              Missing Items
              <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats?.missing_items || 0}
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <select
            value={filters.dateRange}
            onChange={(e) =>
              handleDateRangeChange(
                e.target.value as 'all' | 'last_24_hours' | 'last_7_days' | 'last_30_days'
              )
            }
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-full pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="last_24_hours">Last 24 Hours</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
            calendar_today
          </span>
        </div>
      </section>

      {/* Activity Data Table */}
      <section className="bg-surface-light rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Toolbox
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Technician
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Timestamp
                </th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Inventory Status
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
              {logsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedLogs && paginatedLogs.length > 0 ? (
                paginatedLogs.map((log: AccessLog) => {
                  const toolbox = getToolbox(log.toolbox_id);
                  const technician = getTechnician(log.technician_id);

                  return (
                    <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-600">
                              home_repair_service
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{toolbox?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{toolbox?.zone || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                            {technician
                              ? getInitials(technician.first_name, technician.last_name)
                              : '??'}
                          </div>
                          <span className="text-sm text-slate-700">
                            {technician
                              ? `${technician.first_name} ${technician.last_name}`
                              : 'Unknown'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-8">
                          ID: {technician?.employee_id || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-700">{formatDate(log.timestamp)}</p>
                        <p className="text-xs text-slate-500">{formatTime(log.timestamp)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                log.items_missing > 0 ? 'bg-primary' : 'bg-green-500'
                              }`}
                              style={{
                                width: `${
                                  log.items_after && log.items_before
                                    ? (log.items_after / log.items_before) * 100
                                    : 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {log.items_after || 0}/{log.items_before || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {log.items_missing > 0 ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-black border border-primary/50 shadow-sm shadow-primary/20">
                              <span className="size-1.5 rounded-full bg-black animate-pulse"></span>
                              Missing Item
                            </span>
                            <p className="text-[10px] text-red-500 mt-1 font-medium">
                              {log.missing_items_list || 'Unknown items'}
                            </p>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Complete
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionsDropdown(
                              openActionsDropdown === log.id ? null : log.id
                            );
                          }}
                          className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                        {openActionsDropdown === log.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-12 bg-white rounded-lg shadow-lg border border-slate-200 py-2 w-40 z-10"
                          >
                            <button
                              onClick={() => handleViewDetails(log.id)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">
                                visibility
                              </span>
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteClick(log.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No access logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-surface-light mt-auto">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-medium text-slate-900">
              {filteredLogs.length === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.pageSize + 1}
              -
              {Math.min(pagination.currentPage * pagination.pageSize, filteredLogs.length)}
            </span>{' '}
            of <span className="font-medium text-slate-900">{filteredLogs.length}</span> logs
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.currentPage >= totalPages}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Add Log Entry Modal */}
      {isLogModalOpen && (
        <AddLogModal
          toolboxes={toolboxes}
          technicians={technicians}
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={() => {
            setIsLogModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['access-logs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }}
        />
      )}

      {/* View Details Modal */}
      {isDetailsModalOpen && selectedLogId && (
        <ViewLogDetailsModal
          logId={selectedLogId}
          accessLogs={accessLogs || []}
          toolboxes={toolboxes}
          technicians={technicians}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedLogId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Log Entry?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this log entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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

// Add Log Entry Modal Component
function AddLogModal({
  toolboxes,
  technicians,
  onClose,
  onSuccess,
}: {
  toolboxes: Toolbox[];
  technicians: Technician[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    toolbox_id: '',
    technician_id: '',
    action_type: 'open' as 'open' | 'close' | 'access_denied',
    items_before: 0,
    items_after: 0,
    items_missing: 0,
    missing_items_list: '',
    notes: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: accessLogsApi.create,
    onSuccess: () => {
      setErrorMessage(null);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to create access log';
      setErrorMessage(message);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      let conditionImageUrl = undefined;

      // Upload image if selected
      if (imageFile) {
        try {
          const uploadResult = await imagesApi.upload(imageFile, 'access-logs');
          conditionImageUrl = uploadResult.file_path;
        } catch (uploadError: any) {
          setErrorMessage(
            'Failed to upload image: ' + (uploadError?.response?.data?.detail || 'Unknown error')
          );
          return;
        }
      }

      const data = {
        ...formData,
        condition_image_url: conditionImageUrl,
      };

      createMutation.mutate(data as any);
    } catch (error: any) {
      setErrorMessage('An unexpected error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Add Access Log Entry</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toolbox Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Toolbox *
            </label>
            <select
              required
              value={formData.toolbox_id}
              onChange={(e) => setFormData({ ...formData, toolbox_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a toolbox</option>
              {toolboxes.map((toolbox) => (
                <option key={toolbox.id} value={toolbox.id}>
                  {toolbox.name} {toolbox.zone ? `- ${toolbox.zone}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Technician *
            </label>
            <select
              required
              value={formData.technician_id}
              onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a technician</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name} - ID: {tech.employee_id}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Action Type *
            </label>
            <select
              required
              value={formData.action_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  action_type: e.target.value as 'open' | 'close' | 'access_denied',
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="close">Close</option>
              <option value="access_denied">Access Denied</option>
            </select>
          </div>

          {/* Items Count */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Items Before
              </label>
              <input
                type="number"
                min="0"
                value={formData.items_before}
                onChange={(e) =>
                  setFormData({ ...formData, items_before: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Items After
              </label>
              <input
                type="number"
                min="0"
                value={formData.items_after}
                onChange={(e) =>
                  setFormData({ ...formData, items_after: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Items Missing
              </label>
              <input
                type="number"
                min="0"
                value={formData.items_missing}
                onChange={(e) =>
                  setFormData({ ...formData, items_missing: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Missing Items List */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Missing Items List
            </label>
            <textarea
              value={formData.missing_items_list}
              onChange={(e) =>
                setFormData({ ...formData, missing_items_list: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder="e.g., Hammer, Screwdriver"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Additional notes or observations..."
            />
          </div>

          {/* Condition Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Toolbox Condition Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    photo_camera
                  </span>
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="text-sm font-medium text-slate-700">Choose Image</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Upload a photo of the toolbox condition at the time of access
            </p>
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                Failed to create log entry. Please try again.
              </p>
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
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-black hover:opacity-90 font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Log Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Log Details Modal Component
function ViewLogDetailsModal({
  logId,
  accessLogs,
  toolboxes,
  technicians,
  onClose,
}: {
  logId: string;
  accessLogs: AccessLog[];
  toolboxes: Toolbox[];
  technicians: Technician[];
  onClose: () => void;
}) {
  const log = accessLogs.find((l) => l.id === logId);
  const toolbox = toolboxes.find((t) => t.id === log?.toolbox_id);
  const technician = technicians.find((t) => t.id === log?.technician_id);

  if (!log) {
    return null;
  }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full my-8">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Access Log Details</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Toolbox
              </label>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600">
                    home_repair_service
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{toolbox?.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{toolbox?.zone || 'No zone'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Technician
              </label>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                  {technician
                    ? `${technician.first_name.charAt(0)}${technician.last_name.charAt(0)}`.toUpperCase()
                    : '??'}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {technician ? `${technician.first_name} ${technician.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-500">
                    ID: {technician?.employee_id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Timestamp
              </label>
              <p className="mt-1 text-slate-900">{formatDateTime(log.timestamp)}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Action Type
              </label>
              <p className="mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 capitalize">
                  {log.action_type || 'N/A'}
                </span>
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inventory Status
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items Before:</span>
                  <span className="font-medium text-slate-900">{log.items_before || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items After:</span>
                  <span className="font-medium text-slate-900">{log.items_after || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items Missing:</span>
                  <span
                    className={`font-medium ${
                      log.items_missing > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {log.items_missing || 0}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${log.items_missing > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{
                      width: `${
                        log.items_after && log.items_before
                          ? (log.items_after / log.items_before) * 100
                          : 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {log.items_missing > 0 && log.missing_items_list && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Missing Items
                </label>
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900">{log.missing_items_list}</p>
                </div>
              </div>
            )}

            {log.notes && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes
                </label>
                <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-700">{log.notes}</p>
                </div>
              </div>
            )}

            {log.condition_image_url && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Toolbox Condition Image
                </label>
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={`${API_BASE_URL}${log.condition_image_url}`}
                    alt="Toolbox condition"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
