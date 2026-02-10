import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = crypto.createHash('sha256').update('test123').digest('hex');
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      name: 'Test User',
      role: 'user'
    }
  });
  
  console.log('✅ User created:', user.email, user.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
