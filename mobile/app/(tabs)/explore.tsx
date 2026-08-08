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
  ScrollView,
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

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'DROPPED'];

export default function StatusManagerScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  // Single student edit modal & Profile modal
  const [singleStudent, setSingleStudent] = useState<Student | null>(null);
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);

  // Fee Collection Modal State
  const [feeModalStudent, setFeeModalStudent] = useState<Student | null>(null);
  const [feeAmount, setFeeAmount] = useState<string>('5000');
  const [feePaymentDate, setFeePaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [feeSubmitting, setFeeSubmitting] = useState<boolean>(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents(selectedStatusTab, search);
  }, [selectedStatusTab]);

  const fetchStudents = async (statusFilter = 'ALL', searchQuery = '') => {
    setLoading(true);
    try {
      const response = await api.get('/students', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchQuery || undefined,
          limit: 100,
        },
      });
      setStudents(response.data?.data?.students || []);
    } catch (error: any) {
      console.error('Fetch students error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedStudentIds.length === 0) return;
    setUpdatingStatus(true);
    setStatusSuccessMsg(null);

    try {
      await api.patch('/students/bulk-status', {
        studentIds: selectedStudentIds,
        status: newStatus,
      });

      setStatusSuccessMsg(`Updated ${selectedStudentIds.length} student(s) to ${newStatus}`);
      setSelectedStudentIds([]);
      fetchStudents(selectedStatusTab, search);
      setTimeout(() => setStatusSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Bulk status update error:', err.response?.data || err.message);
    } finally {
      setUpdatingStatus(false);
      setSingleStudent(null);
    }
  };

  const handleSingleStatusUpdate = async (studentId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.patch('/students/bulk-status', {
        studentIds: [studentId],
        status: newStatus,
      });
      setStatusSuccessMsg(`Status updated to ${newStatus}`);
      fetchStudents(selectedStatusTab, search);
      setTimeout(() => setStatusSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Single status update error:', err);
    } finally {
      setUpdatingStatus(false);
      setSingleStudent(null);
    }
  };

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
      fetchStudents(selectedStatusTab, search);
    } catch (err: any) {
      setFeeError(err.response?.data?.message || 'Failed to record fee payment.');
    } finally {
      setFeeSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents(selectedStatusTab, search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchStudents(selectedStatusTab, text);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#064e3b', text: '#34d399' };
      case 'COMPLETED':
        return { bg: '#1e3a8a', text: '#60a5fa' };
      case 'DROPPED':
        return { bg: '#881337', text: '#fb7185' };
      default:
        return { bg: '#334155', text: '#94a3b8' };
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => {
    const isSelected = selectedStudentIds.includes(item.id);
    const statusStyle = getStatusBadgeStyle(item.status);
    const courseName = item.courseInfo?.primaryCourse || item.admission?.courseNameSnapshot || 'General Course';
    const pendingAmount = Number(item.admission?.pendingAmount || 0);

    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.checkboxTouchRow}
            onPress={() => toggleSelectStudent(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.studentId}>{item.studentId}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            onPress={() => setSingleStudent(item)}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status} ✏️
            </Text>
          </TouchableOpacity>
        </View>

        {/* Click Student Name to Open Full Profile Modal */}
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
            {courseName}
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

        {/* Quick Action Toolbar */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setProfileModalStudent(item)}
          >
            <Text style={styles.profileBtnText}>📱 View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => setSingleStudent(item)}
          >
            <Text style={styles.statusBtnText}>✏️ Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feeBtn}
            onPress={() => {
              setFeeModalStudent(item);
              setFeeAmount('5000');
              setFeeError(null);
            }}
          >
            <Text style={styles.feeBtnText}>💰 Fee</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Title Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Status Manager</Text>
          <Text style={styles.subtitle}>Manage Active, On Hold & Dropped Students</Text>
        </View>

        {students.length > 0 && (
          <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {STATUS_FILTERS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabItem,
              selectedStatusTab === tab && styles.tabItemActive,
            ]}
            onPress={() => setSelectedStatusTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedStatusTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {statusSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{statusSuccessMsg}</Text>
        </View>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedStudentIds.length > 0 && (
        <View style={styles.bulkActionBar}>
          <Text style={styles.bulkCountText}>
            {selectedStudentIds.length} Selected
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 8 }}>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#064e3b' }]}
              onPress={() => handleBulkStatusUpdate('ACTIVE')}
              disabled={updatingStatus}
            >
              <Text style={styles.bulkBtnText}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#334155' }]}
              onPress={() => handleBulkStatusUpdate('ON_HOLD')}
              disabled={updatingStatus}
            >
              <Text style={styles.bulkBtnText}>On Hold</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#1e3a8a' }]}
              onPress={() => handleBulkStatusUpdate('COMPLETED')}
              disabled={updatingStatus}
            >
              <Text style={styles.bulkBtnText}>Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#881337' }]}
              onPress={() => handleBulkStatusUpdate('DROPPED')}
              disabled={updatingStatus}
            >
              <Text style={styles.bulkBtnText}>Dropped</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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

      {/* Student Directory List */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Fetching student directory...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          contentContainerStyle={{ paddingBottom: 95 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found in this category.</Text>
            </View>
          }
        />
      )}

      {/* SINGLE STUDENT STATUS UPDATE MODAL */}
      {singleStudent && (
        <Modal transparent animationType="fade" visible={!!singleStudent}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <Text style={styles.modalStudentName}>
                {singleStudent.fullName} ({singleStudent.studentId})
              </Text>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: '#064e3b' }]}
                onPress={() => handleSingleStatusUpdate(singleStudent.id, 'ACTIVE')}
              >
                <Text style={styles.modalOptionText}>Mark ACTIVE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: '#334155' }]}
                onPress={() => handleSingleStatusUpdate(singleStudent.id, 'ON_HOLD')}
              >
                <Text style={styles.modalOptionText}>Put ON HOLD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: '#1e3a8a' }]}
                onPress={() => handleSingleStatusUpdate(singleStudent.id, 'COMPLETED')}
              >
                <Text style={styles.modalOptionText}>Mark COMPLETED</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: '#881337' }]}
                onPress={() => handleSingleStatusUpdate(singleStudent.id, 'DROPPED')}
              >
                <Text style={styles.modalOptionText}>Mark DROPPED</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSingleStudent(null)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
                  <Text style={[styles.detailStatusValue, { color: getStatusBadgeStyle(profileModalStudent.status).text }]}>
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
  selectAllBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectAllText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabScroll: {
    maxHeight: 38,
    marginBottom: 12,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabItemActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  bulkCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  bulkBtnText: {
    color: '#ffffff',
    fontSize: 10,
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
  cardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f2942',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  studentId: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
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
  modalOption: {
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    marginTop: 4,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Checkbox touch row & Card Actions styles
  checkboxTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
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
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  profileBtn: {
    flex: 1.2,
    backgroundColor: '#0284c7',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  feeBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  feeBtnText: {
    color: '#a7f3d0',
    fontSize: 10,
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
  detailStatusValue: {
    fontSize: 12,
    fontWeight: 'bold',
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
