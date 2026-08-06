import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt.js";
import { createHttpError } from "../../utils/httpError.js";
import {
  sendAdminRegistrationNotification,
  sendForgotPasswordEmail,
} from "../../utils/emailService.js";

export const loginService = async (identifier, password) => {
  const cleanId = String(identifier).trim();

  // Find user by email, or student mobile/studentId
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanId, mode: "insensitive" } },
        { student: { mobile: cleanId } },
        { student: { studentId: { equals: cleanId, mode: "insensitive" } } },
      ],
    },
    include: {
      student: {
        include: {
          admission: {
            include: { course: true },
          },
        },
      },
    },
  });

  // If user account is not linked yet, check if an imported student record exists!
  if (!user) {
    const unlinkedStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { mobile: cleanId },
          { studentId: { equals: cleanId, mode: "insensitive" } },
          { email: { equals: cleanId, mode: "insensitive" } },
        ],
        userId: null,
      },
    });

    if (unlinkedStudent) {
      throw createHttpError(
        `Welcome student! Your profile (${unlinkedStudent.fullName} - ${unlinkedStudent.studentId}) exists in EduMaster, but you need to click 'Register' once to set your password.`,
        400
      );
    }

    throw createHttpError("Invalid credentials. Please check your details or click Register.", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError("Invalid credentials. Please check your password.", 401);
  }

  // Generate JWT Token
  const token = generateToken(user);

  // Remove password from response
  const { password: _, ...userData } = user;

  return {
    user: userData,
    token,
  };
};

export const registerStudentService = async ({
  fullName,
  mobile,
  email,
  password,
  gender = "Male",
  courseId,
  address,
}) => {
  const cleanMobile = String(mobile).trim();
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;

  // 1. Check if User already exists with this email or mobile
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        cleanEmail ? { email: cleanEmail } : undefined,
        { student: { mobile: cleanMobile } },
      ].filter(Boolean),
    },
    include: { student: true },
  });

  if (existingUser) {
    throw createHttpError(
      "Email or Mobile number is already registered! Please Login to your account. If you forgot your password, click Forgot Password.",
      400
    );
  }

  // 2. Check if an unlinked Student record exists from old system dump
  const existingUnlinkedStudent = await prisma.student.findFirst({
    where: {
      OR: [
        { mobile: cleanMobile },
        cleanEmail ? { email: cleanEmail } : undefined,
      ].filter(Boolean),
      userId: null,
    },
    include: {
      admission: {
        include: { course: true },
      },
    },
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const userEmail = cleanEmail || `${cleanMobile}@student.edumaster.local`;

  if (existingUnlinkedStudent) {
    // Link existing student to a new User account!
    const newUser = await prisma.user.create({
      data: {
        name: existingUnlinkedStudent.fullName || fullName,
        email: userEmail,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          connect: { id: existingUnlinkedStudent.id },
        },
      },
      include: {
        student: {
          include: {
            admission: { include: { course: true } },
          },
        },
      },
    });

    // Send Admin Email Notification for student registration
    sendAdminRegistrationNotification({
      fullName: newUser.name,
      studentId: existingUnlinkedStudent.studentId,
      mobile: cleanMobile,
      email: cleanEmail || userEmail,
    });

    const token = generateToken(newUser);
    const { password: _, ...userData } = newUser;

    return {
      user: userData,
      token,
      message: `Welcome back, ${existingUnlinkedStudent.fullName}! Your registration has been linked to your existing student profile (${existingUnlinkedStudent.studentId}).`,
      student: existingUnlinkedStudent,
    };
  }

  // 3. Create completely new Student registration
  let studentSeq = await prisma.sequence.findUnique({ where: { name: "STUDENT" } });
  const nextVal = (studentSeq?.currentValue || 100) + 1;
  await prisma.sequence.upsert({
    where: { name: "STUDENT" },
    update: { currentValue: nextVal },
    create: { name: "STUDENT", currentValue: nextVal },
  });

  const stuNum = `STU-2025-${String(nextVal).padStart(3, "0")}`;
  const admNum = `ADM-2025-${String(nextVal).padStart(3, "0")}`;
  const inqNum = `INQ-REG-${String(nextVal).padStart(3, "0")}`;

  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const adminId = adminUser?.id || "admin";

  let courseObj = null;
  if (courseId) {
    courseObj = await prisma.course.findUnique({ where: { id: courseId } });
  }
  if (!courseObj) {
    courseObj = await prisma.course.findFirst({ where: { isActive: true } });
  }

  const defaultLs = (await prisma.leadSource.findFirst())?.id || "default_ls";

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: fullName,
        email: userEmail,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    const inquiry = await tx.inquiry.create({
      data: {
        inquiryNumber: inqNum,
        fullName: fullName,
        mobile: cleanMobile,
        whatsapp: cleanMobile,
        gender: gender === "female" ? "Female" : "Male",
        email: cleanEmail,
        remarks: "Online self-registration via EduMaster Portal",
        expectedFees: courseObj ? courseObj.fees : 5000,
        status: "ADMISSION_DONE",
        courseId: courseObj ? courseObj.id : (await tx.course.findFirst()).id,
        leadSourceId: defaultLs,
        assignedToId: adminId,
      },
    });

    const admission = await tx.admission.create({
      data: {
        admissionNumber: admNum,
        inquiryId: inquiry.id,
        courseId: courseObj ? courseObj.id : (await tx.course.findFirst()).id,
        courseNameSnapshot: courseObj ? courseObj.name : "General Course",
        courseFeesSnapshot: courseObj ? courseObj.fees : 5000,
        admissionDate: new Date(),
        admissionYear: String(new Date().getFullYear()),
        courseFees: courseObj ? courseObj.fees : 5000,
        discount: 0,
        finalFees: courseObj ? courseObj.fees : 5000,
        paidAmount: 0,
        pendingAmount: courseObj ? courseObj.fees : 5000,
        remarks: "Online Self-Registration",
        studentCategory: "OTHER",
        guardianName: "Not Provided",
        guardianMobile: cleanMobile,
        guardianRelation: "OTHER",
        status: "ACTIVE",
        admittedBy: adminId,
      },
    });

    const student = await tx.student.create({
      data: {
        studentId: stuNum,
        userId: newUser.id,
        admissionId: admission.id,
        fullName: fullName,
        mobile: cleanMobile,
        whatsapp: cleanMobile,
        email: cleanEmail,
        gender: gender === "female" ? "Female" : "Male",
        address: address || null,
        status: "ACTIVE",
      },
    });

    return { newUser, student };
  });

  // Trigger Instant Admin Email Notification for new student registration
  sendAdminRegistrationNotification({
    fullName: result.newUser.name,
    studentId: result.student.studentId,
    mobile: cleanMobile,
    email: cleanEmail || userEmail,
  });

  const token = generateToken(result.newUser);
  const { password: _, ...userData } = result.newUser;

  return {
    user: userData,
    token,
    message: "Registration successful! Welcome to EduMaster.",
    student: result.student,
  };
};

