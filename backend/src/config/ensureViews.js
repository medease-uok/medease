const fs = require('fs');
const path = require('path');
const { query } = require('./database');

/**
 * Ensures that reporting views are created and permissions are granted.
 * Reads SQL from the central database/init/25-views.sql file.
 */
async function ensureViews() {
  try {
    const viewsSqlPath = path.join(__dirname, '../../database/init/25-views.sql');
    
    if (!fs.existsSync(viewsSqlPath)) {
      throw new Error(`Views SQL file not found at: ${viewsSqlPath}`);
    }

    const sqlContent = fs.readFileSync(viewsSqlPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const sqlStatements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`PostgreSQL: Ensuring ${sqlStatements.length} reporting view statements (Single Source of Truth)...`);
    
    for (const statement of sqlStatements) {
      await query(statement);
    }
    
    console.log('PostgreSQL: All reporting views successfully initialized/updated.');
  } catch (err) {
    console.error('PostgreSQL Critical Error: Failed to initialize reporting views -', err.stack);
    throw err;
  }
}




if (require.main === module) {
  ensureViews()
    .then(() => {
      console.log('Standalone view initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Standalone view initialization failed:', err);
      process.exit(1);
    });
}

module.exports = ensureViews;


