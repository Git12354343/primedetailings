// backend/controllers/addOnController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all add-ons (for admin)
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

// Get active add-ons only (for booking form)
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

    // Validate required fields
    if (!name || !price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and valid price are required'
      });
    }

    // Validate category
    const validCategories = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
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
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Add-on name already exists'
      });
    }

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

    // Check if add-on exists
    const existingAddOn = await prisma.addOn.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAddOn) {
      return res.status(404).json({
        success: false,
        message: 'Add-on not found'
      });
    }

    // Validate price if provided
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Validate category if provided
    const validCategories = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
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
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Add-on name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating add-on'
    });
  }
};

// Delete add-on (soft delete - mark as inactive)
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

    // Soft delete - mark as inactive
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

// Permanently delete add-on (hard delete)
const permanentDeleteAddOn = async (req, res) => {
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

    // Hard delete
    await prisma.addOn.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Add-on permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete add-on error:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting add-on'
    });
  }
};

// Get add-on categories
const getAddOnCategories = async (req, res) => {
  try {
    const categories = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];
    
    res.json({
      success: true,
      categories: categories.map(category => ({
        value: category,
        label: category.charAt(0) + category.slice(1).toLowerCase()
      }))
    });

  } catch (error) {
    console.error('Get add-on categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching add-on categories'
    });
  }
};

module.exports = {
  getAllAddOns,
  getActiveAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  permanentDeleteAddOn,
  getAddOnCategories
};