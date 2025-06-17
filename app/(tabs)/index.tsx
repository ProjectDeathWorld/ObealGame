import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ElementaryGame from '../../components/ui/ElementaryGame';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerBox}>
        <ThemedText type="title" style={styles.title}>
          🎲 Welcome to the Riddle Challenge!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Test your brain with fun riddles. Choose your level and see how many you can solve!
        </ThemedText>
      </View>
      <View style={styles.gameBox}>
        <ElementaryGame />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
  },
  headerBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6, // Android shadow
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4B2991',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6C63FF',
  },
  gameBox: {
    width: '100%',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
});
