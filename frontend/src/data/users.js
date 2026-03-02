export const roles = ['patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'admin'];

export const users = [
  // Admin
  { id: 'a0000000-0000-0000-0000-000000000001', email: 'admin@medease.com', password: 'admin123', firstName: 'System', lastName: 'Admin', role: 'admin', phone: '+94771000001', isActive: true },

  // Doctors
  { id: 'd0000000-0000-0000-0000-000000000001', email: 'kamal.perera@medease.com', password: 'password123', firstName: 'Kamal', lastName: 'Perera', role: 'doctor', phone: '+94772000001', isActive: true },
  { id: 'd0000000-0000-0000-0000-000000000002', email: 'sithara.silva@medease.com', password: 'password123', firstName: 'Sithara', lastName: 'Silva', role: 'doctor', phone: '+94772000002', isActive: true },
  { id: 'd0000000-0000-0000-0000-000000000003', email: 'ruwan.fernando@medease.com', password: 'password123', firstName: 'Ruwan', lastName: 'Fernando', role: 'doctor', phone: '+94772000003', isActive: true },
  { id: 'd0000000-0000-0000-0000-000000000004', email: 'anjali.dissanayake@medease.com', password: 'password123', firstName: 'Anjali', lastName: 'Dissanayake', role: 'doctor', phone: '+94772000004', isActive: true },

  // Nurses
  { id: 'n0000000-0000-0000-0000-000000000001', email: 'malini.bandara@medease.com', password: 'password123', firstName: 'Malini', lastName: 'Bandara', role: 'nurse', phone: '+94773000001', isActive: true },
  { id: 'n0000000-0000-0000-0000-000000000002', email: 'chamari.rathnayake@medease.com', password: 'password123', firstName: 'Chamari', lastName: 'Rathnayake', role: 'nurse', phone: '+94773000002', isActive: true },
  { id: 'n0000000-0000-0000-0000-000000000003', email: 'priyanka.kumari@medease.com', password: 'password123', firstName: 'Priyanka', lastName: 'Kumari', role: 'nurse', phone: '+94773000003', isActive: true },

  // Lab Technicians
  { id: 'l0000000-0000-0000-0000-000000000001', email: 'nimal.wijesinghe@medease.com', password: 'password123', firstName: 'Nimal', lastName: 'Wijesinghe', role: 'lab_technician', phone: '+94774000001', isActive: true },
  { id: 'l0000000-0000-0000-0000-000000000002', email: 'sanduni.herath@medease.com', password: 'password123', firstName: 'Sanduni', lastName: 'Herath', role: 'lab_technician', phone: '+94774000002', isActive: true },

  // Pharmacists
  { id: 'r0000000-0000-0000-0000-000000000001', email: 'tharindu.gamage@medease.com', password: 'password123', firstName: 'Tharindu', lastName: 'Gamage', role: 'pharmacist', phone: '+94775000001', isActive: true },
  { id: 'r0000000-0000-0000-0000-000000000002', email: 'dilani.mendis@medease.com', password: 'password123', firstName: 'Dilani', lastName: 'Mendis', role: 'pharmacist', phone: '+94775000002', isActive: true },

  // Patients
  { id: 'p0000000-0000-0000-0000-000000000001', email: 'sarah.fernando@medease.com', password: 'password123', firstName: 'Sarah', lastName: 'Fernando', role: 'patient', phone: '+94776000001', isActive: true },
  { id: 'p0000000-0000-0000-0000-000000000002', email: 'dinesh.rajapaksa@medease.com', password: 'password123', firstName: 'Dinesh', lastName: 'Rajapaksa', role: 'patient', phone: '+94776000002', isActive: true },
  { id: 'p0000000-0000-0000-0000-000000000003', email: 'kavindi.weerasinghe@medease.com', password: 'password123', firstName: 'Kavindi', lastName: 'Weerasinghe', role: 'patient', phone: '+94776000003', isActive: true },
  { id: 'p0000000-0000-0000-0000-000000000004', email: 'nuwan.jayasuriya@medease.com', password: 'password123', firstName: 'Nuwan', lastName: 'Jayasuriya', role: 'patient', phone: '+94776000004', isActive: true },
  { id: 'p0000000-0000-0000-0000-000000000005', email: 'hasini.abeywickrama@medease.com', password: 'password123', firstName: 'Hasini', lastName: 'Abeywickrama', role: 'patient', phone: '+94776000005', isActive: true },
  { id: 'p0000000-0000-0000-0000-000000000006', email: 'lahiru.gunasekara@medease.com', password: 'password123', firstName: 'Lahiru', lastName: 'Gunasekara', role: 'patient', phone: '+94776000006', isActive: true },
];
