import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.supabase' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SUPABASE_HOST || 'db.rtwclsmarfgfidbmcudu.supabase.co',
  port: parseInt(process.env.SUPABASE_PORT || '5432'),
  username: process.env.SUPABASE_USERNAME || 'postgres',
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE || 'postgres',
  synchronize: true,
  logging: true,
  entities: [
    path.join(__dirname, '../src/modules/**/entities/*.entity.{ts,js}'),
  ],
  migrations: [
    path.join(__dirname, '../supabase/migrations/*.sql'),
  ],
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');
    
    console.log('🔄 Synchronizing database schema...');
    await AppDataSource.synchronize();
    console.log('✅ Database schema synchronized!');
    
    console.log('📝 Running migrations...');
    // TypeORM will handle entity synchronization
    // For SQL migrations, we'll use raw queries
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Run the test data insertion function
    console.log('💾 Inserting test data...');
    await queryRunner.query('SELECT insert_test_data()');
    console.log('✅ Test data inserted successfully!');
    
    await queryRunner.release();
    
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();