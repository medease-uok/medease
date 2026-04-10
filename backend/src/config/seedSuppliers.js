const { query } = require('./database');

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
      await query(
        `UPDATE suppliers 
         SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, notes = $6 
         WHERE name = $7 OR name = $1`,
        [s.name, s.contact, s.email, s.phone, s.address, s.notes, s.oldName]
      );
      
      // Also update purchase_orders to match new supplier name to keep reports consistent
      await query(
        `UPDATE purchase_orders SET supplier_name = $1 WHERE supplier_name = $2`,
        [s.name, s.oldName]
      );
    }

    console.log('PostgreSQL: Supplier details updated successfully!');
  } catch (err) {
    console.error('PostgreSQL Error: Failed to update suppliers -', err.message);
  }
}

seedSuppliers().then(() => process.exit(0)).catch(() => process.exit(1));
