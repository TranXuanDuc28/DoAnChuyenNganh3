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
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginStyles as styles } from '../styles/LoginStyles';

const BG_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuClNpGB8wBeLvSqn0zOyGnRjS_CKbpwvJjWJ7YKUqRoLl6GrEKrmk5va-aElN6BLHmgvRsWZZfe_OGcBy04jgloFPQmcH32WFjJUxNlDWZDReAmfJsLo2OpOvCcISaSi7yRlvJZ2LfDEXyf7yloTitpmRcGZ-WnjzOw7qMnJNW2ZCAM7-biXLxV3CQMLiWXX4GvXubIZ3OH95ah8MFs3SP7lmi0Yea5Hk_42FxPFhlX1sgf_m5_-NdTShpLkBQYj96SiCbDCMZhHhm7";

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const buttonScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(buttonScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await authApi.login({ email, password });
            if (response.data.status === 'success') {
                const { token, user } = response.data;
                await AsyncStorage.setItem('user_token', token);
                await AsyncStorage.setItem('user_id', user.id.toString());
                await AsyncStorage.setItem('user_name', user.full_name);
                
                if (navigation) {
                    navigation.replace('MainTabs');
                }
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || "Đăng nhập thất bại. Vui lòng thử lại.";
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" transparent backgroundColor="transparent" />
            <ImageBackground source={{ uri: BG_IMAGE }} style={styles.backgroundImage} blurRadius={1}>
                <View style={styles.overlay} />
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconBox}>
                            <MaterialCommunityIcons name="gesture-tap" size={28} color="#fff" />
                        </View>
                        <Text style={styles.headerTitle}>SIGNLINK</Text>
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
                            {/* Premium Card */}
                            <View style={styles.card}>
                                {/* Welcome */}
                                <View style={styles.welcomeSection}>
                                    <Text style={styles.welcomeTitle}>Welcome Back</Text>
                                    <Text style={styles.welcomeSubtitle}>
                                        Access your universal sign language interpreter with AI intelligence.
                                    </Text>
                                </View>

                                {/* Email */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        emailFocused && styles.inputWrapperFocused,
                                    ]}>
                                        <View style={styles.inputIconLeft}>
                                            <MaterialIcons name="mail-outline" size={24} color={emailFocused ? "#4317c6" : "#797587"} />
                                        </View>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="alex.chen@glosalia.com"
                                            placeholderTextColor="#c9c4d8"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={email}
                                            onChangeText={setEmail}
                                            onFocus={() => setEmailFocused(true)}
                                            onBlur={() => setEmailFocused(false)}
                                        />
                                    </View>
                                </View>

                                {/* Password */}
                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>Password</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                            <Text style={styles.forgotText}>Forgot Password?</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[
                                        styles.inputWrapper,
                                        passwordFocused && styles.inputWrapperFocused,
                                    ]}>
                                        <View style={styles.inputIconLeft}>
                                            <MaterialIcons name="lock-outline" size={24} color={passwordFocused ? "#4317c6" : "#797587"} />
                                        </View>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="••••••••••••"
                                            placeholderTextColor="#c9c4d8"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <MaterialIcons
                                                name={showPassword ? 'visibility-off' : 'visibility'}
                                                size={24}
                                                color="#797587"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Sign In */}
                                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                    <TouchableOpacity
                                        style={styles.submitButton}
                                        onPress={handleLogin}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        disabled={isLoading}
                                        activeOpacity={1}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.submitText}>Sign In</Text>
                                                <MaterialIcons name="arrow-forward" size={22} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <View style={styles.dividerTextWrap}>
                                        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                                    </View>
                                </View>

                                {/* Social */}
                                <View style={styles.socialRow}>
                                    <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                                        <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                                        <Text style={styles.socialText}>Google</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                                        <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
                                        <Text style={styles.socialText}>Facebook</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Register */}
                                <View style={styles.footerSection}>
                                    <View style={styles.footerRow}>
                                        <Text style={styles.footerText}>Don't have an account?</Text>
                                        <TouchableOpacity onPress={() => navigation && navigation.navigate('Register')}>
                                            <Text style={styles.footerLink}>Create Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
}
