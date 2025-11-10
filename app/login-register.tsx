import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const LoginRegisterScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<any>(null); // <-- almacena usuario si quieres

  const API_BASE_URL = process.env.API_BASE_URL || 'http://10.61.154.136:3000';

  const handleAuth = async () => {
    try {
      const url = `${API_BASE_URL}${isLogin ? '/users/login' : '/users/register'}`;
      const payload = isLogin
        ? { email, password }
        : { email, passwordHash: password, fullName };

      const response = await axios.post(url, payload);

      console.log('Response data:', response.data);

      if (response.data.error) {
        Alert.alert('Error', response.data.error);
      } else {
        // Guarda el usuario en AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Saving user to AsyncStorage:', response.data.user);
        console.log('User saved to AsyncStorage');

        Alert.alert(
          'Success',
          isLogin ? 'Login successful!' : 'Registration successful!'
        );

        // Redirige al index
        router.push('/');

        // Fetch horarios data from the API
        console.log('Fetching horarios from API...');
const horariosResponse = await axios.get(`${API_BASE_URL}/horarios`);
        console.log('Horarios fetched:', horariosResponse.data);
        console.log('Horarios fetched:', JSON.stringify(horariosResponse.data, null, 2));
        await AsyncStorage.setItem('horarios', JSON.stringify(horariosResponse.data));
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>
      <Text style={styles.label}>Solo se aceptan correos con terminación @uteq.edu.mx</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      )}

      <View style={styles.buttonContainer}>
        <Button title={isLogin ? 'Login' : 'Register'} onPress={handleAuth} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isLogin ? 'Switch to Register' : 'Switch to Login'}
          onPress={() => setIsLogin(!isLogin)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginVertical: 8,
    alignItems: 'center',
  },
});

export default LoginRegisterScreen;
