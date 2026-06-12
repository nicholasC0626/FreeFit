import { useEffect, useState } from "react";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { lookupBarcode, type BarcodeFood } from "../services/nutrition.service";
import { getApiErrorMessage } from "../utils/api-error";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with the looked-up product when a barcode scan succeeds. */
  onFound: (food: BarcodeFood) => void;
};

const BARCODE_PATTERN = /^\d{6,14}$/;

export default function BarcodeScannerModal({ visible, onClose, onFound }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setLookupError(null);
    setIsPaused(false);
    if (!permission?.granted && permission?.canAskAgain !== false) {
      void requestPermission();
    }
    // Only re-run when the modal opens, not on every permission object change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleScanned = async ({ data }: BarcodeScanningResult) => {
    if (isPaused || isLookingUp) {
      return;
    }
    const code = data.trim();
    if (!BARCODE_PATTERN.test(code)) {
      return;
    }

    setIsPaused(true);
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const food = await lookupBarcode(code);
      onFound(food);
    } catch (err) {
      setLookupError(getApiErrorMessage(err, "Could not look up this barcode."));
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              // Product barcodes only — keeps QR codes and other noise out.
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={isPaused ? undefined : (result) => void handleScanned(result)}
          />
        ) : (
          <View style={styles.messageBox}>
            {!permission || permission.canAskAgain ? (
              <ActivityIndicator color="#ffffff" size="large" />
            ) : (
              <Text style={styles.messageText}>
                Camera access is needed to scan barcodes. Enable it in your device settings.
              </Text>
            )}
          </View>
        )}

        {permission?.granted && !isPaused ? (
          <View style={styles.scanFrameWrapper} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.hintText}>Point the camera at a product barcode</Text>
          </View>
        ) : null}

        {isLookingUp ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={styles.overlayText}>Looking up product...</Text>
          </View>
        ) : null}

        {lookupError && !isLookingUp ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{lookupError}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setLookupError(null);
                setIsPaused(false);
              }}
            >
              <Text style={styles.retryButtonText}>Scan again</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  messageBox: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  messageText: {
    color: "#ffffff",
    fontSize: 15,
    textAlign: "center",
  },
  scanFrameWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 16,
    opacity: 0.8,
  },
  hintText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 14,
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  overlayText: {
    color: "#ffffff",
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
