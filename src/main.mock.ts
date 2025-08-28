import { NestFactory } from '@nestjs/core';
import { AppMockModule } from './app.mock.module';

async function bootstrap() {
  const app = await NestFactory.create(AppMockModule);
  
  // CORS設定
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log('🚀 Mock server started successfully!');
  console.log(`📊 Server running on: http://localhost:${port}`);
  console.log('');
  console.log('📱 Available endpoints:');
  console.log(`  GET http://localhost:${port}/api/v1/vtubers - VTuber一覧`);
  console.log(`  GET http://localhost:${port}/api/v1/vtubers/popular - 人気VTuber`);
  console.log(`  GET http://localhost:${port}/api/v1/vtubers/:id - VTuber詳細`);
  console.log(`  GET http://localhost:${port}/api/v1/vtubers/:id/gachas - VTuberのガチャ`);
  console.log(`  GET http://localhost:${port}/api/v1/gacha - ガチャ一覧`);
  console.log(`  GET http://localhost:${port}/api/v1/gacha/:id - ガチャ詳細`);
  console.log('');
  console.log('💡 実際のDBと接続するには以下を実行してください:');
  console.log('   1. npm run supabase:setup');
  console.log('   2. .env.supabaseを編集');
  console.log('   3. npm run db:test');
  console.log('   4. npm run db:sync');
  console.log('   5. npm run dev');
}

bootstrap();