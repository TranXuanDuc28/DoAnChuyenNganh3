import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Image, 
    ScrollView,
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const loadUserData = async () => {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                setUserData(JSON.parse(data));
            }
        };
        loadUserData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất không?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Đăng xuất", 
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        // Reset navigation stack và quay về Login
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            })
                        );
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile */}
                <View style={styles.header}>
                    <View style={styles.profileImageContainer}>
                        <Image 
                            source={{ uri: 'https://ui-avatars.com/api/?name=' + (userData?.name || 'User') + '&background=6C5CE7&color=fff&size=128' }} 
                            style={styles.profileImage} 
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{userData?.name || 'Người dùng Lumina'}</Text>
                    <Text style={styles.userEmail}>{userData?.email || 'user@example.com'}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Bài học</Text>
                    </View>
                    <View style={styles.statItemDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>85%</Text>
                        <Text style={styles.statLabel}>Tiến độ</Text>
                    </View>
                    <View style={styles.statItemDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>1.2k</Text>
                        <Text style={styles.statLabel}>Điểm</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#E1E9FF' }]}>
                            <Ionicons name="person" size={20} color="#4D77FF" />
                        </View>
                        <Text style={styles.menuText}>Thông tin cá nhân</Text>
                        <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#FFF0E6' }]}>
                            <Ionicons name="notifications" size={20} color="#FF8A3D" />
                        </View>
                        <Text style={styles.menuText}>Thông báo</Text>
                        <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#E6FFF0' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#2ECC71" />
                        </View>
                        <Text style={styles.menuText}>Bảo mật</Text>
                        <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
                    </TouchableOpacity>
                </View>

                {/* App Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ứng dụng</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                            <Ionicons name="help-circle" size={20} color="#A855F7" />
                        </View>
                        <Text style={styles.menuText}>Trung tâm trợ giúp</Text>
                        <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                        <View style={[styles.menuIcon, { backgroundColor: '#FFEBEB' }]}>
                            <Ionicons name="log-out" size={20} color="#FF4D4D" />
                        </View>
                        <Text style={[styles.menuText, { color: '#FF4D4D' }]}>Đăng xuất</Text>
                        <Ionicons name="chevron-forward" size={20} color="#FF4D4D" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Phiên bản 1.0.2 (Build 2024)</Text>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8FF',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6C5CE7',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    userEmail: {
        fontSize: 14,
        color: '#636E72',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    statLabel: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    statItemDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F1F2F6',
    },
    section: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 15,
        paddingLeft: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#2D3436',
    },
    versionText: {
        textAlign: 'center',
        color: '#B2B2B2',
        fontSize: 12,
        marginTop: 20,
    }
});
