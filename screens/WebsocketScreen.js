import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import * as Device from 'expo-device';
import { WebSocketHolder } from './WebsocketHolder';

const WebSocketExample = () => {
  const [message, setMessage] = useState('');
  const [received, setReceived] = useState('');
  const [ws, setWs] = useState(null);

  const [deviceInfo, setDeviceInfo] = useState(null);
  //const [isDeviceInfoSend, setIsDeviceInfoSend] = useState(false)
  
  useEffect(() => {
    const loadDeviceInfo = async () => {
      setDeviceInfo({"deviceInfoo":{
        "name": await Device.deviceName,
        "model": Device.modelName,
        "os": Device.osName,
      }
      });
    };

    loadDeviceInfo();
  }, []);

  useEffect(() => {
    //const socket = new WebSocket('wss://echo.websocket.org'); // Public echo server
    if (!deviceInfo) {return;}
    socket = WebSocketHolder.ws 
    setWs(socket);

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify(deviceInfo));
    };

    socket.onmessage = (e) => {
      console.log('Received:', e.data);
      setReceived(e.data);
    };

    socket.onerror = (e) => {
      console.error('WebSocket error:', e.message);
    };

    socket.onclose = (e) => {
      console.log('WebSocket closed:', e.code, e.reason);
    };

    return () => {
      socket.close();
    };
  }, [deviceInfo]);

  const sendMessage = () => {
    if (WebSocketHolder.ws && WebSocketHolder.ws.readyState === WebSocket.OPEN) {
      WebSocketHolder.ws.send(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Received: {received}</Text>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
});

export default WebSocketExample;
