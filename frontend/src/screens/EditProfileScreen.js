import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Feather, Entypo } from '@expo/vector-icons';
import { authApi } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { editProfileStyles as styles } from '../styles/EditProfileStyles';

const PROFILE_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuDLR5Q1ZUoZUjKWqWssCi_oWaTvd-EVXVSr3Qps_OyKVgo_eOiA1KJ9nZk1OcERSfLThgVYxGQ4aYjDK-JVL-ZllghX4RwKRjhpfXIJYkn6EjqAnU1LTos5SqlhAWgWNPqSrc2PNhASCjFjgOPgUiYEWemipXVXypsQCkd5QknTCYHoubVId052UTrvx7T_ILYRBPj3hNnw0n3sjLij4p-idQdQSXc2rfSpvzkwryXuOILN9rSRb6RW4xc_PrhUQrAgkGZOBxAvfTi_";

export default function EditProfileScreen({ navigation }) {
    const [fullName, setFullName] = useState('Alex Chen');
    const [email, setEmail] = useState('alex.chen@glosalia.ai');
    const [phone, setPhone] = useState('+1 (555) 000-1234');
    const [autoStart, setAutoStart] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                Alert.alert('Error', 'User not logged in');
                return;
            }

            const response = await authApi.getProfile(userId);
            if (response.data.status === 'success') {
                const user = response.data.user;
                setFullName(user.full_name || '');
                setEmail(user.email || '');
                setPhone(user.phone || '');
                setAutoStart(user.auto_start);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setShowMenu(false);
        // Reset navigation stack to Login screen
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) throw new Error("User ID not found");
            
            const response = await authApi.editProfile(userId, {
                full_name: fullName,
                email: email,
                phone: phone,
                auto_start: autoStart
            });

            if (response.data.status === 'success') {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Info', 'No changes were made.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fdf8ff" />
            
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back" size={28} color="#4317c6" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>SignLink</Text>
                    </View>
                    <View style={{ position: 'relative' }}>
                        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                            <Entypo name="dots-three-vertical" size={24} color="#484555" />
                        </TouchableOpacity>

                        {showMenu && (
                            <TouchableOpacity 
                                style={styles.logoutMenu}
                                onPress={handleLogout}
                            >
                                <MaterialIcons name="logout" size={18} color="#ba1a1a" />
                                <Text style={styles.logoutMenuText}>Log Out</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.9}>
                            <Image source={{ uri: PROFILE_IMG }} style={styles.avatar} />
                            <View style={styles.editBadge}>
                                <MaterialIcons name="edit" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.titleSection}>
                            <Text style={styles.title}>Edit Profile</Text>
                            <Text style={styles.subtitle}>
                                Manage your personal identity and app preferences
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                            <Feather name="user" size={22} color="#c9c4d8" style={styles.inputIconRight} />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Feather name="mail" size={22} color="#c9c4d8" style={styles.inputIconRight} />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                            <Feather name="phone" size={22} color="#c9c4d8" style={styles.inputIconRight} />
                        </View>
                    </View>

                    {/* Preferences */}
                    <View style={styles.prefsCard}>
                        <View style={styles.prefsTextContainer}>
                            <Text style={styles.prefsTitle}>Real-time Translation Auto-start</Text>
                            <Text style={styles.prefsSubtitle}>
                                Automatically begin translating when sign language is detected.
                            </Text>
                        </View>
                        <Switch
                            value={autoStart}
                            onValueChange={setAutoStart}
                            trackColor={{ false: '#e1deec', true: '#4317c6' }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    {/* Actions */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <MaterialIcons name="save" size={22} color="#fff" />
                                    <Text style={styles.saveText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.discardButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.discardText}>Discard Changes</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
