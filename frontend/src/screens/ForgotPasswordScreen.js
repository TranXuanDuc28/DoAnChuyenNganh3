import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { authApi } from '../api/api';
import { forgotPasswordStyles as styles } from '../styles/ForgotPasswordStyles';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendLink = async () => {
        if (!email) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            if (response.data.status === 'success') {
                Alert.alert(
                    'Success',
                    'A recovery link has been sent to your email address.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || "Không tìm thấy email hoặc có lỗi xảy ra.";
            Alert.alert('Lỗi', errorMsg);
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
                    <View style={styles.logoContainer}>
                        <MaterialCommunityIcons name="gesture-tap" size={28} color="#4317c6" />
                        <Text style={styles.logoText}>SignLink</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="close" size={24} color="#1c1a24" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Forgot Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email to receive a recovery link.
                        </Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="email-outline" size={24} color="#797587" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="alex.chen@example.com"
                                placeholderTextColor="#c9c4d8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSendLink}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitText}>Forgot Password</Text>
                                    <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.backButton, { marginTop: 24 }]} onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back" size={20} color="#4317c6" />
                            <Text style={styles.backText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.supportRow}>
                            <Text style={styles.supportText}>Having trouble? </Text>
                            <TouchableOpacity>
                                <Text style={styles.supportLink}>Contact Support</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Feather name="check-circle" size={16} color="#797587" />
                                <Text style={styles.infoText}>Secure link</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Feather name="clock" size={16} color="#797587" />
                                <Text style={styles.infoText}>Expires in 24h</Text>
                            </View>
                        </View>

                        <Text style={styles.copyrightText}>
                            © 2024 GLOSSALIA AI Language Intelligence. All rights reserved.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
