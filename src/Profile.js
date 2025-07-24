import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { generateCosmosWallet } from '../cosmos'

const Profile = () => {
  return (
    <View>
      <TouchableOpacity onPress={() => {
       generateCosmosWallet("REDACTED_TEST_MNEMONIC")
      }}>
        <Text>Click me</Text>
      </TouchableOpacity>
      <Text>Profile</Text>
    </View>
  )
}

export default Profile