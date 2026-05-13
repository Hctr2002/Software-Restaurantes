import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Plus, Receipt, Timer, Bell, Wallet } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface ActiveOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  activeOrders: any[];
  table: any;
  onCallWaiter: () => void;
  onConfirmBill: () => void;
  callingWaiter: boolean;
  requestingBill: boolean;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}

export const ActiveOrdersModal = ({ 
  visible, 
  onClose, 
  activeOrders, 
  table,
  onCallWaiter,
  onConfirmBill,
  callingWaiter,
  requestingBill,
  primaryColor, 
  bgColor, 
  textColor,
  getStatusText,
  getStatusColor
}: ActiveOrdersModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Mi Mesa</Text>
              <Text style={{ color: textColor + '60', fontSize: 14 }}>Estado de tus pedidos</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Plus color={textColor} size={28} style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Assistance Actions */}
          <View style={styles.assistanceRow}>
            <TouchableOpacity 
              style={[
                styles.assistanceBtn, 
                { 
                  backgroundColor: table?.help_requested ? primaryColor + '20' : 'rgba(255,255,255,0.05)', 
                  borderColor: table?.help_requested ? primaryColor : 'rgba(255,255,255,0.1)' 
                }
              ]} 
              onPress={onCallWaiter}
              disabled={callingWaiter || table?.help_requested}
            >
              {callingWaiter ? <ActivityIndicator size="small" color={primaryColor} /> : <Bell size={18} color={table?.help_requested ? primaryColor : textColor} />}
              <Text style={[styles.assistanceBtnText, { color: table?.help_requested ? primaryColor : textColor }]}>
                {table?.help_requested ? 'Garzón llamado' : 'Llamar Garzón'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.assistanceBtn, 
                { 
                  backgroundColor: table?.bill_requested ? '#10b98120' : 'rgba(255,255,255,0.05)', 
                  borderColor: table?.bill_requested ? '#10b981' : 'rgba(255,255,255,0.1)' 
                }
              ]} 
              onPress={onConfirmBill}
              disabled={requestingBill || table?.bill_requested}
            >
              {requestingBill ? <ActivityIndicator size="small" color="#10b981" /> : <Wallet size={18} color={table?.bill_requested ? '#10b981' : textColor} />}
              <Text style={[styles.assistanceBtnText, { color: table?.bill_requested ? '#10b981' : textColor }]}>
                {table?.bill_requested ? 'Cuenta solicitada' : 'Pedir Cuenta'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.summaryList} showsVerticalScrollIndicator={false}>
            {(activeOrders || []).length === 0 ? (
              <View style={styles.emptyAccount}>
                <Receipt size={48} color={textColor + '20'} />
                <Text style={{ color: textColor + '40', marginTop: 16, textAlign: 'center' }}>Aún no has realizado pedidos</Text>
              </View>
            ) : (
              activeOrders.map(order => (
                <View key={order.id} style={[styles.activeOrderCard, { borderColor: textColor + '10' }]}>
                  <View style={styles.orderCardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Timer size={12} color={getStatusColor(order.status)} />
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{getStatusText(order.status)}</Text>
                    </View>
                    <Text style={{ color: textColor + '40', fontSize: 12 }}>#{order.id?.slice(0, 8)}</Text>
                  </View>
                  
                  {(order.items || order.order_items || []).map((item: any, idx: number) => (
                    <View key={idx} style={styles.orderCardItem}>
                      <Text style={{ color: textColor, fontWeight: '600' }}>{item.quantity}x {item.menu_item?.name || item.menu_items?.name || 'Producto'}</Text>
                      <Text style={{ color: textColor + '60' }}>${((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}</Text>
                    </View>
                  ))}
                  
                  <View style={[styles.orderCardFooter, { borderTopColor: textColor + '05' }]}>
                    <Text style={{ color: textColor + '60' }}>Total del pedido</Text>
                    <Text style={{ color: textColor, fontWeight: '900' }}>${(order.total_amount || 0).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {(activeOrders || []).length > 0 && (
            <View style={[styles.modalFooter, { borderTopColor: textColor + '10' }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: textColor + '60' }]}>Total Acumulado</Text>
                <Text style={[styles.totalValue, { color: primaryColor }]}>
                  ${activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: textColor + '10' }]} 
                onPress={onClose}
              >
                <Text style={[styles.confirmBtnText, { color: textColor }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: height * 0.75, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  assistanceRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  assistanceBtn: { flex: 1, height: 48, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  assistanceBtnText: { fontSize: 13, fontWeight: '800' },
  summaryList: { flex: 1 },
  activeOrderCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  orderCardItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderCardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyAccount: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  modalFooter: { paddingTop: 24, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '900' },
  confirmBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
});
