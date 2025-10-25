/**
 * Fix flows_frequency_check constraint
 * 
 * This migration updates the frequency constraint to accept the correct values
 * that match the application logic (capitalized frequency values).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🔧 Fixing flows_frequency_check constraint...');
  
  try {
    // Drop the existing constraint if it exists
    await knex.raw(`
      ALTER TABLE flows 
      DROP CONSTRAINT IF EXISTS flows_frequency_check;
    `);
    
    console.log('✅ Dropped existing flows_frequency_check constraint');
    
    // Add the new constraint with correct values
    await knex.raw(`
      ALTER TABLE flows 
      ADD CONSTRAINT flows_frequency_check 
      CHECK (
        frequency IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom')
      );
    `);
    
    console.log('✅ Added new flows_frequency_check constraint with correct values');
    
    // Verify the constraint was added
    const constraintCheck = await knex.raw(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conname = 'flows_frequency_check';
    `);
    
    console.log('📋 Constraint details:', constraintCheck.rows[0]);
    
  } catch (error) {
    console.error('❌ Error fixing frequency constraint:', error);
    throw error;
  }
};

/**
 * Revert the frequency constraint fix
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Reverting flows_frequency_check constraint fix...');
  
  try {
    // Drop the new constraint
    await knex.raw(`
      ALTER TABLE flows 
      DROP CONSTRAINT IF EXISTS flows_frequency_check;
    `);
    
    console.log('✅ Dropped flows_frequency_check constraint');
    
    // Restore the old constraint (if we knew what it was)
    // For now, we'll leave it without a constraint
    console.log('⚠️ Old constraint not restored - manual intervention may be needed');
    
  } catch (error) {
    console.error('❌ Error reverting frequency constraint:', error);
    throw error;
  }
};
