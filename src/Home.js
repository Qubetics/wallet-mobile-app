import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Actions } from 'react-native-router-flux'

const Home = () => {
  return (
    <View>
      <TouchableOpacity onPress={() => {
        Actions.Profile()
      }}>
        <Text>Click me</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Home