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
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';

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

export default function MobileFeeManagerScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDuesOnly, setFilterDuesOnly] = useState(false);

  // Fee Collection Modal State
  const [feeModalStudent, setFeeModalStudent] = useState<Student | null>(null);
  const [feeAmount, setFeeAmount] = useState<string>('5000');
  const [feePaymentDate, setFeePaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [feeSubmitting, setFeeSubmitting] = useState<boolean>(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Profile Modal State
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents(search);
  }, []);

  const fetchStudents = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await api.get('/students', {
        params: {
          status: 'ACTIVE',
          search: searchQuery || undefined,
          limit: 100,
        },
      });
      setStudents(response.data?.data?.students || []);
    } catch (error: any) {
      console.error('Fetch students fee error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents(search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchStudents(text);
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

    const todayStr = new Date().toISOString().split('T')[0];

    setFeeSubmitting(true);
    setFeeError(null);
    try {
      const res = await api.post('/fees/collect', {
        studentId: feeModalStudent.id,
        amount: numericAmount,
        paymentMode: paymentMode,
        paymentDate: feePaymentDate || todayStr,
        remarks: 'Collected via AppXwinD Mobile App',
      });

      const receiptNo = res.data?.data?.payment?.transactionReference || 'REC-SUCCESS';
      Alert.alert('Fee Payment Success! 💳', `Collected ₹${numericAmount.toLocaleString('en-IN')} for ${feeModalStudent.fullName}.\nPayment Date: ${feePaymentDate || todayStr}\nReceipt: ${receiptNo}`);
      setFeeModalStudent(null);
      setFeeAmount('5000');
      fetchStudents(search);
    } catch (err: any) {
      setFeeError(err.response?.data?.message || 'Failed to record fee payment.');
    } finally {
      setFeeSubmitting(false);
    }
  };

  const filteredList = students.filter((s) => {
    if (filterDuesOnly) {
      return Number(s.admission?.pendingAmount || 0) > 0;
    }
    return true;
  });

  const totalPendingDues = students.reduce((acc, s) => acc + Number(s.admission?.pendingAmount || 0), 0);

  const renderStudentItem = ({ item }: { item: Student }) => {
    const courseName = item.courseInfo?.primaryCourse || item.admission?.courseNameSnapshot || 'General Course';
    const pendingAmount = Number(item.admission?.pendingAmount || 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentId}>{item.studentId}</Text>
          {pendingAmount > 0 ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>₹{pendingAmount.toLocaleString('en-IN')} Pending</Text>
            </View>
          ) : (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ Dues Cleared</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setProfileModalStudent(item)} activeOpacity={0.7}>
          <Text style={styles.fullName}>{item.fullName}</Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Mobile:</Text>
          <Text style={styles.value}>{item.mobile}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Course:</Text>
          <Text style={styles.courseValue} numberOfLines={1}>
            {courseName}
          </Text>
        </View>

        {/* Action Toolbar */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.collectFeeBtn}
            onPress={() => {
              setFeeModalStudent(item);
              setFeeAmount('5000');
              setFeeError(null);
            }}
          >
            <Text style={styles.collectFeeBtnText}>💳 Collect Fees</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappReminderBtn}
            onPress={() => handleSendFeeReminder(item.id)}
          >
            <Text style={styles.whatsappReminderBtnText}>📢 Fee Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Mobile Fee Entry</Text>
          <Text style={styles.subtitle}>Collect Payments & Send Reminders</Text>
        </View>

        <TouchableOpacity
          style={[styles.filterDuesBtn, filterDuesOnly && styles.filterDuesBtnActive]}
          onPress={() => setFilterDuesOnly(!filterDuesOnly)}
        >
          <Text style={[styles.filterDuesText, filterDuesOnly && styles.filterDuesTextActive]}>
            {filterDuesOnly ? '⚠️ Dues Only' : '🌐 All Students'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dues Overview Card */}
      <View style={styles.overviewCard}>
        <View>
          <Text style={styles.overviewLabel}>Total Pending Dues</Text>
          <Text style={styles.overviewValue}>₹{totalPendingDues.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={styles.overviewCount}>{students.length} Active Students</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, mobile, or ID..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Student List */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Fetching fee accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No fee accounts match search/filter.</Text>
            </View>
          }
        />
      )}

      {/* MOBILE FEE COLLECTION MODAL */}
      {feeModalStudent && (
        <Modal
          visible={!!feeModalStudent}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFeeModalStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>💳 Mobile Fee Entry</Text>
              <Text style={styles.modalStudentName}>
                {feeModalStudent.fullName} ({feeModalStudent.studentId})
              </Text>

              {feeError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{feeError}</Text>
                </View>
              )}

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Amount (₹)</Text>
                <TextInput
                  style={styles.searchInput}
                  value={feeAmount}
                  onChangeText={setFeeAmount}
                  keyboardType="numeric"
                  placeholder="5000"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Payment Date (YYYY-MM-DD)</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.searchInput, { flex: 1 }]}
                    value={feePaymentDate}
                    onChangeText={setFeePaymentDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }}
                    onPress={() => setFeePaymentDate(new Date().toISOString().split('T')[0])}
                  >
                    <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}>Today</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>Payment Mode</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.tabItem,
                        paymentMode === mode ? styles.tabItemActive : null,
                      ]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text style={[styles.tabText, paymentMode === mode ? styles.tabTextActive : null]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setFeeModalStudent(null)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOption, { backgroundColor: '#059669', flex: 0, paddingHorizontal: 16 }]}
                  onPress={handleCollectFeeSubmit}
                  disabled={feeSubmitting}
                >
                  <Text style={styles.modalOptionText}>
                    {feeSubmitting ? 'Saving...' : 'Save Receipt'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  filterDuesBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterDuesBtnActive: {
    backgroundColor: '#881337',
    borderColor: '#e11d48',
  },
  filterDuesText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterDuesTextActive: {
    color: '#ffffff',
  },
  overviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  overviewLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  overviewValue: {
    color: '#f87171',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  overviewCount: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
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
  dueBadge: {
    backgroundColor: '#881337',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueBadgeText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paidBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  paidBadgeText: {
    color: '#34d399',
    fontSize: 10,
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
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  collectFeeBtn: {
    flex: 1,
    backgroundColor: '#059669',
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
    backgroundColor: '#064e3b',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalStudentName: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabItemActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  modalOption: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: '#881337',
    borderColor: '#be123c',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#fecdd3',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
