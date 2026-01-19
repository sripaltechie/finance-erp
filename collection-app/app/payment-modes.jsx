import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, Wallet, Plus, Trash2, CreditCard, Banknote, X, Edit 
} from 'lucide-react-native';
import { getPaymentModesService, addPaymentModeService, deletePaymentModeService, updatePaymentModeService } from '../src/api/companyService';

export default function PaymentModesScreen() {
  const router = useRouter();
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingMode, setEditingMode] = useState(null); // Track if editing
  const [name, setName] = useState('');
  const [type, setType] = useState('Cash'); // 'Cash' or 'Online'
  const [initialBalance, setInitialBalance] = useState('');

  // 1. Fetch Modes
  const loadModes = async () => {
    try {
      const data = await getPaymentModesService();
      setModes(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load payment modes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModes();
  }, []);

  // 2. Open Modal for Add/Edit
  const openModal = (mode = null) => {
    if (mode) {
      setEditingMode(mode);
      setName(mode.name);
      setType(mode.type);
      setInitialBalance(mode.initialBalance.toString());
    } else {
      setEditingMode(null);
      setName('');
      setType('Cash');
      setInitialBalance('');
    }
    setModalVisible(true);
  };

  // 3. Handle Submit (Add or Update)
  const handleSubmit = async () => {
    if (!name || !initialBalance) {
      Alert.alert("Missing Fields", "Please enter Name and Opening Balance");
      return;
    }

    setSubmitting(true);
    try {
      if (editingMode) {
        // Update Logic
        // Note: Backend updatePaymentMode might need to support updating initialBalance logic if desired,
        // typically only name/active status is updated to prevent accounting issues.
        // Assuming updatePaymentModeService handles basic updates.
        // If you need to update initialBalance, ensure backend supports it.
        await updatePaymentModeService(editingMode._id, {
            name,
            type, // Usually type isn't changed after creation
            initialBalance // Changing this might affect accounting logic
        });
        Alert.alert("Success", "Wallet updated successfully");
      } else {
        // Add Logic
        await addPaymentModeService({
          name,
          type,
          initialBalance: Number(initialBalance)
        });
        Alert.alert("Success", "Wallet created successfully");
      }
      
      setModalVisible(false);
      loadModes(); // Refresh list
    } catch (error) {
      console.log("new err",error);
      Alert.alert("Error", error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Mode with Active Check
  const handleDelete = (item) => {
    // Check if mode has been used (current != initial)
    if (item.currentBalance !== item.initialBalance) {
        Alert.alert(
            "Cannot Delete", 
            "This wallet has transactions. Please deactivate it instead to preserve history."
        );
        return;
    }

    Alert.alert(
      "Delete Wallet",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deletePaymentModeService(item._id);
              loadModes();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Delete failed");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        {item.type === 'Cash' ? (
          <Banknote size={24} color="#16a34a" />
        ) : (
          <CreditCard size={24} color="#2563eb" />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>{item.type} Account</Text>
        <Text style={styles.balance}>₹{item.currentBalance?.toLocaleString()}</Text>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.iconBtn}>
            <Edit size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
            <Trash2 size={20} color={item.currentBalance !== item.initialBalance ? "#94a3b8" : "#ef4444"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Modes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={modes}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No payment modes found. Add one to start collecting.</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMode ? "Edit Wallet" : "Add New Wallet"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wallet Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Shop Cash, HDFC Bank" 
                value={name} onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['Cash', 'Online'].map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[
                        styles.typeBtn, 
                        type === t && styles.typeBtnActive,
                        // editingMode && { opacity: 0.5 } // Disable type change on edit
                    ]}
                    onPress={() => setType(t)}
                    // disabled={!!editingMode}
                  >
                    <Text style={[styles.typeText, type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Balance</Text>
              <TextInput 
                // style={[styles.input, editingMode && { backgroundColor: '#e2e8f0', color: '#94a3b8' }]} 
                placeholder="0" 
                keyboardType="numeric"
                value={initialBalance} onChangeText={setInitialBalance}
                // editable={!editingMode} // Disable balance edit to prevent accounting mess
              />
              {/* {editingMode && <Text style={styles.helperText}>Opening balance cannot be changed.</Text>} */}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editingMode ? "Update" : "Create Wallet"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  backBtn: { padding: 8, marginLeft: -8 },
  addBtn: { backgroundColor: '#2563eb', padding: 8, borderRadius: 12 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b' },
  balance: { fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#1e293b' },
  helperText: { fontSize: 11, color: '#ef4444', marginTop: 4 },
  
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontWeight: 'bold', color: '#64748b' },

  submitBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});