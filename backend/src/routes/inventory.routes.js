const express = require('express');
const router = express.Router();
const { getAllInventory, addInventory, updateInventory, deleteInventory } = require('../controllers/inventory.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), getAllInventory);
router.post('/', authorize('admin'), addInventory);
router.put('/:id', authorize('admin'), updateInventory);
router.delete('/:id', authorize('admin'), deleteInventory);

module.exports = router;
