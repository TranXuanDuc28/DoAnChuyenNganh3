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
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80";

export default function EditProfileScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [autoStart, setAutoStart] = useState(true);
    const [avatar, setAvatar] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) {
                Alert.alert('Error', 'User not logged in');
                return;
            }
            const userData = JSON.parse(userDataStr);
            const userId = userData.id || userData.user_id;
            
            if (!userId) {
                Alert.alert('Error', 'User ID not found');
                return;
            }

            const response = await authApi.getProfile(userId);
            if (response.data.status === 'success') {
                const user = response.data.user;
                setFullName(user.full_name || '');
                setEmail(user.email || '');
                setPhone(user.phone || '');
                setAutoStart(user.auto_start);
                setAvatar(user.avatar || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setAvatar(base64Image);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setShowMenu(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) throw new Error("User not logged in");
            const userData = JSON.parse(userDataStr);
            const userId = userData.id || userData.user_id;
            
            if (!userId) throw new Error("User ID not found");
            
            const response = await authApi.editProfile(userId, {
                full_name: fullName,
                email: email,
                phone: phone,
                auto_start: autoStart,
                avatar: avatar
            });

            if (response.data.status === 'success') {
                // Update local storage
                const updatedUser = { 
                    ...userData, 
                    name: fullName, 
                    email: email, 
                    phone: phone, 
                    auto_start: autoStart,
                    avatar: avatar
                };
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

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
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back" size={28} color="#4317c6" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Lumina Sign</Text>
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
                    <View style={styles.avatarSection}>
                        <TouchableOpacity 
                            style={styles.avatarContainer} 
                            activeOpacity={0.9}
                            onPress={pickImage}
                        >
                            <Image 
                                source={{ uri: avatar || DEFAULT_AVATAR }} 
                                style={styles.avatar} 
                            />
                            <View style={styles.editBadge}>
                                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.titleSection}>
                            <Text style={styles.title}>Edit Profile</Text>
                            <Text style={styles.subtitle}>
                                Manage your personal identity and app preferences
                            </Text>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Your full name"
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
                                placeholder="Email address"
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
                                placeholder="Phone number"
                            />
                            <Feather name="phone" size={22} color="#c9c4d8" style={styles.inputIconRight} />
                        </View>
                    </View>

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

