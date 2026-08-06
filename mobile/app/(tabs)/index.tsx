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
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Date state: YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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

      // Default unmarked students to PRESENT
      activeList.forEach((s) => {
        if (!newAttMap[s.id]) {
          newAttMap[s.id] = 'PRESENT';
        }
      });

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

  const toggleStudentAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSavingAttendance(true);
    setSaveSuccessMsg(null);

    const records = students.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'PRESENT',
    }));

    try {
      await api.post('/attendance', {
        date: attendanceDate,
        records: records,
      });

      setSaveSuccessMsg(`Attendance saved successfully for ${records.length} active students!`);
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
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;

  const renderStudentCard = ({ item }: { item: Student }) => {
    const currentAtt = attendanceMap[item.id] || 'PRESENT';
    const primaryCourse =
      item.courseInfo?.primaryCourse ||
      item.admission?.courseNameSnapshot ||
      'General Course';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentId}>{item.studentId}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <Text style={styles.fullName}>{item.fullName}</Text>

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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.loginWrapper}>
          <Text style={styles.loginLogo}>🎓 AppXwinD SMS</Text>
          <Text style={styles.loginTitle}>Mobile Portal Sign In</Text>
          <Text style={styles.loginSub}>
            Sign in with Super Admin or Faculty account to mark daily attendance.
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
    <SafeAreaView style={styles.container}>
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

        <TouchableOpacity
          style={styles.saveAttendanceBtn}
          onPress={handleSaveAttendance}
          disabled={savingAttendance || students.length === 0}
        >
          {savingAttendance ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveAttendanceBtnText}>💾 Save Today's Attendance</Text>
          )}
        </TouchableOpacity>
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
          data={students}
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
              <Text style={styles.emptyText}>No ACTIVE students found.</Text>
            </View>
          }
        />
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
    marginBottom: 12,
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
});
