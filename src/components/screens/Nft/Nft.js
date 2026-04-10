import React, {useState, useEffect} from 'react';
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import {ThemeManager} from '../../../../ThemeManager';
import {Button, HeaderMain, LoaderView} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {Fonts, Images} from '../../../theme';
import styles from './Nftstyle';
import {dimen, hasNotchWithIOS} from '../../../Utils';
import {Actions} from 'react-native-router-flux';
import Singleton from '../../../Singleton';
import {getNFtList} from '../../../Redux/Actions';
import {useDispatch} from 'react-redux';
import {SvgUri} from 'react-native-svg';
import {consoleLogFunc} from '../../../Utils/MethodsUtils';
import images from '../../../theme/Images';
import FastImage from 'react-native-fast-image';

const Nft = () => {
  const dispatch = useDispatch();
  const [isNotification, setIsNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nftList, setNFTList] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const data = {
      limit: 50,
      address_list: [
        {
          coin_symbol: 'eth',
          wallet_address: Singleton.getInstance().defaultEthAddress,
          coin_family: 2,
        },
        {
          coin_symbol: 'tics',
          wallet_address: Singleton.getInstance().defaultEthAddress,
          coin_family: 7,
        },
      ],
    };

    dispatch(getNFtList(data))
      .then(res => {
        consoleLogFunc('NFT>>>>>', JSON.stringify(res));
        setNFTList([...res?.data]);
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
        consoleLogFunc(error);
      });
  }, []);

  const notiPressed = () => {
    Singleton.isNotification = false;
    setIsNotification(false);
    if (Actions.currentScene !== 'NotificationsTab') {
      Actions.NotificationsTab();
    }
  };

  const renderItem = ({item}) => (
    <View style={{width: '50%',}}>
    <TouchableOpacity
      style={{margin: 10}}
      onPress={() => {
        if (Actions.currentScene !== 'NftDetails') {
          Actions.NftDetails({nftData: item});
        }
      }}>
      {item?.image?.includes('.svg') ? (
        <SvgUri style={styles.image} uri={item.image} />
      ) : item?.image == null ? (
        <Image
          source={images.nftPlaceholder}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <FastImage
          resizeMode={FastImage.resizeMode.cover}
          source={{uri: item.image}}
          style={styles.image}
        />
      )}
      {/* {item.image?.includes(".svg") ?
                <SvgUri
                    style={styles.image}
                    uri={item.image}

                />
                : !error ?  <FastImage 
                onError={() => {
                    setError(true);
                }}
                resizeMode={FastImage.resizeMode.cover}
                // defaultSource={images.nftPlaceholder}
                source={{ uri: item.image }} style={styles.image} /> :
                <Image
                source={images.nftPlaceholder}
                style={styles.image}
                resizeMode="contain"
              />
                } */}
      <View style={styles.card}>
        <Text
          numberOfLines={1}
          ellipsizeMode='middle'
          style={[
            styles.title,
            {
              fontFamily: Fonts.dmMedium,
              color: ThemeManager.colors.blackWhiteText,
            },
          ]}>
          {item.name}
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}}>
          <Text
            style={[
              styles.nftId,
              {
                fontFamily: Fonts.dmRegular,
                color: ThemeManager.colors.blackWhiteText,
              },
            ]}>
            {item.token_id}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
  
            <Text
              style={[
                styles.price,
                {
                  fontFamily: Fonts.dmRegular,
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}>
              {item.amount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={{flex: 1}}>
        <HeaderMain
          BackButtonText={LanguageManager.nftData.Nfts}
          imgSecond={Singleton.isNotification ? Images.notiDot : Images.noti}
          imgNew={ThemeManager.ImageIcons.supportIcon}
          imgSecondStyle={styles.imgSecond}
          imgStyle1={styles.imgNew}
          onPressIcon={notiPressed}
        />
        <View style={{height: '75%', paddingHorizontal: 10,}}>
          <FlatList
            data={nftList}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            numColumns={2}
            // contentContainerStyle={styles.container}
            ListEmptyComponent={() => {
              return (
                <View
                  style={{
                    marginTop: '60%',
                    justifyContent: 'center',
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.transactionHistoryTitle,
                      {
                        color: ThemeManager.colors.blackWhiteText,
                        alignSelf: 'center',
                      },
                    ]}>
                    {isLoading ? '' : LanguageManager.nftData.noNftFound}
                  </Text>
                </View>
              );
            }}
          />
        </View>
        <View
          style={{
            marginHorizontal: 24,
            marginBottom: hasNotchWithIOS() ? dimen(52) : dimen(30),
          }}>
          <Button
            onPress={() => {
              const selectedCoin = {
                coin_family: 7,
                is_token: 1,
                coin_symbol: 'tics',
              };
              if (Actions.currentScene !== 'Receive') {
                Actions.Receive({
                  selectedCoin: selectedCoin,
                  isFromNft: true,
                });
              }
            }}
            customStyle={{marginTop: 20}}
            buttontext={LanguageManager.walletMain.receive}
          />
        </View>
      </View>
      <LoaderView isLoading={isLoading} />
    </ImageBackground>
  );
};

export default Nft;