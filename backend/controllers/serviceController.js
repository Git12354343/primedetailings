// backend/controllers/serviceController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Vehicle types that we support
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe'];

// Get all services with pricing
const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        pricing: {
          orderBy: { vehicleType: 'asc' }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        isActive: service.isActive,
        sortOrder: service.sortOrder,
        pricing: service.pricing.reduce((acc, price) => {
          acc[price.vehicleType] = parseFloat(price.price);
          return acc;
        }, {}),
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }))
    });

  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
};

// Get active services only (for booking form)
const getActiveServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        pricing: {
          orderBy: { vehicleType: 'asc' }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        pricing: service.pricing.reduce((acc, price) => {
          acc[price.vehicleType] = parseFloat(price.price);
          return acc;
        }, {})
      }))
    });

  } catch (error) {
    console.error('Get active services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active services'
    });
  }
};

// Create new service
const createService = async (req, res) => {
  try {
    const { name, description, category, pricing, sortOrder } = req.body;

    // Validate required fields
    if (!name || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Name and pricing are required'
      });
    }

    // Validate pricing structure
    const missingVehicleTypes = VEHICLE_TYPES.filter(type => 
      !pricing[type] || pricing[type] <= 0
    );

    if (missingVehicleTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid pricing for: ${missingVehicleTypes.join(', ')}`
      });
    }

    // Create service with pricing
    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'DETAILING',
        sortOrder: sortOrder || 0,
        pricing: {
          create: VEHICLE_TYPES.map(vehicleType => ({
            vehicleType,
            price: parseFloat(pricing[vehicleType])
          }))
        }
      },
      include: {
        pricing: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        isActive: service.isActive,
        sortOrder: service.sortOrder,
        pricing: service.pricing.reduce((acc, price) => {
          acc[price.vehicleType] = parseFloat(price.price);
          return acc;
        }, {}),
        createdAt: service.createdAt
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Service name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating service'
    });
  }
};

// Update existing service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, pricing, isActive, sortOrder } = req.body;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: { pricing: true }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Validate pricing if provided
    if (pricing) {
      const missingVehicleTypes = VEHICLE_TYPES.filter(type => 
        !pricing[type] || pricing[type] <= 0
      );

      if (missingVehicleTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing or invalid pricing for: ${missingVehicleTypes.join(', ')}`
        });
      }
    }

    // Update service
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedService = await prisma.service.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { pricing: true }
    });

    // Update pricing if provided
    if (pricing) {
      // Delete existing pricing
      await prisma.servicePricing.deleteMany({
        where: { serviceId: parseInt(id) }
      });

      // Create new pricing
      await prisma.servicePricing.createMany({
        data: VEHICLE_TYPES.map(vehicleType => ({
          serviceId: parseInt(id),
          vehicleType,
          price: parseFloat(pricing[vehicleType])
        }))
      });

      // Fetch updated service with new pricing
      const serviceWithPricing = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: { pricing: true }
      });

      updatedService.pricing = serviceWithPricing.pricing;
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: {
        id: updatedService.id,
        name: updatedService.name,
        description: updatedService.description,
        category: updatedService.category,
        isActive: updatedService.isActive,
        sortOrder: updatedService.sortOrder,
        pricing: updatedService.pricing.reduce((acc, price) => {
          acc[price.vehicleType] = parseFloat(price.price);
          return acc;
        }, {}),
        updatedAt: updatedService.updatedAt
      }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service'
    });
  }
};

// Delete service (soft delete by setting isActive to false)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Soft delete - just mark as inactive
    await prisma.service.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service'
    });
  }
};

// Permanently delete service (hard delete)
const permanentDeleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Delete pricing first (cascade should handle this, but being explicit)
    await prisma.servicePricing.deleteMany({
      where: { serviceId: parseInt(id) }
    });

    // Delete service
    await prisma.service.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Service permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting service'
    });
  }
};

// Get all add-ons
const getAllAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      addOns: addOns.map(addOn => ({
        id: addOn.id,
        name: addOn.name,
        description: addOn.description,
        category: addOn.category,
        price: parseFloat(addOn.price),
        isActive: addOn.isActive,
        sortOrder: addOn.sortOrder,
        createdAt: addOn.createdAt,
        updatedAt: addOn.updatedAt
      }))
    });

  } catch (error) {
    console.error('Get all add-ons error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching add-ons'
    });
  }
};

