import React from 'react';
import { View, Pressable, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { WebSocketHolder } from './WebsocketHolder';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {

  const [labelText, setLabelText] = useState('status: \n No device is connected');
  const [buttonText, setButtonText] = useState('Connect');
  //for camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [url, setUrl] = useState('');
  //for Websocket  
  const [deviceInfo, setDeviceInfo] = useState(null);
  const isFocused = useIsFocused();


  const handleScan = ({ data }) => {
    //getting url to connect with websocket and making camera view off
    setUrl(data);
    console.log("url is :",data)
    setScannerVisible(false);
  };

  useEffect(() => {
    //code to get device info
      const loadDeviceInfo = async () => {
        setDeviceInfo({"deviceInfo":{
          "name": Device.deviceName,
          "model": Device.modelName,
          "os": Device.osName,
        }
        });
      };
  
      loadDeviceInfo();
    }, []);
  
  useEffect(() => {
      //const socket = new WebSocket('wss://echo.websocket.org'); // Public echo server
      // code to get and send message on websocket
      if (!isFocused || WebSocketHolder.ws){return ;}
      if (!deviceInfo) {return;}
      if (!url || url.trim() === '') {return};
      if (deviceInfo && url){
        const socket = new WebSocket(String(url));
        WebSocketHolder.ws = socket;

        socket.onopen = () => {
          Alert.alert('Connected with device.');
          socket.send(JSON.stringify(deviceInfo));
        };
    
        socket.onmessage = (e) => {
          const parsed = JSON.parse(e.data);
          if (parsed.hasOwnProperty('deviceInfo')) {
            setLabelText(`status: "Connected" \nSystem: ${parsed.deviceInfo.system}\nVersion: ${parsed.deviceInfo.version}\nArchitecture: ${parsed.deviceInfo.architecture}\nHost-name: ${parsed.deviceInfo.node}`);
            setButtonText('Disconnect');
          }
          navigation.navigate('Scanner')
        };
    
        socket.onerror = (e) => {
          console.error('WebSocket error:', e.message);
          Alert.alert(
            'Connection Error',
            'Error during connecting with device: ' + e.message,
            [{ text: 'OK' }]
          );

        };
    
        socket.onclose = (e) => {
          console.log('WebSocket closed:', e.code, e.reason);
          Alert.alert('Disconnected with device');
          WebSocketHolder.ws = null;
          setButtonText("Connect");
          setLabelText('status: \n No device is connected');
          setUrl('');
        };
      
      return () => {
        socket.close();
      };
    }
    }, [deviceInfo,url]); // making it run after getting deviceInfo, and url 

  return(
    <SafeAreaView style={scannerVisible ? styles.scannerMode : styles.container}>
      {!scannerVisible && (
          <>
          <View style={styles.inner}>
            <Text style={styles.text}>{labelText}</Text>
          </View>
          {/*<Button title="Connect" onPress={() => navigation.navigate('Scanner')} />*/}
          <View style = {{ flexDirection: 'row',gap: 48, padding:8}}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (buttonText === "Connect") {
                  (async () => {
                    const response = await requestPermission();
                    if (response?.granted) {
                      setScannerVisible(true);
                      setUrl('');
                    }
                  })();
                } else {
                  if (WebSocketHolder.ws) {
                    WebSocketHolder.ws.close();
                    setButtonText('Connect');
                    setLabelText('status: \n No device is connected');
                    setUrl('');
                    WebSocketHolder.ws = null;
                  }
                }
              }}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>

            {buttonText === 'Disconnect' && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.navigate('Scanner')}
              >
                <Text style={styles.buttonText}>Scan barcode</Text>
              </TouchableOpacity>
            )}
          </View >
          </>
      )}
      {scannerVisible && permission?.granted && (
        <View style = {{flex: 1}}>
          <CameraView
          style={{ flex: 1 }}
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          />
          <View
            style={styles.qrbox}
          />
          
          <Pressable
            style={styles.cancel}
            onPress={() => setScannerVisible(false)}
            >
            <Text style={{ color: 'white',
              borderColor: 'black',
            }}>Cancel</Text>
          </Pressable>
        </View>
        
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9feffff', // Just for visibility
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerMode: {
  flex: 1,
  backgroundColor: '#000', // Optional dark background
  },
  inner: {
    padding: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: '#EDF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center'
  },
  qrbox:{
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    aspectRatio: 1,
    borderColor: 'rgba(115, 159, 255, 1)',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  cancel:{
    position: 'absolute',
    top: 5,
    right: "0%",
    backgroundColor: 'rgba(115, 159, 255, 1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    zIndex: 10,
  },
});
