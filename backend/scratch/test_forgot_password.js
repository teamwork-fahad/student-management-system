import prisma from '../src/config/prisma.js';
import { forgotPasswordService, resetPasswordService, loginService } from '../src/modules/auth/auth.service.js';

async function testAll() {
  console.log('🧪 1. Testing Forgot Password OTP email generation...');
  const res1 = await forgotPasswordService('hitarthbhathawala@gmail.com');
  console.log('✅ OTP email sent response:', res1);

  console.log('\n🧪 2. Testing Reset Password with OTP:', res1.otp);
  const res2 = await resetPasswordService('hitarthbhathawala@gmail.com', res1.otp, 'Hitarth@123');
  console.log('✅ Reset password response:', res2);

  console.log('\n🧪 3. Testing Login with new password...');
  const res3 = await loginService('hitarthbhathawala@gmail.com', 'Hitarth@123');
  console.log('✅ LOGIN SUCCESSFUL! Student user:', res3.user.name, 'Role:', res3.user.role, 'Student ID:', res3.user.student?.studentId);
}

testAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