// Get active add-ons only
const getActiveAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      addOns: addOns.map(addOn => ({
        id: addOn.id,
        name: addOn.name,
        description: addOn.description,
        category: addOn.category,
        price: parseFloat(addOn.price)
      }))
    });

  } catch (error) {
    console.error('Get active add-ons error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active add-ons'
    });
  }
};

// Create new add-on
const createAddOn = async (req, res) => {
  try {
    const { name, description, category, price, sortOrder } = req.body;

    if (!name || !price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and valid price are required'
      });
    }

    const addOn = await prisma.addOn.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'ENHANCEMENT',
        price: parseFloat(price),
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Add-on created successfully',
      addOn: {
        id: addOn.id,
        name: addOn.name,
        description: addOn.description,
        category: addOn.category,
        price: parseFloat(addOn.price),
        isActive: addOn.isActive,
        sortOrder: addOn.sortOrder,
        createdAt: addOn.createdAt
      }
    });

  } catch (error) {
    console.error('Create add-on error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating add-on'
    });
  }
};

// Update add-on
const updateAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, isActive, sortOrder } = req.body;

    const existingAddOn = await prisma.addOn.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAddOn) {
      return res.status(404).json({
        success: false,
        message: 'Add-on not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0'
        });
      }
      updateData.price = parseFloat(price);
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedAddOn = await prisma.addOn.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Add-on updated successfully',
      addOn: {
        id: updatedAddOn.id,
        name: updatedAddOn.name,
        description: updatedAddOn.description,
        category: updatedAddOn.category,
        price: parseFloat(updatedAddOn.price),
        isActive: updatedAddOn.isActive,
        sortOrder: updatedAddOn.sortOrder,
        updatedAt: updatedAddOn.updatedAt
      }
    });

  } catch (error) {
    console.error('Update add-on error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating add-on'
    });
  }
};

// Delete add-on (soft delete)
const deleteAddOn = async (req, res) => {
  try {
    const { id } = req.params;

    const addOn = await prisma.addOn.findUnique({
      where: { id: parseInt(id) }
    });

    if (!addOn) {
      return res.status(404).json({
        success: false,
        message: 'Add-on not found'
      });
    }

    await prisma.addOn.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Add-on deactivated successfully'
    });

  } catch (error) {
    console.error('Delete add-on error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting add-on'
    });
  }
};

// Calculate pricing for a set of services and add-ons based on vehicle type
const calculateDynamicPricing = async (req, res) => {
  try {
    const { services, addOns, vehicleType } = req.body;

    if (!vehicleType || !VEHICLE_TYPES.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid vehicle type is required'
      });
    }

    let totalPrice = 0;
    const breakdown = {
      services: [],
      addOns: [],
      subtotal: 0,
      total: 0
    };

    // Calculate service prices
    if (services && services.length > 0) {
      const serviceRecords = await prisma.service.findMany({
        where: {
          id: { in: services.map(id => parseInt(id)) },
          isActive: true
        },
        include: {
          pricing: {
            where: { vehicleType }
          }
        }
      });

      for (const service of serviceRecords) {
        const pricing = service.pricing[0];
        if (pricing) {
          const price = parseFloat(pricing.price);
          totalPrice += price;
          breakdown.services.push({
            id: service.id,
            name: service.name,
            price: price
          });
        }
      }
    }

    // Calculate add-on prices
    if (addOns && addOns.length > 0) {
      const addOnRecords = await prisma.addOn.findMany({
        where: {
          id: { in: addOns.map(id => parseInt(id)) },
          isActive: true
        }
      });

      for (const addOn of addOnRecords) {
        const price = parseFloat(addOn.price);
        totalPrice += price;
        breakdown.addOns.push({
          id: addOn.id,
          name: addOn.name,
          price: price
        });
      }
    }

    breakdown.subtotal = totalPrice;
    breakdown.total = totalPrice;

    res.json({
      success: true,
      pricing: breakdown
    });

  } catch (error) {
    console.error('Calculate pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating pricing'
    });
  }
};

module.exports = {
  getAllServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
  permanentDeleteService,
  getAllAddOns,
  getActiveAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  calculateDynamicPricing
};