import prisma from "../config/prisma.js";

const RAW_SQL_DATA = [
  { id: 5, name: 'Rana Krisha Jayeshbhai ', email: 'Krisharana0806@gmail.com', mobile: '9875224700', gender: 'female', city: 'Surat, gujrat ', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120', date: '2025-11-26' },
  { id: 6, name: 'Ahir Vency Kiritbhai ', email: 'ahirvency10@gmail.com', mobile: '7096053554', gender: 'female', city: 'SURAT', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-11-26' },
  { id: 7, name: 'Khushi Vijaybhai Gavit', email: 'khushigavit88@gmail.com', mobile: '8485928171', gender: 'female', city: 'Surat, Gujarat ', university: 'VNSGU', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College Of Information Science', degree: 'BCA', semester: 'sem6', track: 'Web Development', duration: '120 Hours', date: '2025-11-26' },
  { id: 8, name: 'Chaudhari Fenikumari Satishbhai ', email: 'chaudharifeny608@gmail.com', mobile: '8980948035', gender: 'female', city: 'Surat, Gujarat ', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hr', date: '2025-11-26' },
  { id: 9, name: 'Vaishnavi Shailesh Kumar Jariwala ', email: 'jariwalavaishnavi77@gmail.com', mobile: '9879716925', gender: 'female', city: 'Surat ', university: 'VNSGU ', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College Of Information Science', degree: 'BCA ', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-11-26' },
  { id: 10, name: 'Kinjal Vijaybhai Champaneria ', email: 'kinjalchampaneria1712@gmail.com', mobile: '7861089504', gender: 'female', city: 'Surat, Gujarat ', university: 'Vnsgu ', college: 'C B Patel Computer College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-11-26' },
  { id: 11, name: 'Dharmishtha Chauhan', email: 'dharmishthachauhan52@gmail.com', mobile: '9723062988', gender: 'female', city: 'Surat', university: 'Vnsgus', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College Of Information Science', degree: 'BCA', semester: 'sem6', track: 'Web Development', duration: '120 hours', date: '2025-11-26' },
  { id: 12, name: 'Rana Astha Jackiekumar ', email: 'astha432006@gmail.com', mobile: '8160777022', gender: 'female', city: 'surat', university: 'Veer narmad south gujarat univercity', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College Of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 Hours', date: '2025-11-24' },
  { id: 13, name: 'Baraiya Niddhi JagdishBhai ', email: 'baraiyasavan21@gmail.com', mobile: '7859900509', gender: 'female', city: 'Surat', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120', date: '2025-11-24' },
  { id: 14, name: 'Krutika Kalpeshbhai Jariwala ', email: 'krutikaghantiwala7@gmail.com', mobile: '7041101260', gender: 'female', city: 'Surat', university: 'VNSGU', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College Of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-11-28' },
  { id: 15, name: 'Gadiwala Hanisha Mukeshbhai ', email: 'hanishagadiwala22@gmail.com', mobile: '8733934794', gender: 'female', city: 'Surat Gujarat ', university: 'Veer narmad south gujarat university ', college: 'Shree Uttar Gujarat BBA & BCA College', degree: 'Bca', semester: 'sem6', track: 'API Development', duration: '120hrs', date: '2025-11-28' },
  { id: 16, name: 'Dubey Khushi Jeetendra', email: 'khushidubey7605@gmail.com', mobile: '7600232171', gender: 'female', city: 'Surat/Gujarat', university: 'Veer Narmad South Gujarat University', college: 'Shree Uttar Gujarat BBA & BCA College', degree: 'BCA', semester: 'sem6', track: 'Data Science', duration: '120hrs', date: '2025-11-26' },
  { id: 19, name: 'Rahila', email: 'rahilahafezi@gmail.com', mobile: '8160182717', gender: 'female', city: 'Surat', university: 'Veer Narmad South Gujarat University ', college: 'Shree Uttar Gujarat BBA & BCA College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-11-26' },
  { id: 26, name: 'SAKALLEY VEDANSH SANDEEP ', email: 'krishnasakalley007@gmail.com', mobile: '8980127006', gender: 'male', city: 'Surat, Gujarat', university: 'VNSGU ', college: 'SDJ International College(VESU)', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-01' },
  { id: 27, name: 'Jariwala Riya Shaileshkumar', email: 'jariwalariya94@gmail.email', mobile: '9687415585', gender: 'female', city: 'Surat, Gujarat ', university: 'VVWU', college: 'Vanita Vishram Women\'s University', degree: 'M.Sc IT', semester: 'sem6', track: 'API Development', duration: '130  hours ,4 weeks', date: '2025-12-01' },
  { id: 28, name: 'Jariwala Dharmika Tejaskumar ', email: 'dharmikajariwala66@gmail.com', mobile: '9327911256', gender: 'female', city: 'Surat, Gujarat ', university: 'VVWU', college: 'Vanita Vishram Women\'s University ', degree: 'M.sc. IT', semester: 'sem6', track: 'API Development', duration: '120 hours , 4 week ', date: '2025-12-01' },
  { id: 29, name: 'Vaishnavi Harishbhai Gilitwala', email: 'gilitwalavaishnavi@gmail.com', mobile: '7046591616', gender: 'female', city: 'Surat,Gujarat', university: 'Veer Narmad South Gujarat University ', college: 'J P Dawer Institute of Information and Communication Technology ', degree: 'BScIT + MScIT Integrated', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-03' },
  { id: 30, name: 'MALI ARCHI MAYANK KUMAR', email: 'maliarchi85@gmail.com', mobile: '9023198520', gender: 'female', city: 'surat', university: 'Veer Narmad South Gujarat University', college: 'SDJ International College(VESU)', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours , 20 days', date: '2025-12-03' },
  { id: 32, name: 'Jariwala Harshil Hiteshkumar', email: 'jariwalaharshil999@gmail.com', mobile: '6355001758', gender: 'male', city: 'Surat Gujarat ', university: 'Veer Narmad South Gujarat University', college: 'Sascma English Medium Commerce College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-06' },
  { id: 33, name: 'Dey sushant Kiran Bhai ', email: 'deysushant23@gmail.com', mobile: '9624468344', gender: 'male', city: 'Surat, gujrat ', university: 'Veer Narmad South Gujarat University', college: 'Sascma English Medium Commerce College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hr', date: '2025-12-06' },
  { id: 34, name: 'Kapadia Meshva Riteshkumar', email: 'meshvakapadia05@gmail.com', mobile: '6353046881', gender: 'male', city: 'Surat', university: 'Veer Narmad South Gujarat University', college: 'Sascma English Medium Commerce College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-06' },
  { id: 35, name: 'Abdul Rehman Dhanani', email: 'arehmandhanani683@gmail.com', mobile: '9099889851', gender: 'male', city: 'Surat', university: 'Vnsgu', college: 'C B Patel Computer College', degree: 'Bca', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-08' },
  { id: 36, name: 'CHOKSI SAFWAN ANJUM ', email: 'saffanchoksi@gmail.com', mobile: '7046727986', gender: 'male', city: 'Surat Gujarat ', university: 'V. N. S. G. U', college: 'UDHNA CITIZEN ', degree: 'Bca', semester: 'sem6', track: 'API Development', duration: '120', date: '2025-12-08' },
  { id: 37, name: 'Choksi M. Ibrahim M. Amin', email: 'ibrahimchoksi0786@gmail.com', mobile: '7096047850', gender: 'male', city: 'Surat, Gujarat ', university: 'VNSGU ', college: 'UDHNA CITIZEN ', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-08' },
  { id: 38, name: 'Chauhan khushi prakashbhai', email: 'Khushichauhan5657@gmail.com', mobile: '9638837850', gender: 'female', city: 'SURAT', university: 'Veer narmad south gujarat university ', college: 'Shree uttar Gujarat bba & bca college', degree: 'Bca', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-09' },
  { id: 39, name: 'Abdul Ahad Shaikh', email: 'ahadshaikh0513@gmail.com', mobile: '9265380450', gender: 'male', city: 'Surat', university: 'Vnsgu', college: 'C.K Pithawalla College of Engineering & Technology', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120', date: '2025-12-09' },
  { id: 40, name: 'Jha Nayan Pawan Kumar', email: 'jjhanayan@gmail.com', mobile: '8866726718', gender: 'male', city: 'Surat, Gujarat ', university: 'V.N.S.G.U', college: 'UDHNA CITIZEN ', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-08' },
  { id: 41, name: 'Savaliya palak pareshbhai ', email: 'savaliyapalak99@gmail.com', mobile: '7383883163', gender: 'female', city: 'Surat', university: 'Veer narmad South gujarat University ', college: 'Shree uttar gujarat bba & bca college ', degree: 'Bca', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-09' },
  { id: 42, name: 'Dobariya Prina Ashvinbhai', email: 'prinadobariya317@gmail.com', mobile: '8866440035', gender: 'female', city: 'Surat', university: 'veer narmad south gujarat  university', college: 'UDHNA CITIZEN ', degree: 'b.c.a', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-11' },
  { id: 43, name: 'Jain Naman Ganeshbhai ', email: 'namanjain1390@gmail.com', mobile: '7014256294', gender: 'male', city: 'Surat,Gujarat ', university: 'Veer Narmad South Gujarat University ', college: 'Sascma English Medium Commerce College', degree: 'BCA ', semester: 'sem6', track: 'API Development', duration: '120', date: '2025-12-06' },
  { id: 44, name: 'Patrawala Hasnain Mohammad', email: 'mohammadhasnen12345@gmail.com', mobile: '7778099973', gender: 'male', city: 'Surat, Gujarat', university: 'V.N.S.G.U', college: 'C B Patel Computer College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-08' },
  { id: 45, name: 'Khatri Hritik Nareshbhai ', email: 'ritikkhatri51@gmail.com', mobile: '8980052655', gender: 'male', city: 'Surat', university: 'Veer narmad south gujarat university ', college: 'Smt Z S patel computer application collage ', degree: 'Bca ', semester: 'sem6', track: 'API Development', duration: '120hr', date: '2025-12-08' },
  { id: 47, name: 'Abdul Qayyum Mohammad Naeem Hakimji ', email: 'hakimjiqayyum2005@gmail.com', mobile: '9724550410', gender: 'male', city: 'Surat, Gujarat ', university: 'Vnsgu', college: 'Sascma English Medium Commerce College', degree: 'BCA', semester: 'sem6', track: 'Web Development, API Development', duration: '120 hours ', date: '2025-12-11' },
  { id: 48, name: 'Dave Vidishaben Yogeshbhai', email: 'vidisha1412dave@gmail.com', mobile: '9904144288', gender: 'female', city: 'Surat, Gujarat.', university: 'Veer Narmand South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 Hours', date: '2025-12-15' },
  { id: 49, name: 'Dharia krisha nilesh', email: 'dhariakrisha0@gmail.com', mobile: '9054235539', gender: 'female', city: 'Surat, Gujarat', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-15' },
  { id: 50, name: 'Degawala Keshvi Jigneshkumar', email: 'keshvidegawala@gmail.com', mobile: '9426804707', gender: 'female', city: 'Surat, Gujarat', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-15' },
  { id: 51, name: 'Patel Dhruvikumari Anandbhai', email: 'dhruvipatel9023@gmail.com', mobile: '9023735317', gender: 'female', city: 'surat,gujarat', university: 'Veer Narmad South Gujarat University', college: 'Smt. Tanuben & Dr. Manubhai Trivedi College of Information Science', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-15' },
  { id: 52, name: 'Shaikh Mohammed sahil samsulhak', email: 'shaikhfatema2702@gmail.com', mobile: '9737678636', gender: 'male', city: 'Surat,gujarat', university: 'Veer narmad south gujarat university(vnsgu)', college: 'C.K Pithawalla College of Engineering & Technology', degree: 'BCA', semester: 'sem6', track: 'Web Development, API Development', duration: '120 hours ', date: '2025-12-15' },
  { id: 53, name: 'Saiyed saad saeed ', email: 'saadsaiyed1410@gmail.com', mobile: '9824529270', gender: 'male', city: 'Surat,Gujarat ', university: 'VNSGU', college: 'C.K Pithawalla College of Engineering & Technology', degree: 'BCA', semester: 'sem6', track: 'Web Development, API Development', duration: '120 hours', date: '2025-12-15' },
  { id: 54, name: 'Goswami Riya Mehulpuri', email: 'riyagoswami7190@gmail.com', mobile: '8160321462', gender: 'female', city: 'Surat', university: 'Veer Narmad South Gujarat University', college: 'C B Patel Computer College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-16' },
  { id: 55, name: 'Ichchhaporiya parthvi Mukeshbhai', email: 'ichchhaporiyaparthvi@gmail.com', mobile: '7016184350', gender: 'female', city: 'Surat,Gujrat', university: 'Veer narmad south Gujrat University', college: 'C B Patel Computer College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-16' },
  { id: 56, name: 'Goswami Ruchi Mehulpuri ', email: 'ruchigoswami0073@gmail.com', mobile: '9106265071', gender: 'female', city: 'Surat, Gujarat ', university: 'Veer Narmad South Gujarat University ', college: 'C B Patel Computer College', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours', date: '2025-12-16' },
  { id: 57, name: 'Borda Anushree Mukeshbhai ', email: 'anushreeborda@gmail.com', mobile: '9662621918', gender: 'female', city: 'Surat', university: 'Veer Narmad South Gujarat University ', college: 'Shree uttar Gujarat bba & bca college', degree: 'BCA', semester: 'sem6', track: 'API Development', duration: '120 hours ', date: '2025-12-18' },
  { id: 58, name: 'patel hiral pareshkumar', email: 'hiralpatel02062006@gmail.com', mobile: '9727827764', gender: 'female', city: 'surat', university: 'VNSGU', college: 'Shree Uttar Gujarat BBA & BCA College', degree: 'BCA', semester: 'sem6', track: 'Web Development', duration: '120', date: '2026-01-05' },
  { id: 59, name: 'Prajapati Palak Hareshbhai', email: 'palakp2116@gmail.com', mobile: '6351981494', gender: 'female', city: 'Surat', university: 'vnsgu', college: 'Shree Uttar Gujarat BBA & BCA College ', degree: 'BCA', semester: 'sem6', track: 'Web Development', duration: '120', date: '2026-01-05' },
  { id: 60, name: 'kanojiya kashish devanadbhai', email: 'kashishkanojiya08@gmail.com', mobile: '8140611895', gender: 'female', city: 'surat', university: 'vnsgu', college: 'shree uttar gujarat BBA & BCA college', degree: 'BCA', semester: 'sem6', track: 'Web Development', duration: '120', date: '2026-01-05' },
  { id: 61, name: 'JARIWALA OM VIJAYKUMAR', email: 'oomjariwala@gmail.com', mobile: '6355183664', gender: 'male', city: 'Surat', university: 'VNSGU', college: 'SHREE UTTAR GUJARAT BBA & BCA COLLAGE', degree: 'BCA', semester: 'sem6', track: 'Data Science', duration: '120 hours', date: '2026-01-05' }
];

async function runImport() {
  console.log("🚀 Starting Internship 2025 Student Import & Mapping...");

  // 1. Ensure IT Course Department
  let dept = await prisma.department.findUnique({ where: { name: "IT Course" } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: "IT Course",
        code: "ITC",
        description: "Information Technology and Software development courses",
        isActive: true,
      },
    });
  }
  console.log(`✅ Department ready: ${dept.name} (${dept.id})`);

  // 2. Ensure Course: "Internship 2025 (120 Hrs)"
  const courseCode = "CRS-INT-2025";
  const courseName = "Internship 2025 (120 Hrs)";
  
  let course = await prisma.course.findUnique({ where: { code: courseCode } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        name: courseName,
        code: courseCode,
        category: "IT Course",
        departmentId: dept.id,
        description: "CRS Internship Program (120 Hours)",
        duration: 120,
        durationType: "DAYS",
        fees: 0.00,
        isActive: true,
      },
    });
  } else {
    course = await prisma.course.update({
      where: { id: course.id },
      data: {
        category: "IT Course",
        departmentId: dept.id,
        isActive: true,
      },
    });
  }
  console.log(`✅ Target Course ready: ${course.name} [Code: ${course.code}, ID: ${course.id}]`);

  // 3. Admin User & Lead Source
  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) {
    adminUser = await prisma.user.findFirst();
  }

  let leadSource = await prisma.leadSource.findUnique({ where: { name: "CRS Internship Program" } });
  if (!leadSource) {
    leadSource = await prisma.leadSource.create({
      data: {
        name: "CRS Internship Program",
        description: "Internship Program Dec-25 Registrations",
      },
    });
  }

  // Statistics counters
  let totalProcessed = 0;
  let newStudentsCount = 0;
  let mappedStudentsCount = 0;
  let newAdmissionsCount = 0;
  let skippedAdmissionsCount = 0;

  // Track max values for sequences
  let maxInqVal = 100;
  let maxAdmVal = 100;
  let maxStdVal = 100;

  const seqInquiry = await prisma.sequence.findFirst({ where: { name: "INQUIRY" } });
  const seqAdm = await prisma.sequence.findFirst({ where: { name: "ADMISSION" } });
  const seqStd = await prisma.sequence.findFirst({ where: { name: "STUDENT" } });

  if (seqInquiry?.currentValue) maxInqVal = seqInquiry.currentValue;
  if (seqAdm?.currentValue) maxAdmVal = seqAdm.currentValue;
  if (seqStd?.currentValue) maxStdVal = seqStd.currentValue;

  const yearStr = new Date().getFullYear();
  const yearShort = String(yearStr).slice(-2);

  async function getNextInquiryNumber() {
    while (true) {
      maxInqVal++;
      const candidate = `INQ-${yearStr}-${String(maxInqVal).padStart(4, "0")}`;
      const exists = await prisma.inquiry.findUnique({ where: { inquiryNumber: candidate } });
      if (!exists) return candidate;
    }
  }

  async function getNextAdmissionNumber() {
    while (true) {
      maxAdmVal++;
      const candidate = `ADM-${yearStr}-${String(maxAdmVal).padStart(4, "0")}`;
      const exists = await prisma.admission.findUnique({ where: { admissionNumber: candidate } });
      if (!exists) return candidate;
    }
  }

  async function getNextStudentId() {
    while (true) {
      maxStdVal++;
      const candidate = `STD${yearShort}${String(maxStdVal).padStart(4, "0")}`;
      const exists = await prisma.student.findFirst({ where: { studentId: candidate } });
      if (!exists) return candidate;
    }
  }

  for (const item of RAW_SQL_DATA) {
    totalProcessed++;
    const cleanName = item.name.trim();
    const cleanEmail = item.email ? item.email.trim().toLowerCase() : null;
    const cleanMobile = item.mobile ? item.mobile.trim() : "";
    const cleanGender = (item.gender || "female").toLowerCase() === "female" ? "Female" : "Male";
    const cleanCity = item.city ? item.city.trim() : "Surat";
    const cleanCollege = item.college ? item.college.trim() : null;
    const cleanDegree = item.degree ? item.degree.trim() : "";
    const cleanSem = item.semester ? item.semester.trim() : "";
    const qualification = [cleanDegree, cleanSem].filter(Boolean).join(" - ");
    const regDate = item.date ? new Date(item.date) : new Date();

    // Check if student ALREADY exists in database (by mobile, email, or exact name)
    let existingStudent = null;
    if (cleanMobile) {
      existingStudent = await prisma.student.findFirst({
        where: { mobile: cleanMobile },
        include: { admission: true },
      });
    }
    if (!existingStudent && cleanEmail) {
      existingStudent = await prisma.student.findFirst({
        where: { email: cleanEmail },
        include: { admission: true },
      });
    }
    if (!existingStudent && cleanName) {
      existingStudent = await prisma.student.findFirst({
        where: { fullName: { equals: cleanName, mode: "insensitive" } },
        include: { admission: true },
      });
    }

    if (existingStudent) {
      mappedStudentsCount++;

      // Check if student already enrolled in this internship course
      const existingAdmInCourse = await prisma.admission.findFirst({
        where: {
          studentId: existingStudent.id,
          courseId: course.id,
          deletedAt: null,
        },
      });

      if (existingAdmInCourse) {
        skippedAdmissionsCount++;
        console.log(`ℹ️ [ALREADY ENROLLED] Student #${item.id} - ${cleanName} (${existingStudent.studentId}) already has an admission for Internship 2025.`);
        
        // Ensure student status is COMPLETED as per user request
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            status: "COMPLETED",
            schoolCollege: existingStudent.schoolCollege || cleanCollege,
            qualification: existingStudent.qualification || qualification,
            city: existingStudent.city || cleanCity,
          },
        });
        await prisma.admission.update({
          where: { id: existingAdmInCourse.id },
          data: { status: "COMPLETED" },
        });
        continue;
      }

      // Existing student exists, but needs an admission in the Internship 2025 course!
      const inqNum = await getNextInquiryNumber();
      const admNum = await getNextAdmissionNumber();

      const inquiry = await prisma.inquiry.create({
        data: {
          inquiryNumber: inqNum,
          fullName: cleanName,
          mobile: cleanMobile || "0000000000",
          whatsapp: cleanMobile || "0000000000",
          gender: cleanGender,
          email: cleanEmail,
          expectedFees: 0.00,
          inquiryDate: regDate,
          nextFollowUpDate: regDate,
          status: "ADMISSION_DONE",
          courseId: course.id,
          leadSourceId: leadSource.id,
          assignedToId: adminUser.id,
          remarks: `Legacy registration ID: ${item.id}, Track: ${item.track}`,
        },
      });

      const admission = await prisma.admission.create({
        data: {
          admissionNumber: admNum,
          inquiryId: inquiry.id,
          studentId: existingStudent.id,
          courseId: course.id,
          courseNameSnapshot: course.name,
          courseFeesSnapshot: 0.00,
          admissionDate: regDate,
          admissionYear: `${yearStr}-${String(yearStr + 1).slice(-2)}`,
          courseFees: 0.00,
          discount: 0.00,
          finalFees: 0.00,
          paidAmount: 0.00,
          pendingAmount: 0.00,
          remarks: `Mapped to existing student ${existingStudent.studentId}. University: ${item.university}, Track: ${item.track}`,
          studentCategory: "COLLEGE",
          guardianName: "Not Provided",
          guardianMobile: cleanMobile || "0000000000",
          guardianRelation: "OTHER",
          status: "COMPLETED",
          admittedBy: adminUser.id,
        },
      });

      // Update existing student with updated course details and COMPLETED status
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          status: "COMPLETED",
          schoolCollege: existingStudent.schoolCollege || cleanCollege,
          qualification: existingStudent.qualification || qualification,
          city: existingStudent.city || cleanCity,
        },
      });

      newAdmissionsCount++;
      console.log(`🔗 [MAPPED EXISTING STUDENT] Student #${item.id} - ${cleanName} (${existingStudent.studentId}) mapped & enrolled in Internship 2025 [Adm: ${admNum}]`);

    } else {
      // NEW Student - Create Inquiry, Student, and Admission
      newStudentsCount++;
      const inqNum = await getNextInquiryNumber();
      const admNum = await getNextAdmissionNumber();
      const stdNum = await getNextStudentId();

      const inquiry = await prisma.inquiry.create({
        data: {
          inquiryNumber: inqNum,
          fullName: cleanName,
          mobile: cleanMobile || "0000000000",
          whatsapp: cleanMobile || "0000000000",
          gender: cleanGender,
          email: cleanEmail,
          expectedFees: 0.00,
          inquiryDate: regDate,
          nextFollowUpDate: regDate,
          status: "ADMISSION_DONE",
          courseId: course.id,
          leadSourceId: leadSource.id,
          assignedToId: adminUser.id,
          remarks: `Legacy registration ID: ${item.id}, Track: ${item.track}`,
        },
      });

      const admission = await prisma.admission.create({
        data: {
          admissionNumber: admNum,
          inquiryId: inquiry.id,
          courseId: course.id,
          courseNameSnapshot: course.name,
          courseFeesSnapshot: 0.00,
          admissionDate: regDate,
          admissionYear: `${yearStr}-${String(yearStr + 1).slice(-2)}`,
          courseFees: 0.00,
          discount: 0.00,
          finalFees: 0.00,
          paidAmount: 0.00,
          pendingAmount: 0.00,
          remarks: `University: ${item.university}, Track: ${item.track}`,
          studentCategory: "COLLEGE",
          guardianName: "Not Provided",
          guardianMobile: cleanMobile || "0000000000",
          guardianRelation: "OTHER",
          status: "COMPLETED",
          admittedBy: adminUser.id,
        },
      });

      const newStudent = await prisma.student.create({
        data: {
          studentId: stdNum,
          admissionId: admission.id,
          fullName: cleanName,
          gender: cleanGender,
          mobile: cleanMobile || "0000000000",
          whatsapp: cleanMobile || null,
          email: cleanEmail,
          address: cleanCity,
          city: cleanCity,
          state: "Gujarat",
          country: "India",
          qualification: qualification,
          schoolCollege: cleanCollege,
          joinedDate: regDate,
          status: "COMPLETED",
          profileCompleted: true,
        },
      });

      // Update admission studentId link if needed
      await prisma.admission.update({
        where: { id: admission.id },
        data: { studentId: newStudent.id },
      });

      newAdmissionsCount++;
      console.log(`✨ [NEW STUDENT CREATED] #${item.id} - ${cleanName} [Student ID: ${stdNum}, Adm: ${admNum}]`);
    }
  }

  // Update sequences in database
  await prisma.sequence.upsert({
    where: { name: "INQUIRY" },
    update: { currentValue: maxInqVal },
    create: { name: "INQUIRY", currentValue: maxInqVal },
  });

  await prisma.sequence.upsert({
    where: { name: "ADMISSION" },
    update: { currentValue: maxAdmVal },
    create: { name: "ADMISSION", currentValue: maxAdmVal },
  });

  await prisma.sequence.upsert({
    where: { name: "STUDENT" },
    update: { currentValue: maxStdVal },
    create: { name: "STUDENT", currentValue: maxStdVal },
  });

  console.log("\n==================================================");
  console.log("🎉 INTERNSHIP 2025 IMPORT COMPLETE!");
  console.log("==================================================");
  console.log(`📊 Total Records Processed: ${totalProcessed}`);
  console.log(`✨ New Students Created:   ${newStudentsCount}`);
  console.log(`🔗 Existing Students Mapped: ${mappedStudentsCount}`);
  console.log(`🎓 Total New Admissions:     ${newAdmissionsCount}`);
  console.log(`⏩ Skipped Duplicates:       ${skippedAdmissionsCount}`);
  console.log("==================================================");
}

runImport()
  .catch((err) => {
    console.error("❌ Error importing internship students:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
