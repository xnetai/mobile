import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {useWalletStore} from '../store/walletStore';

interface WalletSetupScreenProps {
  onComplete: () => void;
}

export const WalletSetupScreen: React.FC<WalletSetupScreenProps> = ({
  onComplete,
}) => {
  const [mode, setMode] = useState<'choose' | 'create' | 'import'>('choose');
  const [mnemonic, setMnemonic] = useState('');
  const [importPhrase, setImportPhrase] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);

  const {createWallet, importWallet} = useWalletStore();

  const handleCreateWallet = () => {
    const wallet = createWallet();
    setMnemonic(wallet.mnemonic || '');
    setMode('create');
    setShowMnemonic(true);
  };

  const handleConfirmCreate = () => {
    Alert.alert(
      'Wallet Created',
      'Your wallet has been created successfully. Make sure you have saved your recovery phrase!',
      [
        {
          text: 'OK',
          onPress: onComplete,
        },
      ],
    );
  };

  const handleImportWallet = () => {
    try {
      importWallet(importPhrase);
      Alert.alert('Wallet Imported', 'Your wallet has been imported successfully!', [
        {
          text: 'OK',
          onPress: onComplete,
        },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.title}>Welcome to CryptoWallet</Text>
          <Text style={styles.subtitle}>
            Create a new wallet or import an existing one
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateWallet}
            testID="create-wallet-button">
            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('import')}
            testID="import-wallet-button">
            <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Your Recovery Phrase</Text>
          <Text style={styles.subtitle}>
            Write down these 12 words in order and keep them safe. You'll need
            them to recover your wallet.
          </Text>

          <View style={styles.mnemonicContainer}>
            {mnemonic.split(' ').map((word, index) => (
              <View key={index} style={styles.mnemonicWord}>
                <Text style={styles.mnemonicNumber}>{index + 1}</Text>
                <Text style={styles.mnemonicText}>{word}</Text>
              </View>
            ))}
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Never share your recovery phrase with anyone. Store it securely
              offline.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConfirmCreate}
            testID="confirm-create-button">
            <Text style={styles.primaryButtonText}>I've Saved My Phrase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={() => {
              setMode('choose');
              setMnemonic('');
            }}>
            <Text style={styles.textButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (mode === 'import') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Import Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your 12 or 24 word recovery phrase
          </Text>

          <TextInput
            style={styles.mnemonicInput}
            value={importPhrase}
            onChangeText={setImportPhrase}
            placeholder="Enter your recovery phrase..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            testID="import-phrase-input"
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !importPhrase.trim() && styles.disabledButton,
            ]}
            onPress={handleImportWallet}
            disabled={!importPhrase.trim()}
            testID="confirm-import-button">
            <Text style={styles.primaryButtonText}>Import Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={() => {
              setMode('choose');
              setImportPhrase('');
            }}>
            <Text style={styles.textButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  textButton: {
    paddingVertical: 12,
  },
  textButtonText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
  mnemonicContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mnemonicWord: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  mnemonicNumber: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  mnemonicText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  mnemonicInput: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  warningBox: {
    backgroundColor: '#332800',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
