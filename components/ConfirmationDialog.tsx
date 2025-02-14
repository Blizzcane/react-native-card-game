import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ visible, title, message, onConfirm, onCancel }) => {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  dialog: { width: 300, padding: 20, backgroundColor: "#fff", borderRadius: 10, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: { flex: 1, padding: 10, alignItems: "center", borderRadius: 5, marginHorizontal: 5 },
  cancelButton: { backgroundColor: "gray" },
  confirmButton: { backgroundColor: "red" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ConfirmationDialog;
