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
    // Text to Video
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
      provider: 'piapi',
      name: 'Pollo 3.0',
      type: 'TEXT_TO_VIDEO',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { '5s-720p': 20, '5s-1080p': 40, '10s-720p': 40, '10s-1080p': 80, '15s-720p': 60, '15s-1080p': 120 },
      apiModelId: 'pollo-3.0',
      isActive: true
    },
    {
      id: 'seedance-2.0',
      provider: 'piapi',
      name: 'Seedance 2.0',
      type: 'TEXT_TO_VIDEO',
      quality: '1080p',
      speedTier: 'very_fast',
      pricing: { '5s-720p': 15, '5s-1080p': 35, '10s-720p': 35, '10s-1080p': 70, '15s-720p': 50, '15s-1080p': 105 },
      apiModelId: 'seedance-2.0',
      isActive: true
    },
    {
      id: 'veo-3.1',
      provider: 'grsai',
      name: 'Veo 3.1',
      type: 'TEXT_TO_VIDEO',
      quality: '4K',
      speedTier: 'medium',
      pricing: { '5s-720p': 20, '5s-1080p': 45, '10s-720p': 45, '10s-1080p': 90, '15s-720p': 65, '15s-1080p': 135 },
      apiModelId: 'veo-3.1',
      isActive: true
    },
    {
      id: 'kling-2.5',
      provider: 'grsai',
      name: 'Kling 2.5',
      type: 'TEXT_TO_VIDEO',
      quality: '1080p',
      speedTier: 'medium',
      pricing: { '5s-720p': 18, '5s-1080p': 42, '10s-720p': 42, '10s-1080p': 84, '15s-720p': 62, '15s-1080p': 128 },
      apiModelId: 'kling-2.5',
      isActive: true
    },
    {
      id: 'runway-gen3',
      provider: 'grsai',
      name: 'Runway Gen3',
      type: 'TEXT_TO_VIDEO',
      quality: '4K',
      speedTier: 'slow',
      pricing: { '5s-720p': 22, '5s-1080p': 55, '10s-720p': 55, '10s-1080p': 110, '15s-720p': 80, '15s-1080p': 165 },
      apiModelId: 'runway-gen3',
      isActive: true
    },

    // Image to Video
    {
      id: 'animate-diff',
      provider: 'pic2api',
      name: 'Animate Diff',
      type: 'IMAGE_TO_VIDEO',
      quality: '1080p',
      speedTier: 'medium',
      pricing: { '5s': 35, '10s': 70, '15s': 105 },
      apiModelId: 'animate-diff',
      isActive: true
    },
    {
      id: 'motion-v1',
      provider: 'pic2api',
      name: 'Motion V1',
      type: 'IMAGE_TO_VIDEO',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { '5s': 30, '10s': 60, '15s': 90 },
      apiModelId: 'motion-v1',
      isActive: true
    },
    {
      id: 'live-portrait',
      provider: 'pic2api',
      name: 'Live Portrait',
      type: 'IMAGE_TO_VIDEO',
      quality: '4K',
      speedTier: 'slow',
      pricing: { '5s': 45, '10s': 90, '15s': 135 },
      apiModelId: 'live-portrait',
      isActive: true
    },

    // Text to Image
    {
      id: 'flux-pro',
      provider: 'apimart',
      name: 'Flux Pro',
      type: 'TEXT_TO_IMAGE',
      quality: '4K',
      speedTier: 'medium',
      pricing: { 'standard': 15 },
      apiModelId: 'flux-pro',
      isActive: true
    },
    {
      id: 'flux-schnell',
      provider: 'apimart',
      name: 'Flux Schnell',
      type: 'TEXT_TO_IMAGE',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { 'standard': 10 },
      apiModelId: 'flux-schnell',
      isActive: true
    },
    {
      id: 'midjourney',
      provider: 'apimart',
      name: 'Midjourney',
      type: 'TEXT_TO_IMAGE',
      quality: '4K',
      speedTier: 'slow',
      pricing: { 'standard': 20 },
      apiModelId: 'midjourney',
      isActive: true
    },
    {
      id: 'stable-diffusion',
      provider: 'apimart',
      name: 'Stable Diffusion',
      type: 'TEXT_TO_IMAGE',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { 'standard': 12 },
      apiModelId: 'stable-diffusion',
      isActive: true
    },

    // Video Upscale
    {
      id: 'videoupscale-pro',
      provider: 'apipod',
      name: 'Video Upscale Pro',
      type: 'VIDEO_UPSCALE',
      quality: '4K',
      speedTier: 'medium',
      pricing: { '720p-to-1080p': 15, '1080p-to-4k': 25 },
      apiModelId: 'videoupscale-pro',
      isActive: true
    },
    {
      id: 'videoupscale-fast',
      provider: 'apipod',
      name: 'Video Upscale Fast',
      type: 'VIDEO_UPSCALE',
      quality: '1080p',
      speedTier: 'fast',
      pricing: { '720p-to-1080p': 10 },
      apiModelId: 'videoupscale-fast',
      isActive: true
    },
    {
      id: 'videoupscale-anim',
      provider: 'apipod',
      name: 'Video Upscale Anime',
      type: 'VIDEO_UPSCALE',
      quality: '4K',
      speedTier: 'slow',
      pricing: { '720p-to-1080p': 18, '1080p-to-4k': 30 },
      apiModelId: 'videoupscale-anim',
      isActive: true
    }
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { id: model.id },
      update: model as any,
      create: model as any
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
