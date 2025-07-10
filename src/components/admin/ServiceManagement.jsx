// src/components/admin/ServiceManagement.jsx
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Settings, Package } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const ServiceManagement = ({ services, addOns, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState('services');
  const [editingService, setEditingService] = useState(null);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateAddOn, setShowCreateAddOn] = useState(false);

  const { success, error } = useNotifications();

  const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
  const serviceCategories = ['DETAILING', 'PROTECTION', 'RESTORATION', 'MAINTENANCE', 'SPECIALTY'];
  const addOnCategories = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];

  const handleCreateService = async (serviceData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setShowCreateService(false);
        success('Service created successfully!');
      } else {
        error(`Failed to create service: ${data.message}`);
      }
    } catch (err) {
      console.error('Error creating service:', err);
      error('Network error. Please try again.');
    }
  };

  const handleUpdateService = async (serviceId, serviceData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setEditingService(null);
        success('Service updated successfully!');
      } else {
        error(`Failed to update service: ${data.message}`);
      }
    } catch (err) {
      console.error('Error updating service:', err);
      error('Network error. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        success('Service deactivated successfully!');
      } else {
        error(`Failed to deactivate service: ${data.message}`);
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      error('Network error. Please try again.');
    }
  };

  const handleCreateAddOn = async (addOnData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addOnData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setShowCreateAddOn(false);
        success('Add-on created successfully!');
      } else {
        error(`Failed to create add-on: ${data.message}`);
      }
    } catch (err) {
      console.error('Error creating add-on:', err);
      error('Network error. Please try again.');
    }
  };

  const handleUpdateAddOn = async (addOnId, addOnData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addOnData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setEditingAddOn(null);
        success('Add-on updated successfully!');
      } else {
        error(`Failed to update add-on: ${data.message}`);
      }
    } catch (err) {
      console.error('Error updating add-on:', err);
      error('Network error. Please try again.');
    }
  };

  const handleDeleteAddOn = async (addOnId) => {
    if (!confirm('Are you sure you want to deactivate this add-on?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOnId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        success('Add-on deactivated successfully!');
      } else {
        error(`Failed to deactivate add-on: ${data.message}`);
      }
    } catch (err) {
      console.error('Error deleting add-on:', err);
      error('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Management Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Service & Pricing Management</h2>
            <p className="text-gray-600">Manage your services and pricing</p>
          </div>
          <div className="flex space-x-3">
            {activeSubTab === 'services' && (
              <button
                onClick={() => setShowCreateService(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </button>
            )}
            {activeSubTab === 'addons' && (
              <button
                onClick={() => setShowCreateAddOn(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Add-on
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSubTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveSubTab('addons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'addons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Add-ons ({addOns.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Services List */}
      {activeSubTab === 'services' && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        service.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {service.category}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-gray-600 mt-1">{service.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {vehicleTypes.map(type => (
                        <div key={type} className="text-sm">
                          <span className="font-medium text-gray-700">{type}:</span>
                          <span className="ml-1 text-green-600 font-semibold">
                            ${service.pricing[type] || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingService(service.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Edit Service"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Deactivate Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons List */}
      {activeSubTab === 'addons' && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {addOns.map((addOn) => (
              <div key={addOn.id} className="p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{addOn.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        addOn.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {addOn.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        {addOn.category}
                      </span>
                      <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-semibold">
                        ${addOn.price}
                      </span>
                    </div>
                    {addOn.description && (
                      <p className="text-gray-600 mb-2">{addOn.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      Sort: {addOn.sortOrder} • 
                      {addOn.isActive ? ' Visible to customers' : ' Hidden from booking form'}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingAddOn(addOn.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit Add-on"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddOn(addOn.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Deactivate Add-on"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Service Modal */}
      {showCreateService && (
        <ServiceFormModal
          isOpen={showCreateService}
          onClose={() => setShowCreateService(false)}
          onSubmit={handleCreateService}
          vehicleTypes={vehicleTypes}
          serviceCategories={serviceCategories}
          title="Create New Service"
        />
      )}

      {/* Create/Edit Add-on Modal */}
      {showCreateAddOn && (
        <AddOnFormModal
          isOpen={showCreateAddOn}
          onClose={() => setShowCreateAddOn(false)}
          onSubmit={handleCreateAddOn}
          addOnCategories={addOnCategories}
          title="Create New Add-on"
        />
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <ServiceFormModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          onSubmit={(data) => handleUpdateService(editingService, data)}
          vehicleTypes={vehicleTypes}
          serviceCategories={serviceCategories}
          title="Edit Service"
          initialData={services.find(s => s.id === editingService)}
        />
      )}

      {/* Edit Add-on Modal */}
      {editingAddOn && (
        <AddOnFormModal
          isOpen={!!editingAddOn}
          onClose={() => setEditingAddOn(null)}
          onSubmit={(data) => handleUpdateAddOn(editingAddOn, data)}
          addOnCategories={addOnCategories}
          title="Edit Add-on"
          initialData={addOns.find(a => a.id === editingAddOn)}
        />
      )}
    </div>
  );
};

// Service Form Modal Component
const ServiceFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  vehicleTypes, 
  serviceCategories, 
  title, 
  initialData 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'DETAILING',
    pricing: initialData?.pricing || vehicleTypes.reduce((acc, type) => ({ ...acc, [type]: '' }), {}),
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePricingChange = (vehicleType, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [vehicleType]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing by Vehicle Type</label>
            <div className="grid grid-cols-2 gap-4">
              {vehicleTypes.map(type => (
                <div key={type}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{type}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing[type]}
                    onChange={(e) => handlePricingChange(type, e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add-on Form Modal Component
const AddOnFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  addOnCategories, 
  title, 
  initialData 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'ENHANCEMENT',
    price: initialData?.price || '',
    sortOrder: initialData?.sortOrder || 0,
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add-on Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {addOnCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {initialData ? 'Update Add-on' : 'Create Add-on'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceManagement;