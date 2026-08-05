-- CreateEnum
CREATE TYPE "public"."AdmissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StudentStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'DROPPED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."StudentCategory" AS ENUM ('SCHOOL', 'COLLEGE', 'WORKING', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GuardianRelation" AS ENUM ('FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('PHOTO', 'AADHAAR', 'PAN', 'MARKSHEET_10', 'MARKSHEET_12', 'GRADUATION', 'ADDRESS_PROOF', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Sequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admission" (
    "id" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "studentId" TEXT,
    "courseId" TEXT NOT NULL,
    "batchId" TEXT,
    "courseNameSnapshot" TEXT NOT NULL,
    "courseFeesSnapshot" DECIMAL(10,2) NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseFees" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "finalFees" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pendingAmount" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "referredBy" TEXT,
    "studentCategory" "public"."StudentCategory" NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianMobile" TEXT NOT NULL,
    "guardianRelation" "public"."GuardianRelation" NOT NULL,
    "status" "public"."AdmissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdmissionPayment" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL,
    "transactionReference" TEXT,
    "remarks" TEXT,
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "userId" TEXT,
    "admissionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "gender" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "pincode" TEXT,
    "qualification" TEXT,
    "schoolCollege" TEXT,
    "bloodGroup" TEXT,
    "aadhaarNumber" TEXT,
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftDate" TIMESTAMP(3),
    "status" "public"."StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "documentNumber" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_name_key" ON "public"."Sequence"("name");

-- CreateIndex
CREATE INDEX "Sequence_instituteId_idx" ON "public"."Sequence"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_admissionNumber_key" ON "public"."Admission"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_inquiryId_key" ON "public"."Admission"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_studentId_key" ON "public"."Admission"("studentId");

-- CreateIndex
CREATE INDEX "Admission_admissionNumber_idx" ON "public"."Admission"("admissionNumber");

-- CreateIndex
CREATE INDEX "Admission_inquiryId_idx" ON "public"."Admission"("inquiryId");

-- CreateIndex
CREATE INDEX "Admission_studentId_idx" ON "public"."Admission"("studentId");

-- CreateIndex
CREATE INDEX "Admission_courseId_idx" ON "public"."Admission"("courseId");

-- CreateIndex
CREATE INDEX "Admission_batchId_idx" ON "public"."Admission"("batchId");

-- CreateIndex
CREATE INDEX "Admission_status_idx" ON "public"."Admission"("status");

-- CreateIndex
CREATE INDEX "Admission_admissionDate_idx" ON "public"."Admission"("admissionDate");

-- CreateIndex
CREATE INDEX "Admission_deletedAt_idx" ON "public"."Admission"("deletedAt");

-- CreateIndex
CREATE INDEX "Admission_instituteId_idx" ON "public"."Admission"("instituteId");

-- CreateIndex
CREATE INDEX "AdmissionPayment_admissionId_idx" ON "public"."AdmissionPayment"("admissionId");

-- CreateIndex
CREATE INDEX "AdmissionPayment_paymentMode_idx" ON "public"."AdmissionPayment"("paymentMode");

-- CreateIndex
CREATE INDEX "AdmissionPayment_createdAt_idx" ON "public"."AdmissionPayment"("createdAt");

-- CreateIndex
CREATE INDEX "AdmissionPayment_instituteId_idx" ON "public"."AdmissionPayment"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "public"."Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "public"."Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionId_key" ON "public"."Student"("admissionId");

-- CreateIndex
CREATE INDEX "Student_studentId_idx" ON "public"."Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_admissionId_idx" ON "public"."Student"("admissionId");

-- CreateIndex
CREATE INDEX "Student_userId_idx" ON "public"."Student"("userId");

-- CreateIndex
CREATE INDEX "Student_mobile_idx" ON "public"."Student"("mobile");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "public"."Student"("email");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "public"."Student"("status");

-- CreateIndex
CREATE INDEX "Student_joinedDate_idx" ON "public"."Student"("joinedDate");

-- CreateIndex
CREATE INDEX "Student_deletedAt_idx" ON "public"."Student"("deletedAt");

-- CreateIndex
CREATE INDEX "Student_instituteId_idx" ON "public"."Student"("instituteId");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_idx" ON "public"."StudentDocument"("studentId");

-- CreateIndex
CREATE INDEX "StudentDocument_documentType_idx" ON "public"."StudentDocument"("documentType");

-- CreateIndex
CREATE INDEX "StudentDocument_verified_idx" ON "public"."StudentDocument"("verified");

-- CreateIndex
CREATE INDEX "StudentDocument_createdAt_idx" ON "public"."StudentDocument"("createdAt");

-- CreateIndex
CREATE INDEX "StudentDocument_instituteId_idx" ON "public"."StudentDocument"("instituteId");

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdmissionPayment" ADD CONSTRAINT "AdmissionPayment_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
