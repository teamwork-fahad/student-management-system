import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SQL dump file in workspace root
const dumpPath = path.resolve(__dirname, '../../../u123011961_appxwind.sql');

function parseInserts(sqlText, tableName) {
  const pattern = new RegExp(`INSERT INTO \`${tableName}\` \\(([^\\)]+)\\) VALUES\\s*([\\s\\S]*?);`, 'g');
  const rows = [];
  let match;
  while ((match = pattern.exec(sqlText)) !== null) {
    const cols = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
    const rawValues = match[2];
    const tuples = parseTuples(rawValues);
    tuples.forEach(tuple => {
      const obj = {};
      cols.forEach((col, idx) => {
        obj[col] = tuple[idx];
      });
      rows.push(obj);
    });
  }
  return rows;
}

function parseTuples(rawValues) {
  const tuples = [];
  let currentTuple = [];
  let currentVal = '';
  let inString = false;
  let quoteChar = '';
  let escape = false;
  let inTuple = false;

  for (let i = 0; i < rawValues.length; i++) {
    const char = rawValues[i];
    if (escape) {
      currentVal += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (inString) {
      if (char === quoteChar) {
        inString = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        quoteChar = char;
      } else if (char === '(' && !inTuple) {
        inTuple = true;
        currentTuple = [];
        currentVal = '';
      } else if (char === ')' && inTuple) {
        inTuple = false;
        currentTuple.push(cleanVal(currentVal));
        tuples.push(currentTuple);
        currentVal = '';
      } else if (char === ',' && inTuple) {
        currentTuple.push(cleanVal(currentVal));
        currentVal = '';
      } else if (inTuple) {
        currentVal += char;
      }
    }
  }
  return tuples;
}

function cleanVal(v) {
  v = v.trim();
  if (v.toUpperCase() === 'NULL') return null;
  if (!isNaN(v) && v !== '') return Number(v);
  return v;
}

function parseDuration(durationStr) {
  if (!durationStr) return { duration: 1, durationType: 'MONTHS' };
  const str = String(durationStr).toLowerCase();
  const num = parseInt(str.match(/\d+/)?.[0] || '1', 10);
  if (str.includes('day')) return { duration: num, durationType: 'DAYS' };
  if (str.includes('week')) return { duration: num, durationType: 'WEEKS' };
  if (str.includes('year')) return { duration: num, durationType: 'YEARS' };
  return { duration: num, durationType: 'MONTHS' };
}

function parseDate(dateVal) {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
}

function mapPaymentMode(modeStr) {
  if (!modeStr) return 'CASH';
  const s = String(modeStr).toLowerCase();
  if (s.includes('online') || s.includes('upi') || s.includes('gpay') || s.includes('paytm')) return 'UPI';
  if (s.includes('cheque')) return 'CHEQUE';
  if (s.includes('card')) return 'CARD';
  if (s.includes('bank') || s.includes('transfer')) return 'BANK_TRANSFER';
  return 'CASH';
}

async function migrateData() {
  console.log('🚀 Starting Data Migration from u123011961_appxwind.sql...');

  if (!fs.existsSync(dumpPath)) {
    console.error(`❌ SQL Dump file not found at: ${dumpPath}`);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(dumpPath, 'utf8');

  // 1. Get or Ensure Super Admin User
  let adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!adminUser) {
    console.log('Creating default Admin User...');
    adminUser = await prisma.user.create({
      data: {
        name: 'Fahad Sir',
        email: 'admin@appxwind.com',
        password: '$2b$10$e74V2t/XN17zFv1V4j14ceEw.x7W4.4O0rXp3mN4n8r6w/1.', // placeholder
        role: 'SUPER_ADMIN',
      },
    });
  }
  console.log(`✅ Admin User set: ${adminUser.name} (${adminUser.id})`);

  // 2. Import Courses
  const subcourses = parseInserts(sqlText, 'tbl_subcourse');
  const courseInfos = parseInserts(sqlText, 'tbl_course_info');
  console.log(`📦 Found ${subcourses.length} subcourses and ${courseInfos.length} main courses in dump.`);

  const courseMap = {}; // old course_id -> new Course.id

  for (const sc of subcourses) {
    const courseName = sc.sz_fullname || sc.sz_scname || 'Course ' + sc.nm_scid;
    const courseCode = sc.sz_code ? `CRS-${sc.sz_code}` : `CRS-${sc.nm_scid}`;
    const { duration, durationType } = parseDuration(sc.sz_duration);
    const fees = sc.nm_fees || 0.00;

    const course = await prisma.course.upsert({
      where: { code: courseCode },
      update: {
        name: courseName,
        fees: fees,
        duration: duration,
        durationType: durationType,
      },
      create: {
        name: courseName,
        code: courseCode,
        description: `Imported from legacy course ID ${sc.nm_scid}`,
        duration: duration,
        durationType: durationType,
        fees: fees,
        isActive: true,
      },
    });

    courseMap[sc.nm_scid] = course.id;
  }

  // Also map any tbl_course_info courses not yet mapped
  for (const ci of courseInfos) {
    const courseCode = ci.course_code ? `CRS-${ci.course_code}` : `CI-${ci.course_id}`;
    const courseName = ci.course_full_name || ci.course_code || 'Course ' + ci.course_id;

    const course = await prisma.course.upsert({
      where: { code: courseCode },
      update: {},
      create: {
        name: courseName,
        code: courseCode,
        description: `Imported from legacy course_info ID ${ci.course_id}`,
        duration: 3,
        durationType: 'MONTHS',
        fees: 5000.00,
        isActive: true,
      },
    });

    if (!courseMap[ci.course_id]) {
      courseMap[ci.course_id] = course.id;
    }
  }

  // Fallback default course
  let defaultCourse = await prisma.course.findFirst();
  if (!defaultCourse) {
    defaultCourse = await prisma.course.create({
      data: {
        name: 'General Computer Course',
        code: 'CRS-GEN',
        duration: 3,
        durationType: 'MONTHS',
        fees: 5000.00,
      },
    });
  }
  console.log(`✅ Courses imported. Total active courses: ${await prisma.course.count()}`);

  // 3. Import Lead Sources & Inquiries
  const rawInquiries = parseInserts(sqlText, 'tbl_student_inquiries');
  console.log(`📋 Found ${rawInquiries.length} inquiries in dump.`);

  const leadSourceMap = {};
  const inquiryMap = {}; // old inquiry_id -> new Inquiry.id

  for (const inq of rawInquiries) {
    const sourceName = (inq.inquiry_source || 'Direct').trim();
    if (!leadSourceMap[sourceName]) {
      const ls = await prisma.leadSource.upsert({
        where: { name: sourceName },
        update: {},
        create: {
          name: sourceName,
          description: 'Imported lead source',
        },
      });
      leadSourceMap[sourceName] = ls.id;
    }

    const leadSourceId = leadSourceMap[sourceName];
    const inqNum = `INQ-2025-${String(inq.inquiry_id).padStart(3, '0')}`;
    const inqDate = parseDate(inq.inquiry_date);
    
    // Map inquiry status
    let status = 'NEW';
    const s = String(inq.status || '').toLowerCase();
    if (s.includes('interested')) status = 'INTERESTED';
    else if (s.includes('admission') || s.includes('converted')) status = 'ADMISSION_DONE';
    else if (s.includes('close')) status = 'CLOSED';

    const matchedCourseId = defaultCourse.id;

    const inquiry = await prisma.inquiry.upsert({
      where: { inquiryNumber: inqNum },
      update: {
        fullName: inq.student_name || 'Prospect Student',
        mobile: String(inq.phone || '0000000000'),
        email: inq.email || null,
        remarks: inq.message || null,
      },
      create: {
        inquiryNumber: inqNum,
        fullName: inq.student_name || 'Prospect Student',
        mobile: String(inq.phone || '0000000000'),
        whatsapp: String(inq.phone || '0000000000'),
        gender: (inq.gender || 'Male').toLowerCase() === 'female' ? 'Female' : 'Male',
        email: inq.email || null,
        remarks: inq.message || null,
        expectedFees: 0.00,
        inquiryDate: inqDate,
        nextFollowUpDate: new Date(inqDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: status,
        courseId: matchedCourseId,
        leadSourceId: leadSourceId,
        assignedToId: adminUser.id,
      },
    });

    inquiryMap[inq.inquiry_id] = inquiry.id;
  }
  console.log(`✅ Inquiries imported. Total inquiries: ${await prisma.inquiry.count()}`);

  // 4. Import Students, Admissions, and Fee Payments
  const rawStudents = parseInserts(sqlText, 'tbl_student_info');
  const rawAdmissions = parseInserts(sqlText, 'tbl_student_wise_course_info');
  const rawFees = parseInserts(sqlText, 'tbl_fees_info');

  console.log(`👨‍🎓 Found ${rawStudents.length} students, ${rawAdmissions.length} admissions, ${rawFees.length} fee receipts.`);

  const studentInfoMap = {};
  rawStudents.forEach(s => {
    studentInfoMap[s.student_id] = s;
  });

  // Calculate fee sums per swcid
  const feeSumsMap = {};
  const feeListMap = {};
  rawFees.forEach(f => {
    const swcid = f.swcid;
    feeSumsMap[swcid] = (feeSumsMap[swcid] || 0) + (Number(f.amount) || 0);
    if (!feeListMap[swcid]) feeListMap[swcid] = [];
    feeListMap[swcid].push(f);
  });

  let importedAdmissionsCount = 0;
  let importedPaymentsCount = 0;

  for (const adm of rawAdmissions) {
    const swcid = adm.swcid;
    const oldStudent = studentInfoMap[adm.student_id] || {};

    const studentName = oldStudent.student_name || 'Student ' + adm.student_id;
    const mobile = String(oldStudent.mobile || '0000000000');
    const email = oldStudent.email || null;
    const gender = (oldStudent.gender || 'male').toLowerCase() === 'female' ? 'Female' : 'Male';
    const address = oldStudent.address || null;
    const dob = oldStudent.dob ? parseDate(oldStudent.dob) : null;
    const joinedDate = parseDate(adm.start_date || oldStudent.doj);

    const targetCourseId = courseMap[adm.course_id] || defaultCourse.id;
    const courseObj = await prisma.course.findUnique({ where: { id: targetCourseId } });
    const courseNameSnapshot = courseObj ? courseObj.name : 'Course';
    const courseFeesSnapshot = Number(adm.total_fees) || 5000;

    const courseFees = Number(adm.total_fees) || 0;
    const discount = Number(adm.discount) || 0;
    const finalFees = Math.max(0, courseFees - discount);
    const paidAmount = feeSumsMap[swcid] || 0;
    const pendingAmount = Math.max(0, finalFees - paidAmount);

    const admNum = `ADM-2025-${String(swcid).padStart(3, '0')}`;
    const stuNum = `STU-2025-${String(swcid).padStart(3, '0')}`;

    // Ensure corresponding Inquiry for this admission
    let inquiryId = inquiryMap[swcid];
    if (!inquiryId) {
      const defaultLs = Object.values(leadSourceMap)[0] || (await prisma.leadSource.findFirst()).id;
      const inq = await prisma.inquiry.create({
        data: {
          inquiryNumber: `INQ-ADM-${String(swcid).padStart(3, '0')}`,
          fullName: studentName,
          mobile: mobile,
          whatsapp: mobile,
          gender: gender,
          email: email,
          remarks: 'Created automatically for imported admission',
          expectedFees: finalFees,
          inquiryDate: joinedDate,
          nextFollowUpDate: joinedDate,
          status: 'ADMISSION_DONE',
          courseId: targetCourseId,
          leadSourceId: defaultLs,
          assignedToId: adminUser.id,
        },
      });
      inquiryId = inq.id;
    }

    let status = 'ACTIVE';
    if (adm.student_status === 'Completed') status = 'COMPLETED';
    else if (adm.student_status === 'Dropped' || adm.is_active === 1) status = 'CANCELLED';

    // Create or update Admission
    const admission = await prisma.admission.upsert({
      where: { admissionNumber: admNum },
      update: {
        courseFees: courseFees,
        discount: discount,
        finalFees: finalFees,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
      },
      create: {
        admissionNumber: admNum,
        inquiryId: inquiryId,
        courseId: targetCourseId,
        courseNameSnapshot: courseNameSnapshot,
        courseFeesSnapshot: courseFeesSnapshot,
        admissionDate: joinedDate,
        admissionYear: String(joinedDate.getFullYear()),
        courseFees: courseFees,
        discount: discount,
        finalFees: finalFees,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        remarks: adm.fees_remark || adm.course_remark || null,
        studentCategory: 'OTHER',
        guardianName: 'Not Provided',
        guardianMobile: mobile,
        guardianRelation: 'OTHER',
        status: status,
        admittedBy: adminUser.id,
      },
    });

    importedAdmissionsCount++;

    // Create or update Student linked to this admission
    const studentStatus = status === 'ACTIVE' ? 'ACTIVE' : (status === 'COMPLETED' ? 'COMPLETED' : 'DROPPED');
    await prisma.student.upsert({
      where: { studentId: stuNum },
      update: {
        fullName: studentName,
        mobile: mobile,
        email: email,
        address: address,
        status: studentStatus,
      },
      create: {
        studentId: stuNum,
        admissionId: admission.id,
        fullName: studentName,
        mobile: mobile,
        whatsapp: mobile,
        email: email,
        gender: gender,
        dob: dob,
        address: address,
        joinedDate: joinedDate,
        status: studentStatus,
      },
    });

    // Import Fee Receipts for this admission
    const receiptList = feeListMap[swcid] || [];
    for (const f of receiptList) {
      const pMode = mapPaymentMode(f.fees_type);
      const pDate = parseDate(f.fees_date);
      const pAmount = Number(f.amount) || 0;

      // Avoid creating duplicate payment if exists
      const existingPayment = await prisma.admissionPayment.findFirst({
        where: {
          admissionId: admission.id,
          amount: pAmount,
          paymentDate: pDate,
        },
      });

      if (!existingPayment) {
        await prisma.admissionPayment.create({
          data: {
            admissionId: admission.id,
            amount: pAmount,
            paymentMode: pMode,
            transactionReference: f.fees_remark || `OLD-REC-${f.fees_id}`,
            paymentDate: pDate,
            remarks: f.fees_remark || `Imported receipt #${f.fees_id}`,
          },
        });
        importedPaymentsCount++;
      }
    }
  }

  console.log(`✅ Admissions & Students imported: ${importedAdmissionsCount}`);
  console.log(`✅ Fee Payment Receipts imported: ${importedPaymentsCount}`);

  // 5. Update Sequence Counters
  const maxSwcid = Math.max(...rawAdmissions.map(a => Number(a.swcid) || 0), 100);
  const maxFeesId = Math.max(...rawFees.map(f => Number(f.fees_id) || 0), 100);

  await prisma.sequence.upsert({
    where: { name: 'ADMISSION' },
    update: { currentValue: maxSwcid },
    create: { name: 'ADMISSION', currentValue: maxSwcid },
  });

  await prisma.sequence.upsert({
    where: { name: 'STUDENT' },
    update: { currentValue: maxSwcid },
    create: { name: 'STUDENT', currentValue: maxSwcid },
  });

  await prisma.sequence.upsert({
    where: { name: 'RECEIPT' },
    update: { currentValue: maxFeesId },
    create: { name: 'RECEIPT', currentValue: maxFeesId },
  });

  console.log(`✅ Sequence counters updated (ADMISSION=${maxSwcid}, STUDENT=${maxSwcid}, RECEIPT=${maxFeesId}).`);
  console.log('\n🎉 ALL DATA MIGRATION COMPLETED SUCCESSFULLY!');
}

migrateData()
  .catch(err => {
    console.error('❌ Data Migration Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
