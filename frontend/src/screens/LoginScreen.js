import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/LoginStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/Config';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: 'dummy' })
            });
            const data = await response.json();
            if (response.ok) {
                // Lưu token và thông tin user vào storage
                await AsyncStorage.setItem('userToken', data.access_token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                
                navigation.navigate('MainTabs');
            } else {
                alert(data.detail || "Đăng nhập thất bại.");
            }
        } catch (error) {
            alert("Lỗi kết nối Server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <Text style={styles.logoText}>SIGNLINK</Text>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.blurCircle1} />
                    <View style={styles.blurCircle2} />

                    <View style={styles.card}>
                        <View style={{ marginBottom: 32 }}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>
                                Access your universal sign language interpreter with AI intelligence.
                            </Text>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#797587" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="alex.chen@glosalia.com"
                                    placeholderTextColor="#C9C4D8"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Password</Text>
                                <TouchableOpacity>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#797587" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="••••••••••••"
                                    placeholderTextColor="#C9C4D8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#797587" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
                            <Text style={styles.signInText}>Sign In</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </TouchableOpacity>

                        {/* OR CONTINUE WITH */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={20} color="#484555" />
                                <Text style={styles.socialText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={20} color="#484555" />
                                <Text style={styles.socialText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Create Account */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerLink}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
