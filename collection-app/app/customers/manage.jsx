import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';

// Icons
import { 
  ChevronLeft, Save, MapPin, User, ShieldCheck, 
  Users, FileText, Check, Plus, Trash2, Search, Briefcase, AlertTriangle
} from 'lucide-react-native';

// Services
import { 
    createCustomerService, 
    updateCustomerService, 
    getCustomerByIdService, 
    searchCustomerService, 
    checkConflictService 
} from '../../src/api/customerService';
import { getStaffListService } from '../../src/api/staffService';

export default function ManageCustomer() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // If ID exists, we are in EDIT mode
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // Dropdown Data
  const [collectionBoys, setCollectionBoys] = useState([]);
  const [foundReferrers, setFoundReferrers] = useState([]);
  const [referrerSearch, setReferrerSearch] = useState('');
  const [showReferrerList, setShowReferrerList] = useState(false);

  // Form Data (Matches Backend Model Exactly)
  const [formData, setFormData] = useState({
    fullName: 'Krishna Panthulu',
    mobile: '9000668602',
    incomeSource: 'Daily Wage',
    incomeAmount: '1000',
    
    // Locations
    locations: {
      residence: { addressText: '', geo: { lat: 0, lng: 0 } },
      collectionPoint: { addressText: '', placeType: 'Home', geo: { lat: 0, lng: 0 } }
    },

    // KYC
    kyc: {
      aadhaarNumber: '976109784564',
      panCardNumber: '',
      rationCardNumber: ''
    },

    // Relations
    familyMembers: [],
    
    // Linking
    referredBy: null, // ID
    referredByName: '', // For UI display
    collectionBoyId: '' // ID
  });

  // Conflict Warnings
  const [warnings, setWarnings] = useState([]);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
        setFetching(true);
        try {
            // A. Fetch Staff List
            const staff = await getStaffListService();
            setCollectionBoys(staff);

            // B. If Edit Mode, Fetch Customer Data
            if (isEdit) {
                const data = await getCustomerByIdService(id);
                // Map backend data to UI state
                setFormData({
                    ...data,
                    // Ensure nested objects exist to prevent crash
                    locations: data.locations || { residence: {}, collectionPoint: {} },
                    kyc: data.kyc || {},
                    familyMembers: data.familyMembers || [],
                    referredByName: data.referredBy?.fullName || '', // Assume populated
                    referredBy: data.referredBy?._id || data.referredBy,
                    incomeAmount: data.incomeAmount?.toString() || ''
                });
            }
        } catch (err) {
            console.log(err);
            Alert.alert("Error", "Failed to load data");
        } finally {
            setFetching(false);
        }
    };
    init();
  }, [id]);

  // --- 2. GEO-LOCATION HANDLER ---
  const handleGetLocation = async (type) => {
    try{

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
        }

        setLoading(true);
        let location = await Location.getCurrentPositionAsync({});
        setLoading(false);

        const { latitude, longitude } = location.coords;
        
        setFormData(prev => ({
        ...prev,
        locations: {
            ...prev.locations,
            [type]: {
            ...prev.locations[type],
            geo: { lat: latitude, lng: longitude }
            }
        }
        }));
        
        Alert.alert("Success", "GPS Location Captured!");
    }catch (error) {
        // 🟢 3. This catches the "Location is unavailable" error
        console.log("Location suppressed:", error.message);
        
        // Instead of crashing, return null or a default coordinate
        return null; 
    }
  };

  // --- 3. REFERRER SEARCH ---
  const handleReferrerSearch = async (text) => {
    setReferrerSearch(text);
    if (text.length > 2) {
        const results = await searchCustomerService(text);
        setFoundReferrers(results);
        setShowReferrerList(true);
    } else {
        setShowReferrerList(false);
    }
  };

  const selectReferrer = (cust) => {
    setFormData(prev => ({ ...prev, referredBy: cust._id, referredByName: cust.fullName }));
    setShowReferrerList(false);
    setReferrerSearch('');
  };

  // --- 4. CONFLICT CHECK (On Mobile/Ration Blur) ---
  const handleCheckConflict = async () => {
    if (formData.mobile.length === 10 || formData.kyc.rationCardNumber) {
        const result = await checkConflictService({
            mobile: formData.mobile,
            rationCardNumber: formData.kyc.rationCardNumber
        });
        setWarnings(result.warnings || []);
    }
  };

  // --- 5. SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!formData.fullName || !formData.mobile) {
        return Alert.alert("Required", "Name and Mobile are mandatory.");
    }
    if (warnings.length > 0) {
        // Optional: Block or Ask Confirmation
        // Alert.alert("Warning", "Resolve conflicts before saving.");
        // return;
    }

    setLoading(true);
    try {
        const payload = {
            ...formData,
            incomeAmount: Number(formData.incomeAmount) || 0,
            collectionBoyId: formData.collectionBoyId || null,
            referredBy: formData.referredBy || null
        };

        if (isEdit) {
            await updateCustomerService(id, payload);
            Alert.alert("Updated", "Customer profile updated!");
        } else {
            await createCustomerService(payload);
            Alert.alert("Created", "New Customer added successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        }
    } catch (err) {
        Alert.alert("Failed", typeof err === 'string' ? err : "Save failed");
    } finally {
        setLoading(false);
    }
  };

  // Helper for Nested Updates
  const updateNested = (parent, field, value) => {
    setFormData(prev => ({
        ...prev,
        [parent]: {
            ...prev[parent],
            [field]: value
        }
    }));
  };

  const updateLocation = (type, field, value) => {
    setFormData(prev => ({
        ...prev,
        locations: {
            ...prev.locations,
            [type]: {
                ...prev.locations[type],
                [field]: value
            }
        }
    }));
  };

  // Family Helpers
  const addFamilyMember = () => {
    setFormData(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, { name: '', relation: '', mobile: '' }]
    }));
  };

  const updateFamily = (index, field, value) => {
    const updated = [...formData.familyMembers];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, familyMembers: updated }));
  };

  const removeFamily = (index) => {
    const updated = formData.familyMembers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, familyMembers: updated }));
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ChevronLeft color="#0f172a" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEdit ? "Edit Profile" : "New Customer"}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            {/* 1. BASIC INFO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><User size={14} color="#64748b" />  BASIC DETAILS</Text>
                
                <View style={styles.card}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.fullName}
                        onChangeText={t => setFormData({...formData, fullName: t})}
                        placeholder="e.g. Mastan Vali"
                    />

                    <Text style={styles.label}>Mobile Number *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.mobile}
                        onChangeText={t => setFormData({...formData, mobile: t})}
                        onBlur={handleCheckConflict}
                        keyboardType="phone-pad"
                        placeholder="10 digit number"
                        maxLength={10}
                    />

                    {/* Conflict Warnings */}
                    {warnings.length > 0 && (
                        <View style={styles.warningBox}>
                            <AlertTriangle size={16} color="#dc2626" />
                            <View style={{marginLeft: 8, flex: 1}}>
                                {warnings.map((w, i) => <Text key={i} style={styles.warningText}>{w}</Text>)}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* 2. OCCUPATION & ASSIGNMENT */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><Briefcase size={14} color="#64748b" />  OCCUPATION & ASSIGNMENT</Text>
                
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 8}}>
                            <Text style={styles.label}>Income Source</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.incomeSource} 
                                onChangeText={t => setFormData({...formData, incomeSource: t})}
                            />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>Amount (₹)</Text>
                            <TextInput 
                                style={styles.input} 
                                keyboardType="numeric"
                                value={formData.incomeAmount}
                                onChangeText={t => setFormData({...formData, incomeAmount: t})}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Assign Collection Agent</Text>
                    <View style={styles.pickerBox}>
                        {collectionBoys.map(boy => (
                            <TouchableOpacity 
                                key={boy._id} 
                                style={[styles.boyBtn, formData.collectionBoyId === boy._id && styles.boyBtnActive]}
                                onPress={() => setFormData({...formData, collectionBoyId: boy._id})}
                            >
                                <Text style={[styles.boyText, formData.collectionBoyId === boy._id && {color: '#fff'}]}>
                                    {boy.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* 3. LOCATIONS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><MapPin size={14} color="#64748b" />  ADDRESS & GPS</Text>
                
                {/* Residence */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.subHeader}>Residence</Text>
                        <TouchableOpacity onPress={() => handleGetLocation('residence')}>
                            <Text style={styles.gpsLink}>{formData.locations.residence.geo.lat ? 'Update GPS' : 'Get GPS'}</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.input} 
                        placeholder="House No, Street, Landmark"
                        multiline
                        value={formData.locations.residence.addressText}
                        onChangeText={t => updateLocation('residence', 'addressText', t)}
                    />
                    {formData.locations.residence.geo.lat !== 0 && (
                        <Text style={styles.geoText}>
                            Lat: {formData.locations.residence.geo.lat}, Lng: {formData.locations.residence.geo.lng}
                        </Text>
                    )}
                </View>

                {/* Collection Point */}
                <View style={[styles.card, {marginTop: 10}]}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.subHeader}>Collection Point (Shop/Office)</Text>
                        <TouchableOpacity onPress={() => handleGetLocation('collectionPoint')}>
                            <Text style={styles.gpsLink}>{formData.locations.collectionPoint.geo.lat ? 'Update GPS' : 'Get GPS'}</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Shop Name, Market Area"
                        multiline
                        value={formData.locations.collectionPoint.addressText}
                        onChangeText={t => updateLocation('collectionPoint', 'addressText', t)}
                    />
                </View>
            </View>

            {/* 4. KYC & DOCUMENTS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><ShieldCheck size={14} color="#64748b" />  KYC DOCUMENTS</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Aadhaar Number</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" maxLength={12}
                        value={formData.kyc.aadhaarNumber}
                        onChangeText={t => updateNested('kyc', 'aadhaarNumber', t)}
                    />
                    
                    <Text style={styles.label}>Ration Card (For Conflicts)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.kyc.rationCardNumber}
                        onChangeText={t => updateNested('kyc', 'rationCardNumber', t)}
                        onBlur={handleCheckConflict}
                    />
                </View>
            </View>

            {/* 5. FAMILY MEMBERS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><Users size={14} color="#64748b" />  FAMILY MEMBERS</Text>
                <View style={styles.card}>
                    {formData.familyMembers.map((member, index) => (
                        <View key={index} style={styles.familyItem}>
                            <View style={{flex: 1}}>
                                <TextInput 
                                    placeholder="Name" style={[styles.inputSmall, {marginBottom: 4}]}
                                    value={member.name} onChangeText={t => updateFamily(index, 'name', t)}
                                />
                                <View style={styles.row}>
                                    <TextInput 
                                        placeholder="Relation" style={[styles.inputSmall, {flex: 1, marginRight: 4}]}
                                        value={member.relation} onChangeText={t => updateFamily(index, 'relation', t)}
                                    />
                                    <TextInput 
                                        placeholder="Mobile" style={[styles.inputSmall, {flex: 1}]}
                                        keyboardType="phone-pad"
                                        value={member.mobile} onChangeText={t => updateFamily(index, 'mobile', t)}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => removeFamily(index)} style={{padding: 8}}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity onPress={addFamilyMember} style={styles.addFamilyRow}>
                        <Plus size={16} color="#2563eb" />
                        <Text style={{color: '#2563eb', fontWeight: 'bold', fontSize: 13}}>Add Family Member</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 6. REFERENCE */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}><Users size={14} color="#64748b" />  REFERRED BY</Text>
                <View style={styles.card}>
                    {formData.referredByName ? (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>{formData.referredByName}</Text>
                            <TouchableOpacity onPress={() => setFormData(p => ({...p, referredBy: null, referredByName: ''}))}>
                                <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <View style={styles.searchBox}>
                                <Search size={16} color="#94a3b8" style={{marginRight: 8}}/>
                                <TextInput 
                                    style={{flex: 1}} 
                                    placeholder="Search existing customer..."
                                    value={referrerSearch}
                                    onChangeText={handleReferrerSearch}
                                />
                            </View>
                            {showReferrerList && (
                                <View style={styles.dropdown}>
                                    {foundReferrers.map(cust => (
                                        <TouchableOpacity key={cust._id} style={styles.dropdownItem} onPress={() => selectReferrer(cust)}>
                                            <Text style={styles.dropdownText}>{cust.fullName} ({cust.mobile})</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* SUBMIT */}
            <View style={{marginTop: 20, marginBottom: 50}}>
                <TouchableOpacity 
                    style={[styles.submitBtn, loading && {opacity: 0.7}]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Save size={20} color="#fff" style={{marginRight: 8}}/>
                            <Text style={styles.submitText}>{isEdit ? "UPDATE PROFILE" : "CREATE CUSTOMER"}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 1 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b', marginBottom: 12 },
  inputSmall: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 13 },
  
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subHeader: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  gpsLink: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  geoText: { fontSize: 11, color: '#16a34a', marginTop: -8, marginBottom: 10, fontStyle: 'italic' },
  
  warningBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 4, alignItems: 'flex-start' },
  warningText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold', lineHeight: 18 },

  pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  boyBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  boyBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  boyText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  familyItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 8 },
  addFamilyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#2563eb', borderRadius: 10 },

  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: 10, borderRadius: 8 },
  chipText: { color: '#2563eb', fontWeight: 'bold' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 4, elevation: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownText: { fontSize: 13, color: '#334155' },

  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});