import { StyleSheet } from 'react-native';

export const registerStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fdf8ff',
    },

    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: '#c9c4d8',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4317c6',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ebe6f3',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- Content ---
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },

    // --- Card ---
    card: {
        backgroundColor: '#f7f1ff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c9c4d8',
        paddingHorizontal: 28,
        paddingVertical: 32,
        shadowColor: '#5b3cdd',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },

    // --- Branding ---
    brandingSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#5b3cdd',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1c1a24',
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#484555',
        lineHeight: 24,
        textAlign: 'center',
        marginTop: 8,
    },

    // --- Form ---
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#484555',
        marginBottom: 6,
        marginLeft: 4,
        letterSpacing: 0.3,
    },
    input: {
        height: 56,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#c9c4d8',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1c1a24',
    },
    inputFocused: {
        borderColor: '#4317c6',
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    passwordWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeButton: {
        position: 'absolute',
        right: 14,
        padding: 4,
    },

    // --- Terms ---
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
        paddingVertical: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#c9c4d8',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: '#4317c6',
        borderColor: '#4317c6',
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#484555',
        lineHeight: 22,
        letterSpacing: 0.3,
    },
    termsLink: {
        color: '#4317c6',
        fontWeight: '700',
    },

    // --- Button ---
    submitButton: {
        height: 56,
        backgroundColor: '#4317c6',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    submitText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },

    // --- Footer ---
    footer: {
        marginTop: 28,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#c9c4d8',
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        color: '#484555',
    },
    footerLink: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4317c6',
        marginLeft: 4,
        textDecorationLine: 'underline',
    },
});
