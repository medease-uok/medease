const { query } = require('./database');

/**
 * Updates existing placeholder suppliers with professional dummy data.
 * Also synchronizes related purchase orders for consistency.
 */
async function seedSuppliers() {
  try {
    console.log('PostgreSQL: Updating supplier details with professional dummy data...');

    const suppliersToUpdate = [
      {
        oldName: 'Medicine',
        name: 'MediGlobal Pharmaceuticals',
        contact: 'Sarah Johnson',
        email: 'sarah.j@mediglobal.com',
        phone: '+94 11 234 5678',
        address: '123 Pharma Plaza, Colombo 03, Sri Lanka',
        notes: 'Primary supplier for critical medication.'
      },
      {
        oldName: 'aaa',
        name: 'Precision Surgical Supplies',
        contact: 'Michael Chen',
        email: 'orders@precisionsurgical.lk',
        phone: '+94 11 987 6543',
        address: '45 Industrial Zone, Kandy Rd, Kelaniya',
        notes: 'Specializes in surgical equipment and sterile supplies.'
      },
      {
        oldName: 'aaaa',
        name: 'BioTech Lab Solutions',
        contact: 'Dr. David Perera',
        email: 'info@biotechlabs.com',
        phone: '+94 11 555 4433',
        address: '89 Innovation Drive, Rajagiriya',
        notes: 'Supplier for laboratory reagents and diagnostic kits.'
      },
      {
        oldName: 'aaaaaaa',
        name: 'HealthForce Equipment',
        contact: 'Jennifer White',
        email: 'sales@healthforce.lk',
        phone: '+94 77 123 4567',
        address: '12/A Hospital Rd, Maharagama',
        notes: 'Patient monitoring software and hardware.'
      },
      {
        oldName: 'medii',
        name: 'CareFirst Consumables',
        contact: 'Robert Silva',
        email: 'robert@carefirst.lk',
        phone: '+94 11 888 9900',
        address: '302 Galle Road, Mount Lavinia',
        notes: 'Gloves, masks, and other basic consumables.'
      }
    ];

    for (const s of suppliersToUpdate) {
      // 1. Update the supplier record
      const result = await query(
        `UPDATE suppliers 
         SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, notes = $6 
         WHERE name = $7 OR name = $1
         RETURNING id`,
        [s.name, s.contact, s.email, s.phone, s.address, s.notes, s.oldName]
      );

      if (result.rows.length > 0) {
        const supplierId = result.rows[0].id;
        
        // 2. Synchronize purchase_orders with the new name and ID
        // This resolves architectural weakness in name-based joins
        await query(
          `UPDATE purchase_orders 
           SET supplier_name = $1, supplier_id = $2 
           WHERE supplier_name = $3 OR supplier_id = $2`,
          [s.name, supplierId, s.oldName]
        );
      }
    }

    console.log('PostgreSQL: Supplier details and related orders successfully synchronized!');
  } catch (err) {
    console.error('PostgreSQL Error: Failed to update suppliers -', err.stack);
    throw err;
  }
}

if (require.main === module) {
  seedSuppliers()
    .then(() => {
      console.log('Supplier seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Supplier seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedSuppliers;

