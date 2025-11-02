import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebSocketHolder } from './WebsocketHolder';
import { useIsFocused } from '@react-navigation/native';

export default function BarcodeScannerScreen({ navigation }) {
  //for camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  //for barcode
  const [barcodeData, setBarcodeData] = useState('');
  const [buttonDisable, setButtonDisable] = useState(true);
  //for websocket
  const [serverAskingfor, setServerAskingfor] = useState('');
  const [key, setKey] = useState('');
  const isFocused = useIsFocused();
  

  useEffect(() => {
    if (!isFocused){ return ;}
    if (WebSocketHolder.ws){
      const ws = WebSocketHolder.ws;
      ws.onmessage = (e) => {
        const parsedData = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        console.log('Message in scanner:', e.data);
        setButtonDisable(false);
        setKey(Object.keys(parsedData)[0])
        console.log("key:",Object.keys(parsedData))
        setServerAskingfor(`server asking for: ${key}`);
      }
      ws.onerror = (e) => {
        console.log("error in websocket");
        console.error('WebSocket error:', e.message);
        Alert.alert(message = 'Some error occured:'+e.message)
        navigation.navigate('Home');
      };    
      ws.onclose = (e) => {    
        console.log('WebSocket closed:', e.code, e.reason);
        WebSocketHolder.ws = null;
        Alert.alert(message = 'Disconnected with the device');
        navigation.navigate('Home');
      };
      

      /*return () => {
        ws.close(); // Cleanup
      }*/
    }
    else{navigation.navigate('Home');};
  }, []);
  


  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    
    return (
      <View style={styles.center}>
        {/*<Text>{permission}</Text>*/}
        <Text style={styles.message}>Camera access is required to scan</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }
  
  const handleScan = ({ type, data }) => {
    setScannerVisible(false);
    setScanned(true);
    setBarcodeData(`Type: ${type}\nData: ${data}`);
    console.log({[key]:data});
    if (WebSocketHolder.ws){
      WebSocketHolder.ws.send(JSON.stringify({[key]:data}));
    }
    else{
      Alert.alert(message = 'please connect with device first to send the result');
    }
    setButtonDisable(true);
    setServerAskingfor('');
  };

  return (
    <View style={styles.container}>
      {!scannerVisible && (
        <View style={styles.center}>
          <Text style = {{marginBottom: 5}}>{serverAskingfor}</Text>
          <Text style={styles.title}>Scan and send the data</Text>
          <TouchableOpacity
            style = {styles.button}
            disabled = {buttonDisable}
            onPress={() => {
              setScanned(false);
              setBarcodeData('');
              setScannerVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Start Scanner</Text>
          </TouchableOpacity>
          {scanned && (
            <View style={styles.overlay}>
              <Text style={styles.resultText}>{barcodeData}</Text>
            </View>
          )}
        </View>
      )}

      {scannerVisible && (
        <View style={{flex:1}}>
          <CameraView
          style={styles.camera}
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{
            barcodeTypes: [ 'ean13', 'code128'],
          }}
          />
          <View
            style={styles.barcodebox}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'justify'
  },
  overlay: {
    marginTop: 30,
    backgroundColor: '#f2f2f2',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  barcodebox:{
    position: 'absolute',
    top: '30%',
    width: '80%',
    height: '20%',
    alignSelf: 'center',
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
