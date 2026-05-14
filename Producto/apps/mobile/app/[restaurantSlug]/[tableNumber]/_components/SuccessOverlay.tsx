import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

interface SuccessOverlayProps {
  visible: boolean;
  onClose: () => void;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export const SuccessOverlay = ({ visible, onClose, primaryColor, bgColor, textColor }: SuccessOverlayProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.successOverlay}>
        <Animated.View entering={ZoomIn} style={[styles.successCard, { backgroundColor: bgColor, borderColor: primaryColor + '30' }]}>
          <View style={[styles.successIconBg, { backgroundColor: primaryColor + '10' }]}>
            <CheckCircle2 size={72} color={primaryColor} />
          </View>
          <Text style={[styles.successTitle, { color: textColor }]}>¡Solicitud Enviada!</Text>
          <Text style={[styles.successDesc, { color: textColor + '70' }]}>Tu pedido ha sido enviado al garzón. En breve será validado para marchar a cocina.</Text>
          <TouchableOpacity style={[styles.successBtn, { backgroundColor: primaryColor }]} onPress={onClose}>
            <Text style={styles.successBtnText}>Entendido</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCard: { padding: 40, borderRadius: 40, alignItems: 'center', borderWidth: 1, width: '100%' },
  successIconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  successDesc: { textAlign: 'center', fontSize: 17, marginTop: 16, lineHeight: 24, fontWeight: '500' },
  successBtn: { marginTop: 40, paddingHorizontal: 48, paddingVertical: 18, borderRadius: 24, width: '100%', alignItems: 'center' },
  successBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
});
