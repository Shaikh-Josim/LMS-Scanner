import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen'
import ScannerScreen from './screens/ScannerScreen';
//import WebSocketScreen from './screens/WebsocketScreen';

const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        {/*<Stack.Screen name="WebSocket" component={WebSocketScreen} />*/}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
