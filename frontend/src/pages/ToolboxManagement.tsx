/**
 * Toolbox Management Page with CRUD operations
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolboxesApi, imagesApi, API_BASE_URL } from '../services/api';
import type { Toolbox } from '../types/api.types';

export default function ToolboxManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToolbox, setEditingToolbox] = useState<Toolbox | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch toolboxes
  const { data: toolboxes, isLoading } = useQuery({
    queryKey: ['toolboxes'],
    queryFn: () => toolboxesApi.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: toolboxesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolboxes'] });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to delete toolbox';
      alert(message);
      setDeleteConfirmId(null);
    },
  });

  const handleEdit = (toolbox: Toolbox) => {
    setEditingToolbox(toolbox);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingToolbox(null);
  };

  return (
    <div className="layout-container max-w-[1400px] mx-auto p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Toolbox Management
          </h2>
          <p className="text-slate-500">Manage your toolboxes and inventory.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Toolbox
        </button>
      </header>

      {/* Toolbox Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading toolboxes...</p>
        </div>
      ) : toolboxes && toolboxes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolboxes.map((toolbox) => (
            <div
              key={toolbox.id}
              className="bg-surface-light rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Toolbox Image */}
              <div className="h-48 bg-slate-200 flex items-center justify-center">
                {toolbox.image_url ? (
                  <img
                    src={`${API_BASE_URL}${toolbox.image_url}`}
                    alt={toolbox.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-slate-400">
                    home_repair_service
                  </span>
                )}
              </div>

              {/* Toolbox Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{toolbox.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      toolbox.status === 'operational'
                        ? 'bg-green-100 text-green-700'
                        : toolbox.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {toolbox.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  {toolbox.zone && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span>{toolbox.zone}</span>
                    </div>
                  )}
                  {toolbox.location_description && (
                    <p className="text-xs text-slate-500">{toolbox.location_description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    <span>{toolbox.total_items} items</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(toolbox)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(toolbox.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            home_repair_service
          </span>
          <p className="text-slate-500 mb-4">No toolboxes found</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-full bg-primary text-black font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Create Your First Toolbox
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ToolboxModal
          toolbox={editingToolbox}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['toolboxes'] });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Toolbox?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this toolbox? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50"
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

// Create/Edit Toolbox Modal Component
function ToolboxModal({
  toolbox,
  onClose,
  onSuccess,
}: {
  toolbox: Toolbox | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: toolbox?.name || '',
    zone: toolbox?.zone || '',
    location_description: toolbox?.location_description || '',
    total_items: toolbox?.total_items || 0,
    status: toolbox?.status || 'operational',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    toolbox?.image_url ? `${API_BASE_URL}${toolbox.image_url}` : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: toolboxesApi.create,
    onSuccess: () => {
      setErrorMessage(null);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to create toolbox';
      setErrorMessage(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Toolbox> }) =>
      toolboxesApi.update(id, data),
    onSuccess: () => {
      setErrorMessage(null);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to update toolbox';
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
      let imageUrl = toolbox?.image_url;

      // Upload image if selected
      if (imageFile) {
        try {
          const uploadResult = await imagesApi.upload(imageFile, 'toolboxes');
          imageUrl = uploadResult.file_path;
        } catch (uploadError: any) {
          setErrorMessage(
            'Failed to upload image: ' + (uploadError?.response?.data?.detail || 'Unknown error')
          );
          return; // Don't proceed with form submission
        }
      }

      const data = {
        ...formData,
        image_url: imageUrl,
      };

      if (toolbox) {
        updateMutation.mutate({ id: toolbox.id, data });
      } else {
        createMutation.mutate(data as any);
      }
    } catch (error: any) {
      setErrorMessage('An unexpected error occurred');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          {toolbox ? 'Edit Toolbox' : 'Create New Toolbox'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Toolbox Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    home_repair_service
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
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Toolbox Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., TBX-Alpha-01"
            />
          </div>

          {/* Zone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Zone</label>
            <input
              type="text"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Zone A"
            />
          </div>

          {/* Location Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location Description
            </label>
            <textarea
              value={formData.location_description}
              onChange={(e) =>
                setFormData({ ...formData, location_description: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="e.g., Main warehouse, row 3"
            />
          </div>

          {/* Total Items and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Items
              </label>
              <input
                type="number"
                min="0"
                value={formData.total_items}
                onChange={(e) =>
                  setFormData({ ...formData, total_items: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
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
              {isLoading ? 'Saving...' : toolbox ? 'Update Toolbox' : 'Create Toolbox'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
