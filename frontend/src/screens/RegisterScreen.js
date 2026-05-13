import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { authApi } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerStyles as styles } from '../styles/RegisterStyles';

export default function RegisterScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const buttonScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(buttonScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }
        if (!agreed) {
            Alert.alert('Lỗi', 'Vui lòng đồng ý với Điều khoản dịch vụ.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await authApi.register({
                full_name: fullName,
                email: email,
                password: password
            });

            if (response.data.status === 'success') {
                const { token } = response.data;
                await AsyncStorage.setItem('user_token', token);
                
                Alert.alert('Thành công!', 'Tài khoản đã được tạo.', [
                    { text: 'OK', onPress: () => navigation && navigation.navigate('Login') }
                ]);
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || "Đăng ký thất bại. Vui lòng thử lại.";
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const getInputStyle = (field) => [
        styles.input,
        focusedField === field && styles.inputFocused,
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fdf8ff" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SignLink</Text>
                <TouchableOpacity style={styles.headerIconBtn}>
                    <MaterialIcons name="language" size={24} color="#4317c6" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        {/* Branding */}
                        <View style={styles.brandingSection}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="person-add" size={32} color="#fff" />
                            </View>
                            <Text style={styles.cardTitle}>Create your account</Text>
                            <Text style={styles.cardSubtitle}>
                                Start translating sign language in seconds
                            </Text>
                        </View>

                        {/* Full Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={getInputStyle('name')}
                                placeholder="John Doe"
                                placeholderTextColor="rgba(121,117,135,0.5)"
                                value={fullName}
                                onChangeText={setFullName}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={getInputStyle('email')}
                                placeholder="name@example.com"
                                placeholderTextColor="rgba(121,117,135,0.5)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[...getInputStyle('password'), styles.passwordInput]}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(121,117,135,0.5)"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <MaterialIcons
                                        name={showPassword ? 'visibility-off' : 'visibility'}
                                        size={22}
                                        color="#797587"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[...getInputStyle('confirm'), styles.passwordInput]}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(121,117,135,0.5)"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setFocusedField('confirm')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <MaterialIcons
                                        name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                                        size={22}
                                        color="#797587"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Terms */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                                {agreed && <MaterialIcons name="check" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>.
                            </Text>
                        </TouchableOpacity>

                        {/* Sign Up */}
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleRegister}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={isLoading}
                                activeOpacity={1}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>Sign Up</Text>
                                        <MaterialIcons name="arrow-forward" size={22} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={styles.footerRow}>
                                <Text style={styles.footerText}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => navigation && navigation.navigate('Login')}>
                                    <Text style={styles.footerLink}>Log In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
