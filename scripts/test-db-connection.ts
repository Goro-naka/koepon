import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.supabase' });

const host = process.env.SUPABASE_HOST || 'localhost';
const hostForUrl = host.includes(':') ? `[${host}]` : host;

const AppDataSource = new DataSource({
  type: 'postgres',
  url: `postgresql://${process.env.SUPABASE_USERNAME}:${process.env.SUPABASE_PASSWORD}@${hostForUrl}:${process.env.SUPABASE_PORT}/${process.env.SUPABASE_DATABASE}?sslmode=disable`,
  synchronize: false,
  logging: true,
  entities: [
    path.join(__dirname, '../src/modules/**/entities/*.entity.{ts,js}'),
  ],
  ssl: {
    rejectUnauthorized: false,
    ca: false,
  },
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Host:', process.env.SUPABASE_HOST);
    console.log('Database:', process.env.SUPABASE_DATABASE);
    
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');
    
    // Test query - get VTubers
    const vtubers = await AppDataSource.query(`
      SELECT id, channel_name, subscriber_count, status 
      FROM vtubers 
      WHERE is_active = true
      LIMIT 5
    `);
    
    console.log('\n📊 Sample VTubers from database:');
    if (vtubers.length > 0) {
      vtubers.forEach((v: any) => {
        console.log(`  - ${v.channel_name}: ${v.subscriber_count} subscribers (${v.status})`);
      });
    } else {
      console.log('  No VTubers found in database');
    }
    
    // Test query - get Gacha campaigns
    const gachas = await AppDataSource.query(`
      SELECT g.id, g.name, g.price, g.status, v.channel_name 
      FROM gacha g
      LEFT JOIN vtubers v ON g.vtuber_id = v.id
      WHERE g.status = 'active'
      LIMIT 5
    `);
    
    console.log('\n🎰 Sample Gacha campaigns:');
    if (gachas.length > 0) {
      gachas.forEach((g: any) => {
        console.log(`  - ${g.name} by ${g.channel_name}: ${g.price} points (${g.status})`);
      });
    } else {
      console.log('  No active Gacha campaigns found');
    }
    
    // Check if test data exists
    const testDataCheck = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM vtubers WHERE channel_name LIKE '%Luna%' OR channel_name LIKE '%Miko%'
    `);
    
    if (testDataCheck[0].count > 0) {
      console.log('\n✅ Test data is present in the database');
    } else {
      console.log('\n⚠️  Test data not found. Run "npm run db:sync" to insert test data');
    }
    
    await AppDataSource.destroy();
    console.log('\n🎉 Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection test failed:', error);
    process.exit(1);
  }
}

testConnection();