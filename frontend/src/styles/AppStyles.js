import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraContainer: { flex: 1.5, position: 'relative', overflow: 'hidden', borderRadius: 20, margin: 10 },
    webView: { flex: 1, backgroundColor: 'transparent' },
    hudContainer: { position: 'absolute', top: 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between' },
    predictionBadge: { backgroundColor: 'rgba(255, 69, 0, 0.85)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, minWidth: 140 },
    badgeTitle: { color: '#fff', fontSize: 10, fontWeight: 'bold', opacity: 0.8 },
    badgeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    confBadge: { backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // --- Styles cho Nút bấm điều khiển ---
    controlPanel: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    btn: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    btnDelete: { backgroundColor: '#444' },
    btnClear: { backgroundColor: '#B22222' },
    btnTranslate: { backgroundColor: '#4CD964', minWidth: 140 },
    btnDisabled: { backgroundColor: '#225522', opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    // --- Dashboard kết quả ---
    dashboard: { flex: 1, backgroundColor: '#1A1A1A', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 20 },
    section: { marginBottom: 15 },
    label: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    glossValue: { color: '#F9D423', fontSize: 18, fontWeight: 'bold' },
    translationSection: { flex: 1, backgroundColor: '#262626', padding: 15, borderRadius: 15 },
    translationValue: { color: '#4CD964', fontSize: 20, fontWeight: 'bold' },
    translationPending: { color: '#8E8E93', fontSize: 18, fontStyle: 'italic' },
    errorBanner: { position: 'absolute', bottom: 10, left: 25, right: 25, backgroundColor: '#FF3B30', flexDirection: 'row', padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
