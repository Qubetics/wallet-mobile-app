import React from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import images from '../../theme/Images';
import { heightDimen, widthDimen } from '../../Utils';
import SessionCard from './SessionCard';
import { WalletMain } from '../screens';
import { ThemeManager } from '../../../ThemeManager';
import fonts from '../../theme/Fonts';

const RecentSessions = ({
  fromSession,
  speedUp,
  speedDown,
  sessions,
  handleEndReached,
  onReconnectPress,
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
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 18,
          fontFamily: fonts.dmMedium,
          color: ThemeManager.colors.subTextColor,
        }}>
        {WalletMain.Noasset}
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
  },
});

export default RecentSessions;
