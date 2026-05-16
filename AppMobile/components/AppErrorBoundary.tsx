import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

type State = { error: Error | null };

/** Évite la fermeture totale de l’app : affiche l’erreur JS et permet de réessayer. */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>L’application a rencontré une erreur</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error.message}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Réessayer</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Si le problème continue : désinstallez l’app, réinstallez l’APK, ou contactez le support avec
            cette capture.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 24,
    paddingTop: 64,
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginBottom: 16 },
  scroll: { maxHeight: 200, marginBottom: 20 },
  message: { fontSize: 13, color: '#424242', fontFamily: 'monospace' },
  btn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, color: '#757575', lineHeight: 18 },
});