export const forgotPasswordService = async (identifier) => {
  const cleanId = String(identifier).trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanId, mode: "insensitive" } },
        { student: { mobile: cleanId } },
        { student: { studentId: { equals: cleanId, mode: "insensitive" } } },
      ],
    },
  });

  if (!user) {
    throw createHttpError("No user account found with this Email, Mobile, or Student ID.", 404);
  }

  // Generate 6-digit OTP code
  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: resetOtp,
      resetTokenExpiry: expiry,
    },
  });

  // Send Email if email exists
  if (user.email && !user.email.endsWith("@student.edumaster.local")) {
    await sendForgotPasswordEmail(user.email, user.name, resetOtp);
  }

  return {
    message: `Password reset OTP generated successfully.`,
    email: user.email,
    otp: resetOtp,
  };
};

export const resetPasswordService = async (identifier, otpCode, newPassword) => {
  const cleanId = String(identifier).trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanId, mode: "insensitive" } },
        { student: { mobile: cleanId } },
        { student: { studentId: { equals: cleanId, mode: "insensitive" } } },
      ],
    },
  });

  if (!user) {
    throw createHttpError("User account not found.", 404);
  }

  if (!user.resetToken || user.resetToken !== String(otpCode).trim()) {
    throw createHttpError("Invalid OTP reset code. Please check and try again.", 400);
  }

  if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
    throw createHttpError("OTP reset code has expired. Please request a new one.", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return {
    message: "Password reset successful! You can now login with your new password.",
  };
};

export const getStudentProfileService = async (userId) => {
  const student = await prisma.student.findFirst({
    where: { userId },
    include: {
      admission: {
        include: {
          course: true,
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
      documents: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!student) {
    throw createHttpError("Student profile not found", 404);
  }

  return student;
};
