import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.generation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.creditsTransaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.model.deleteMany();

  console.log('✅ Cleared existing data');

  // Seed Models
  const models = [
    // Video Generation
    {
      id: 'sora-2-pro',
      provider: 'piapi',
      name: 'Sora 2 Pro',
      type: 'TEXT_TO_VIDEO',
      quality: '4K',
      speedTier: 'fast',
      pricing: { '5s-720p': 25, '5s-1080p': 50, '10s-720p': 50, '10s-1080p': 100, '15s-720p': 75, '15s-1080p': 150 },
      apiModelId: 'sora-2-pro',
      isActive: true
    },
    {
      id: 'pollo-3.0',
      provider: 'grsai',
      name: 'Pollo 3.0',
      type: 'TEXT_TO_VIDEO',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { '5s-720p': 20, '5s-1080p': 40, '10s-720p': 40, '10s-1080p': 80, '15s-720p': 60, '15s-1080p': 120 },
      apiModelId: 'pollo-30',
      isActive: true
    },
    {
      id: 'seedance-2.0',
      provider: 'grsai',
      name: 'Seedance 2.0',
      type: 'TEXT_TO_VIDEO',
      quality: '1080p',
      speedTier: 'very_fast',
      pricing: { '5s-720p': 15, '5s-1080p': 35, '10s-720p': 35, '10s-1080p': 70, '15s-720p': 50, '15s-1080p': 105 },
      apiModelId: 'seedance-20',
      isActive: true
    },
    {
      id: 'veo-3.1',
      provider: 'apimart',
      name: 'Veo 3.1',
      type: 'TEXT_TO_VIDEO',
      quality: '4K',
      speedTier: 'medium',
      pricing: { '5s-720p': 20, '5s-1080p': 45, '10s-720p': 45, '10s-1080p': 90, '15s-720p': 65, '15s-1080p': 135 },
      apiModelId: 'veo-31',
      isActive: true
    },

    // Image Generation
    {
      id: 'midjourney',
      provider: 'pic2api',
      name: 'Midjourney',
      type: 'TEXT_TO_IMAGE',
      quality: 'high',
      speedTier: 'medium',
      pricing: { 'standard': 5 },
      apiModelId: 'midjourney-v6',
      isActive: true
    },
    {
      id: 'dall-e-3',
      provider: 'pic2api',
      name: 'DALL-E 3',
      type: 'TEXT_TO_IMAGE',
      quality: 'high',
      speedTier: 'fast',
      pricing: { 'standard': 8 },
      apiModelId: 'dall-e-3',
      isActive: true
    },
    {
      id: 'flux',
      provider: 'apipod',
      name: 'Flux',
      type: 'TEXT_TO_IMAGE',
      quality: 'high',
      speedTier: 'very_fast',
      pricing: { 'standard': 3 },
      apiModelId: 'flux-pro',
      isActive: true
    },

    // Video Enhancement
    {
      id: 'upscaler-4k',
      provider: 'apimart',
      name: 'Video Upscaler 4K',
      type: 'VIDEO_UPSCALE',
      quality: '4K',
      speedTier: 'fast',
      pricing: { '720p-to-1080p': 50, '1080p-to-4k': 100 },
      apiModelId: 'upscaler-4k',
      isActive: true
    }
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { id: model.id },
      update: model,
      create: model
    });
  }

  console.log(`✅ Seeded ${models.length} AI models`);

  // Create a test admin user (for development)
  const adminEmail = 'admin@tryvirlo.com';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      googleId: 'google_admin_test',
      name: 'Admin User',
      plan: 'ENTERPRISE',
      creditsBalance: 99999,
      creditsMonthlyReset: 99999,
      role: 'ADMIN',
      emailVerified: true
    }
  });

  await prisma.adminUser.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      permissions: {
        canManageUsers: true,
        canViewAnalytics: true,
        canManageSubscriptions: true,
        canManageGenerations: true
      }
    }
  });

  console.log('✅ Created admin user (admin@tryvirlo.com)');
  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Email: admin@tryvirlo.com');
  console.log('  Google ID: google_admin_test (for local development)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
