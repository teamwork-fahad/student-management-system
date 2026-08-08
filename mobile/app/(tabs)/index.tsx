import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeStorage } from '@/utils/storage';
import api, { setAuthToken } from '@/services/api';

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  mobile: string;
  email?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'DROPPED' | 'TRANSFERRED';
  courseInfo?: {
    primaryCourse?: string;
  };
  admission?: {
    courseNameSnapshot?: string;
    pendingAmount?: number | string;
    paidAmount?: number | string;
    finalFees?: number | string;
  };
}

export default function AttendanceActiveScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [email, setEmail] = useState('admin@appxwind.com');
  const [password, setPassword] = useState('AppXwinD@03082025');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Students & Attendance state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [attendanceTab, setAttendanceTab] = useState<'UNMARKED' | 'MARKED' | 'ALL'>('UNMARKED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Date state: YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED'>>({});
  // Profile Modal State
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);

  const handleCallStudent = (mobile: string) => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`).catch(() => Alert.alert('Error', 'Unable to initiate call.'));
  };

  const handleWhatsAppChat = (mobile: string, name: string) => {
    if (!mobile) return;
    const cleanNum = mobile.replace(/\D/g, '');
    const numWithCode = cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
    const text = `Hello ${name}, Greetings from SMS!`;
    const url = `https://wa.me/${numWithCode}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open WhatsApp.'));
  };

  // Date Navigation Handlers
  const changeDateByDays = (days: number) => {
    const current = new Date(attendanceDate);
    if (isNaN(current.getTime())) {
      setAttendanceDate(todayStr);
      fetchActiveStudentsAndAttendance(todayStr, search);
      return;
    }
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];
    setAttendanceDate(newDateStr);
    fetchActiveStudentsAndAttendance(newDateStr, search);
  };

  const handlePrevDay = () => changeDateByDays(-1);
  const handleNextDay = () => changeDateByDays(1);
  const handleSelectToday = () => {
    setAttendanceDate(todayStr);
    fetchActiveStudentsAndAttendance(todayStr, search);
  };

  const handleDateChangeText = (text: string) => {
    setAttendanceDate(text);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      fetchActiveStudentsAndAttendance(text, search);
    }
  };

  // Fee Collection Modal State (Mobile App)
  const [feeModalStudent, setFeeModalStudent] = useState<Student | null>(null);
  const [feeAmount, setFeeAmount] = useState<string>('5000');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [feeSubmitting, setFeeSubmitting] = useState<boolean>(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const handleShareWhatsAppReport = async () => {
    try {
      const res = await api.get(`/attendance/whatsapp-report?date=${attendanceDate}`);
      const whatsappUrl = res.data?.data?.whatsappUrl || res.data?.data?.apiWhatsappUrl;
      const text = res.data?.data?.text || '';

      if (whatsappUrl) {
        try {
          await Linking.openURL(whatsappUrl);
        } catch {
          await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
        }
      }
    } catch (err: any) {
      Alert.alert('WhatsApp Error', err.response?.data?.message || 'Failed to generate WhatsApp report.');
    }
  };

  const handleSendFeeReminder = async (studentId: string) => {
    try {
      const res = await api.get(`/fees/student/${studentId}/whatsapp-reminder`);
      const whatsappUrl = res.data?.data?.whatsappUrl || res.data?.data?.apiWhatsappUrl;
      const text = res.data?.data?.text || '';

      if (whatsappUrl) {
        try {
          await Linking.openURL(whatsappUrl);
        } catch {
          await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
        }
      }
    } catch (err: any) {
      Alert.alert('WhatsApp Error', err.response?.data?.message || 'Failed to generate fee reminder.');
    }
  };

  const handleCollectFeeSubmit = async () => {
    if (!feeModalStudent) return;
    const numericAmount = Number(feeAmount);
    if (!numericAmount || numericAmount <= 0) {
      setFeeError('Please enter a valid amount greater than zero.');
      return;
    }

    setFeeSubmitting(true);
    setFeeError(null);
    try {
      const res = await api.post('/fees/collect', {
        studentId: feeModalStudent.id,
        amount: numericAmount,
        paymentMode: paymentMode,
        remarks: 'Collected via AppXwinD Mobile App',
      });

      const receiptNo = res.data?.data?.payment?.transactionReference || 'REC-SUCCESS';
      Alert.alert('Fee Payment Success! 💳', `Collected ₹${numericAmount.toLocaleString('en-IN')} for ${feeModalStudent.fullName}.\nReceipt: ${receiptNo}`);
      setFeeModalStudent(null);
      setFeeAmount('5000');
      fetchActiveStudentsAndAttendance(attendanceDate, search);
    } catch (err: any) {
      setFeeError(err.response?.data?.message || 'Failed to record fee payment.');
    } finally {
      setFeeSubmitting(false);
    }
  };

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    setCheckingAuth(true);
    try {
      const token = await safeStorage.getItem('userToken');
      if (token) {
        setAuthToken(token);
        setIsAuthenticated(true);
        fetchActiveStudentsAndAttendance(attendanceDate, '');
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Check auth error:', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    if (!email || !password) {
      setLoginError('Please enter Email and Password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: email.trim(),
        email: email.trim(),
        password: password,
      });

      const token =
        response.data?.data?.token ||
        response.data?.data?.accessToken ||
        response.data?.token ||
        response.data?.accessToken;

      if (token) {
        await safeStorage.setItem('userToken', token);
        setAuthToken(token);
        setIsAuthenticated(true);
        fetchActiveStudentsAndAttendance(attendanceDate, '');
      } else {
        setLoginError('Login failed: Token missing in response.');
      }
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Invalid credentials or connection error.';
      setLoginError(serverMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await safeStorage.removeItem('userToken');
      setAuthToken(null);
      setIsAuthenticated(false);
      setStudents([]);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const fetchActiveStudentsAndAttendance = async (date: string, searchQuery = '') => {
    setErrorMessage(null);
    setLoading(true);
    try {
      // 1. Fetch Attendance records for the date
      const attRes = await api.get(`/attendance?date=${date}`);
      const attData = attRes.data?.data || [];
      const newAttMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};

      attData.forEach((record: any) => {
        if (record.studentId && record.status) {
          newAttMap[record.studentId] = record.status;
        }
      });

      // 2. Fetch ACTIVE Students
      const stdRes = await api.get('/students', {
        params: {
          status: 'ACTIVE',
          search: searchQuery || undefined,
          limit: 100,
        },
      });

      const activeList: Student[] = stdRes.data?.data?.students || [];

      setAttendanceMap(newAttMap);
      setStudents(activeList);
    } catch (error: any) {
      console.error('Fetch active students error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setLoginError('Session expired. Please log in again.');
      } else {
        setErrorMessage(
          error.message === 'Network Error'
            ? 'Network Error: Cannot connect to Backend Server.'
            : error.response?.data?.message || 'Failed to load active students.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleStudentAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSavingAttendance(true);
    setSaveSuccessMsg(null);

    const records = students
      .filter((s) => attendanceMap[s.id] && attendanceMap[s.id] !== 'UNMARKED')
      .map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id],
      }));

    try {
      await api.post('/attendance', {
        date: attendanceDate,
        records: records,
      });

      setSaveSuccessMsg(`Attendance saved successfully for ${records.length} marked students!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save attendance error:', err.response?.data || err.message);
      setErrorMessage(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveStudentsAndAttendance(attendanceDate, search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchActiveStudentsAndAttendance(attendanceDate, text);
  };

  // Counts
  const markedCount = Object.values(attendanceMap).filter((s) => s && s !== 'UNMARKED').length;
  const unmarkedCount = students.length - markedCount;
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;

  const displayedStudents = students.filter((s) => {
    const currentStatus = attendanceMap[s.id] || 'UNMARKED';
    if (attendanceTab === 'UNMARKED' && currentStatus !== 'UNMARKED') {
      return false;
    }
    if (attendanceTab === 'MARKED' && currentStatus === 'UNMARKED') {
      return false;
    }
    return true;
  });

  const renderStudentCard = ({ item }: { item: Student }) => {
    const currentAtt = attendanceMap[item.id] || 'UNMARKED';
    const primaryCourse =
      item.courseInfo?.primaryCourse ||
      item.admission?.courseNameSnapshot ||
      'General Course';

    const pendingAmount = Number(item.admission?.pendingAmount || 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentId}>{item.studentId}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>
              {currentAtt === 'PRESENT' ? '✓ PRESENT' : currentAtt === 'ABSENT' ? '✗ ABSENT' : currentAtt === 'LATE' ? '⏳ LATE' : '⏳ UNMARKED'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setProfileModalStudent(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.fullName}>{item.fullName}</Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Mobile:</Text>
          <Text style={styles.value}>{item.mobile}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Course:</Text>
          <Text style={styles.courseValue} numberOfLines={1}>
            {primaryCourse}
          </Text>
        </View>

        {/* Fee Dues Indicator */}
        <View style={styles.feeDuesRow}>
          <Text style={styles.label}>Fees Dues:</Text>
          {pendingAmount > 0 ? (
            <Text style={styles.feePendingText}>₹{pendingAmount.toLocaleString('en-IN')} Pending</Text>
          ) : (
            <Text style={styles.feePaidText}>✓ Fully Cleared</Text>
          )}
        </View>

        {/* Quick Attendance Toggle Buttons */}
        <View style={styles.attToggleRow}>
          <TouchableOpacity
            style={[
              styles.attBtn,
              currentAtt === 'PRESENT' ? styles.presentBtnActive : styles.attBtnInactive,
            ]}
            onPress={() => toggleStudentAttendance(item.id, 'PRESENT')}
          >
            <Text style={currentAtt === 'PRESENT' ? styles.attTextActive : styles.attTextInactive}>
              ✓ PRESENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.attBtn,
              currentAtt === 'ABSENT' ? styles.absentBtnActive : styles.attBtnInactive,
            ]}
            onPress={() => toggleStudentAttendance(item.id, 'ABSENT')}
          >
            <Text style={currentAtt === 'ABSENT' ? styles.attTextActive : styles.attTextInactive}>
              ✗ ABSENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.attBtn,
              currentAtt === 'EXEMPTED' ? styles.exemptedBtnActive : styles.attBtnInactive,
            ]}
            onPress={() => toggleStudentAttendance(item.id, 'EXEMPTED')}
          >
            <Text style={currentAtt === 'EXEMPTED' ? styles.attTextActive : styles.attTextInactive}>
              ☕ OFF
            </Text>
          </TouchableOpacity>

          {currentAtt !== 'UNMARKED' && (
            <TouchableOpacity
              style={[styles.attBtn, styles.unmarkBtnActive]}
              onPress={() => toggleStudentAttendance(item.id, 'UNMARKED')}
            >
              <Text style={styles.unmarkTextActive}>
                🔄 Reset
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mobile Action Buttons: Fee Collection & WhatsApp Reminder */}
        <View style={styles.mobileActionRow}>
          <TouchableOpacity
            style={styles.collectFeeBtn}
            onPress={() => setProfileModalStudent(item)}
          >
            <Text style={styles.collectFeeBtnText}>📱 View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.collectFeeBtn}
            onPress={() => {
              setFeeModalStudent(item);
              setFeeAmount('5000');
              setFeeError(null);
            }}
          >
            <Text style={styles.collectFeeBtnText}>💰 Fee</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappReminderBtn}
            onPress={() => handleSendFeeReminder(item.id)}
          >
            <Text style={styles.whatsappReminderBtnText}>💬 Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, styles.loaderCenter]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Initializing Active Student Attendance...</Text>
      </View>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.loginWrapper}>
          <Text style={styles.loginLogo}>🎓 AppXwinD SMS</Text>
          <Text style={styles.loginTitle}>Mobile Portal Sign In</Text>
          <Text style={styles.loginSub}>
            Sign in with Super Admin or Faculty account to mark daily attendance & fees.
          </Text>

          {loginError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Admin / Faculty Email</Text>
            <TextInput
              style={styles.loginInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.togglePasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.togglePasswordText}>
                  {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loginLoading}
            activeOpacity={0.8}
          >
            {loginLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In & Mark Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE STUDENTS & DAILY ATTENDANCE SCREEN
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Active Attendance</Text>
          <Text style={styles.subtitle}>Daily Sheet ({attendanceDate})</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Date Selector Bar */}
      <View style={styles.dateSelectorBar}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay}>
          <Text style={styles.dateNavText}>◀ Prev</Text>
        </TouchableOpacity>

        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateIcon}>📅</Text>
          <TextInput
            style={styles.dateInput}
            value={attendanceDate}
            onChangeText={handleDateChangeText}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextDay}>
          <Text style={styles.dateNavText}>Next ▶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.todayBtn} onPress={handleSelectToday}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Stats Counter & Submit Bar */}
      <View style={styles.summaryBox}>
        <View style={styles.countRow}>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{students.length}</Text>
            <Text style={styles.countLabel}>Active Students</Text>
          </View>

          <View style={styles.countItem}>
            <Text style={[styles.countNumber, { color: '#34d399' }]}>{presentCount}</Text>
            <Text style={styles.countLabel}>Present</Text>
          </View>

          <View style={styles.countItem}>
            <Text style={[styles.countNumber, { color: '#fb7185' }]}>{absentCount}</Text>
            <Text style={styles.countLabel}>Absent</Text>
          </View>
        </View>

        <View style={styles.summaryBtnRow}>
          <TouchableOpacity
            style={styles.whatsappReportBtn}
            onPress={handleShareWhatsAppReport}
          >
            <Text style={styles.whatsappReportBtnText}>💬 WhatsApp Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveAttendanceBtn}
            onPress={handleSaveAttendance}
            disabled={savingAttendance || students.length === 0}
          >
            {savingAttendance ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveAttendanceBtnText}>💾 Save Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {saveSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{saveSuccessMsg}</Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchActiveStudentsAndAttendance(attendanceDate, search)}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ATTENDANCE STATUS TABS (UNMARKED PENDING vs MARKED DONE vs ALL) */}
      <View style={styles.mobileTabRow}>
        <TouchableOpacity
          style={[
            styles.mobileTabBtn,
            attendanceTab === 'UNMARKED' ? styles.mobileTabUnmarkedActive : styles.mobileTabInactive,
          ]}
          onPress={() => setAttendanceTab('UNMARKED')}
        >
          <Text
            style={[
              styles.mobileTabText,
              attendanceTab === 'UNMARKED' ? styles.mobileTabTextActiveDark : styles.mobileTabTextInactive,
            ]}
          >
            ⏳ Unmarked ({unmarkedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mobileTabBtn,
            attendanceTab === 'MARKED' ? styles.mobileTabMarkedActive : styles.mobileTabInactive,
          ]}
          onPress={() => setAttendanceTab('MARKED')}
        >
          <Text
            style={[
              styles.mobileTabText,
              attendanceTab === 'MARKED' ? styles.mobileTabTextActiveDark : styles.mobileTabTextInactive,
            ]}
          >
            ✅ Marked ({markedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mobileTabBtn,
            attendanceTab === 'ALL' ? styles.mobileTabAllActive : styles.mobileTabInactive,
          ]}
          onPress={() => setAttendanceTab('ALL')}
        >
          <Text
            style={[
              styles.mobileTabText,
              attendanceTab === 'ALL' ? styles.mobileTabTextActiveLight : styles.mobileTabTextInactive,
            ]}
          >
            🌐 All ({students.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search active student name or ID..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Active Students List */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Fetching active students...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentCard}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {attendanceTab === 'UNMARKED'
                  ? '🎉 All students have been marked today!'
                  : attendanceTab === 'MARKED'
                  ? 'No students marked yet today.'
                  : 'No ACTIVE students found.'}
              </Text>
            </View>
          }
        />
      )}

      {/* MOBILE FEE COLLECTION MODAL */}
      <Modal
        visible={!!feeModalStudent}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeeModalStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Mobile Fee Entry</Text>
            <Text style={styles.modalSubtitle}>
              Student: {feeModalStudent?.fullName} ({feeModalStudent?.studentId})
            </Text>

            {feeError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{feeError}</Text>
              </View>
            )}

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Collection Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                value={feeAmount}
                onChangeText={setFeeAmount}
                keyboardType="numeric"
                placeholder="e.g. 5000"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeChip,
                      paymentMode === mode ? styles.modeChipSelected : null,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        paymentMode === mode ? styles.modeChipTextSelected : null,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setFeeModalStudent(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCollectFeeSubmit}
                disabled={feeSubmitting}
              >
                {feeSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Receipt</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT PROFILE DETAILS MODAL */}
      {profileModalStudent && (
        <Modal
          visible={!!profileModalStudent}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setProfileModalStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.profileModalCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {profileModalStudent.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{profileModalStudent.fullName}</Text>
                  <Text style={styles.profileIdText}>{profileModalStudent.studentId}</Text>
                </View>
                <TouchableOpacity onPress={() => setProfileModalStudent(null)}>
                  <Text style={styles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileDetailSection}>
                <View style={styles.detailItemRow}>
                  <Text style={styles.detailLabel}>Mobile:</Text>
                  <Text style={styles.detailValue}>{profileModalStudent.mobile}</Text>
                </View>

                {profileModalStudent.email ? (
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{profileModalStudent.email}</Text>
                  </View>
                ) : null}

                <View style={styles.detailItemRow}>
                  <Text style={styles.detailLabel}>Course:</Text>
                  <Text style={styles.detailCourseValue}>
                    {profileModalStudent.courseInfo?.primaryCourse || profileModalStudent.admission?.courseNameSnapshot || 'General Course'}
                  </Text>
                </View>

                <View style={styles.detailItemRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    ● {profileModalStudent.status}
                  </Text>
                </View>

                <View style={styles.detailItemRow}>
                  <Text style={styles.detailLabel}>Pending Dues:</Text>
                  <Text style={styles.detailDuesValue}>
                    ₹{Number(profileModalStudent.admission?.pendingAmount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Quick Communication & Action Buttons */}
              <View style={styles.profileActionGrid}>
                <TouchableOpacity
                  style={styles.callActionBtn}
                  onPress={() => handleCallStudent(profileModalStudent.mobile)}
                >
                  <Text style={styles.callActionBtnText}>📞 Direct Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappActionBtn}
                  onPress={() => handleWhatsAppChat(profileModalStudent.mobile, profileModalStudent.fullName)}
                >
                  <Text style={styles.whatsappActionBtnText}>💬 Chat WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileActionGrid}>
                <TouchableOpacity
                  style={styles.collectFeeActionBtn}
                  onPress={() => {
                    const st = profileModalStudent;
                    setProfileModalStudent(null);
                    setFeeModalStudent(st);
                  }}
                >
                  <Text style={styles.collectFeeActionBtnText}>💳 Collect Fees</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reminderActionBtn}
                  onPress={() => handleSendFeeReminder(profileModalStudent.id)}
                >
                  <Text style={styles.reminderActionBtnText}>📢 Fee Reminder</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.profileCloseBtn}
                onPress={() => setProfileModalStudent(null)}
              >
                <Text style={styles.profileCloseText}>Close Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
    gap: 6,
  },
  dateNavBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  dateNavText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dateInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingVertical: 6,
    textAlign: 'center',
  },
  todayBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  todayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  countItem: {
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  countLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: 'bold',
  },
  saveAttendanceBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveAttendanceBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  successBanner: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchBar: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  searchInput: {
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentId: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  activeBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  fullName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  label: {
    color: '#64748b',
    fontSize: 11,
    width: 55,
    fontWeight: '600',
  },
  value: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  courseValue: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  attToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  attBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  attBtnInactive: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  presentBtnActive: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  absentBtnActive: {
    backgroundColor: '#881337',
    borderColor: '#e11d48',
  },
  exemptedBtnActive: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  attTextActive: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  attTextInactive: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: '#881337',
    borderColor: '#be123c',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  loginLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  loginInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  togglePasswordBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  togglePasswordText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Fee & WhatsApp styles
  summaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappReportBtn: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappReportBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  feeDuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  feePendingText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  feePaidText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mobileActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  collectFeeBtn: {
    flex: 1,
    backgroundColor: '#0369a1',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  collectFeeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  whatsappReminderBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappReminderBtnText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 16,
  },
  modalFormGroup: {
    marginBottom: 14,
  },
  modalLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeChip: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  modeChipText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modeChipTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalErrorBox: {
    backgroundColor: '#881337',
    borderColor: '#be123c',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  modalErrorText: {
    color: '#fecdd3',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Mobile Status Tabs
  mobileTabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  mobileTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mobileTabInactive: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  mobileTabUnmarkedActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  mobileTabMarkedActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  mobileTabAllActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  mobileTabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  mobileTabTextInactive: {
    color: '#94a3b8',
  },
  mobileTabTextActiveDark: {
    color: '#0f172a',
  },
  mobileTabTextActiveLight: {
    color: '#ffffff',
  },
  unmarkBtnActive: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  unmarkTextActive: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Profile Modal Styles
  profileModalCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 400,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileIdText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeX: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  profileDetailSection: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailCourseValue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  detailDuesValue: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profileActionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  callActionBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  callActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  whatsappActionBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappActionBtnText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  collectFeeActionBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  collectFeeActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reminderActionBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  reminderActionBtnText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  profileCloseBtn: {
    marginTop: 6,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    alignItems: 'center',
  },
  profileCloseText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
