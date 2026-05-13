import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Zap, ZapOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Logic to parse the URL
      // Example: https://portal.menubites.com/la-parilla/5
      let slug = '';
      let table = '';

      if (data.includes('http')) {
        const url = new URL(data);
        const pathParts = url.pathname.split('/').filter(p => p !== '');
        if (pathParts.length >= 2) {
          slug = pathParts[0];
          table = pathParts[1];
        }
      } else {
        const parts = data.split('/');
        if (parts.length >= 2) {
          slug = parts[0];
          table = parts[1];
        }
      }

      if (slug && table) {
        router.replace(`/${slug}/${table}` as any);
      } else {
        Alert.alert('Error', 'Código QR no reconocido');
        setScanned(false);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo leer el código QR');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Overlay Design */}
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <X color="white" size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.torchBtn}
            onPress={() => setTorch(!torch)}
          >
            {torch ? <ZapOff color="#10b981" size={24} /> : <Zap color="white" size={24} />}
          </TouchableOpacity>
        </View>

        <View style={styles.maskContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleRow}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        <View style={styles.footer}>
          <BlurView intensity={20} tint="dark" style={styles.infoBox}>
            <Text style={styles.infoText}>Escanea el código QR de tu mesa</Text>
            <Text style={styles.subInfoText}>Apunta la cámara al centro del recuadro</Text>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskContainer: {
    flex: 1,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  focusedContainer: {
    width: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  footer: {
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  infoBox: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  subInfoText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
});
