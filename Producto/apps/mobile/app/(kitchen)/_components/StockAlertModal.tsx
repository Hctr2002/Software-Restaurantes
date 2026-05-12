import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AlertTriangle, X, Send } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../../constants/MB_Theme';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StockAlertModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StockAlertModal({ visible, onClose }: StockAlertModalProps) {
  const { colors } = useTheme();
  const { restaurantId, user } = useAuth();
  
  const [alertItem, setAlertItem] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!alertMsg.trim() || !restaurantId) return;
    setSending(true);
    
    try {
      const { error } = await supabase.from('alerts').insert({
        restaurant_id: restaurantId,
        user_id: user?.id || null,
        user_email: user?.email || null,
        type: 'STOCK_SHORTAGE',
        message: alertMsg.trim(),
        status: 'PENDING',
        menu_item_name: alertItem.trim() || null,
      });

      if (error) throw error;
      
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setAlertItem('');
        setAlertMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[StockAlert] Error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centered}
        >
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
          
          <Animated.View 
            entering={FadeInDown.springify()} 
            style={[styles.modalContent, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.alertIconBox}>
                  <AlertTriangle size={20} color="#f59e0b" />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>REPORTAR QUIEBRE</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>PRODUCTO AFECTADO</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  placeholder="Ej. Salmón Ahumado..."
                  placeholderTextColor={colors.muted}
                  value={alertItem}
                  onChangeText={setAlertItem}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>MENSAJE DETALLADO</Text>
                <TextInput 
                  style={[styles.input, styles.textArea, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  placeholder="Indica el motivo o cantidad restante..."
                  placeholderTextColor={colors.muted}
                  value={alertMsg}
                  onChangeText={setAlertMsg}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.sendBtn, 
                  { backgroundColor: sent ? '#10b981' : '#f59e0b' },
                  (!alertMsg.trim() || sending) && styles.disabledBtn
                ]}
                onPress={handleSend}
                disabled={!alertMsg.trim() || sending || sent}
              >
                {sending ? (
                  <ActivityIndicator color="white" />
                ) : sent ? (
                  <Text style={styles.sendBtnText}>¡ENVIADO!</Text>
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>ENVIAR ALERTA</Text>
                    <Send size={16} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  dismissArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  sendBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  }
});
