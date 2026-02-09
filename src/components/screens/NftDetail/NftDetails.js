import React, {Component} from 'react';
import {View, Text, ImageBackground, ScrollView, Image} from 'react-native';
import {Button, HeaderMain} from '../../common';
import {ThemeManager} from '../../../../ThemeManager';
import {LanguageManager} from '../../../../LanguageManager';
import images from '../../../theme/Images';
import styles from './NftDetailStyle';
import CardItem from '../../common/CardItem';
import NftDetailView from '../../common/NftDetailView';
import {Actions} from 'react-native-router-flux';
import {maskAddress} from '../../../Utils/MethodsUtils';
import {SvgUri} from 'react-native-svg';
import Singleton from '../../../Singleton';
import FastImage from 'react-native-fast-image';

class NftDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
    };
  }

  handleSendNft = () => {
    if (Actions.currentScene !== 'SendNft') {
      Actions.SendNft({nftData: this.props.nftData});
    }
  };

  render() {
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
        <HeaderMain
          BackButtonText={LanguageManager.manageWallet.manageWallet}
        />
        <ScrollView style={{flex: 1}}>
          {this.props.nftData?.image?.includes('.svg') ? (
            <SvgUri style={styles.mainImg} uri={this.props.nftData?.image} />
          ) : this.props.nftData?.image != null ? (
            <FastImage
              source={{uri: this.props.nftData?.image}}
              resizeMode={FastImage.resizeMode.cover}
              style={styles.mainImg}
            />
          ) : (
            <Image
              source={images.nftPlaceholder}
              style={styles.mainImg}
              resizeMode="contain"
            />
          )}
          <Text
            style={[
              styles.description,
              {color: ThemeManager.colors.legalGreyColor},
            ]}>
            {this.props.nftData?.description || this.props.nftData?.name}
          </Text>

          {/* <NftDetailView
                        Country={'USA'}
                        ArchitecturalStyle={'Neon'}
                        Years={'600 CE'}
                    /> */}

          <CardItem
            contactAddress={maskAddress(
              this.props.nftData?.token_address || '',
              7,
            )}
            ownerAddress={maskAddress(
              this.props.nftData?.owner_of ||
                Singleton.getInstance().defaultEthAddress,
              7,
            )}
            tokenID={'#' + this.props.nftData?.token_id}
            tokenStandard={this.props.nftData?.token_type}
            Quantity={this.props.nftData?.amount}
            network={
              this.props.nftData?.coin_family == 2 ? 'Ethereum' : 'Qubetics'
            }
          />
        </ScrollView>
        <View style={styles.btnView}>
          <Button
            onPress={this.handleSendNft}
            customStyle={{marginTop: 20}}
            buttontext={LanguageManager.walletMain.send}
          />
        </View>
      </ImageBackground>
    );
  }
}

export default NftDetails;
