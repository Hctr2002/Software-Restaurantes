import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Plus } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  cart: any[];
  cartTotal: number;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export const CheckoutModal = ({ 
  visible, 
  onClose, 
  cart, 
  cartTotal, 
  onPlaceOrder, 
  isPlacing, 
  primaryColor, 
  bgColor, 
  textColor 
}: CheckoutModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Tu Pedido</Text>
            <TouchableOpacity onPress={onClose} style={[styles.modalClose, { backgroundColor: textColor + '10' }]}>
              <Plus color={textColor} size={28} style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.summaryList} showsVerticalScrollIndicator={false}>
            {cart.map(item => (
              <View key={item.id} style={[styles.summaryItem, { borderBottomColor: textColor + '10' }]}>
                <View style={styles.summaryItemInfo}>
                  <Text style={[styles.summaryItemName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.summaryItemPrice, { color: textColor + '60' }]}>${item.price.toLocaleString()} x {item.quantity}</Text>
                </View>
                <Text style={[styles.summaryItemTotal, { color: textColor }]}>${(item.price * item.quantity).toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: textColor + '10' }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: textColor + '60' }]}>Total a pagar</Text>
              <Text style={[styles.totalValue, { color: primaryColor }]}>${cartTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: primaryColor }, isPlacing && { opacity: 0.7 }]} 
              onPress={onPlaceOrder} 
              disabled={isPlacing}
            >
              {isPlacing ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Solicitar Pedido</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: height * 0.75, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  modalClose: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  summaryList: { flex: 1 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  summaryItemInfo: { flex: 1 },
  summaryItemName: { fontSize: 17, fontWeight: '700' },
  summaryItemPrice: { fontSize: 14, marginTop: 4 },
  summaryItemTotal: { fontSize: 17, fontWeight: '900' },
  modalFooter: { paddingTop: 24, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '900' },
  confirmBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
});
