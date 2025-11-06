import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import images from '../../theme/Images';
import { heightDimen, widthDimen } from '../../Utils';
import SessionCard from './SessionCard';
import { WalletMain } from '../screens';
import { ThemeManager } from '../../../ThemeManager';
import fonts from '../../theme/Fonts';
import { Fonts } from '../../theme';

const RecentSessions = ({
  fromSession,
  speedUp,
  speedDown,
  sessions,
  handleEndReached,
  onReconnectPress, loading,
}) => {
  const renderItem = ({ item }) => (
    <SessionCard
      flag={item?.flag_url}
      country={item?.country}
      city={item?.city}
      fromSession={fromSession}
      speedDown={speedDown}
      speedUp={speedUp}
      startAt={item?.start_at}
      statusAt={item?.status_at}
      onReconnectPress={() => {
        onReconnectPress(item);
      }}
    />
  );
  const renderEmptyComponent = () => (
    <View style={{ flex: 1, marginTop: 30, justifyContent: 'center',  }}>
      <Text
        allowFontScaling={false}
        style={[
          {
            color: ThemeManager.colors.blackWhiteText,
            fontFamily: Fonts.dmMedium,
            fontSize: 15,
            paddingHorizontal: 8,
            alignSelf: 'center',
          },
        ]}>
        {loading ? '' : 'No session found'}
      </Text>
    </View>
  );
  console.log('sessions===>', sessions)
  return (
    <FlatList
      data={sessions}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmptyComponent}
      onEndReached={() => {
        handleEndReached()
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(10),
    flex:1
  },
});

export default RecentSessions;
