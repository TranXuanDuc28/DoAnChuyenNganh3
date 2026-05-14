import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const loginStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: width,
        height: height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(253, 248, 255, 0.85)',
    },
    safeArea: {
        flex: 1,
    },

    // --- Header ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        height: 80,
        gap: 12,
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#4317c6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#4317c6',
        letterSpacing: -1.5,
    },

    // --- Main content ---
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },

    // --- Card ---
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 40,
        paddingHorizontal: 30,
        paddingVertical: 50,
        borderWidth: 1,
        borderColor: 'rgba(201, 196, 216, 0.4)',
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 20,
        width: '100%',
    },

    // --- Welcome ---
    welcomeSection: {
        marginBottom: 40,
    },
    welcomeTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: '#1c1a24',
        letterSpacing: -1.8,
        marginBottom: 10,
    },
    welcomeSubtitle: {
        fontSize: 18,
        color: '#484555',
        lineHeight: 28,
    },

    // --- Form ---
    formGroup: {
        marginBottom: 28,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 6,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#484555',
        letterSpacing: 0.4,
    },
    forgotText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4317c6',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf8ff',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#c9c4d8',
        height: 68,
        paddingHorizontal: 22,
    },
    inputWrapperFocused: {
        borderColor: '#4317c6',
        borderWidth: 2,
        backgroundColor: '#fff',
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
    inputIconLeft: {
        marginRight: 16,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        color: '#1c1a24',
        paddingVertical: 0,
    },
    eyeButton: {
        padding: 8,
    },

    // --- Sign In Button ---
    submitButton: {
        height: 68,
        backgroundColor: '#4317c6',
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    submitText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.8,
    },

    // --- Divider ---
    dividerContainer: {
        marginVertical: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1.5,
        backgroundColor: '#c9c4d8',
    },
    dividerTextWrap: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        paddingHorizontal: 24,
    },
    dividerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#797587',
        letterSpacing: 2,
    },

    // --- Social ---
    socialRow: {
        flexDirection: 'row',
        gap: 20,
    },
    socialButton: {
        flex: 1,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1.5,
        borderColor: '#c9c4d8',
        borderRadius: 22,
        backgroundColor: '#ffffff',
    },
    socialText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#484555',
    },

    // --- Footer ---
    footerSection: {
        marginTop: 45,
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 17,
        color: '#484555',
    },
    footerLink: {
        fontSize: 17,
        fontWeight: '800',
        color: '#4317c6',
        marginLeft: 8,
        textDecorationLine: 'underline',
    },
});
