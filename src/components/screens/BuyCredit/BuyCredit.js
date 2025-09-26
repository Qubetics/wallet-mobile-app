import React, {useState, useEffect, useCallback} from 'react';
import {FlatList, ImageBackground, StyleSheet, Text, View} from 'react-native';
import {Actions} from 'react-native-router-flux';
import {EventRegister} from 'react-native-event-listeners';
import styles from './BuyCreditStyle';
import {ThemeManager} from '../../../../ThemeManager';
import {LanguageManager} from '../../../../LanguageManager';
import {AppAlert, Button, DvpnLoader, HeaderMain} from '../../common';
import CreditScoreCard from '../../common/CreditScoreCard';
import {getPlans} from '../../Api/VPN/api/getPlans';
import {Fonts} from '../../../theme';
import * as Constants from '../../../Constants';
import {dimen, widthDimen} from '../../../Utils';
import {
  consoleLogFunc,
  getData,
  getEncryptedData,
} from '../../../Utils/MethodsUtils';
import {handlePurchase} from '../../Api/VPN/api/startSubscriptionOnChain';
import {verifyPlan} from '../../Api/VPN/api/verifyPlan';
import {getBalance} from '../../Api/VPN/api/startSubscriptionOnChain';

const BuyCredit = ({defaultWallet, userSubscription}) => {
  const {vpn, help} = LanguageManager;
  const {colors, ImageIcons} = ThemeManager;
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [balance, setBalance] = useState();

  useEffect(() => {
    consoleLogFunc('askdklasdkasdas', userSubscription);
    loadBalance();
    fetchPlans();
    const sub = EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    return () => EventRegister.removeEventListener(sub);
  }, [fetchPlans]);

  // Fetch Plans
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlans({limit: 10, page: 1});
      consoleLogFunc('Fetched Plans:::::::', JSON.stringify(res?.data));
      setLoading(false);
      if (Array.isArray(res?.data)) {
        setPlans(res.data);
      } else if (res?.data) {
        setPlans([res.data]);
      } else {
        setPlans([]);
      }
    } catch (error) {
      setLoading(false);
      consoleLogFunc('Error fetching plans:', error);
      setPlans([]);
    }
  }, []);

  const loadBalance = async addressParam => {
    const address = await getData(Constants.COSMOS_ADDRESS);
    console.log('✅ Fetching balance for:', address);
    if (!address) {
      console.warn('🚫 Cannot load balance: address is undefined');
      return;
    }

    try {
      let balance = await getBalance({
        denom: 'tics',
        address: address,
        rcp: Constants.COSMO_RPC_URL,
      });
      console.log('✅ Balance fetched:', balance);
      setBalance(balance);
    } catch (e) {
      console.log('❌ VPN status check failed', e);
    }
  };

  // Handle Purchase
  const Purchase = async plan => {
    consoleLogFunc('Purchase balance', balance);
    if (parseFloat(balance) <= 0) {
      setAlertText('Please top-up your account.');
      setAlertModal(true);
      return;
    }

    try {
      const mnemonics = await getMnemonics();
      setLoading(true);
      const {subscriptionId, txHash} = await handlePurchase({
        mnemonic: mnemonics?.toLowerCase()?.trim(),
        rpc: Constants.COSMO_RPC_URL,
        id: plan?.planId,
      });

      if (subscriptionId) {
        console.log('✅ Subscription started:', subscriptionId, txHash);
        const response = await verifyPlan(plan?.planId, txHash);
        console.log('✅ verifyPlan response:', response);
        if (response?.status === 200) {
            setLoading(false);
          setAlertText('Plan purchased successfully!');
          setAlertModal(true);
        } else {
          setAlertText('Failed to verify plan, please try again');
          setAlertModal(true);
        }
      } else {
        setAlertText('Failed to purchase plan, try in sometime');
        setAlertModal(true);
      }
    } catch (err) {
      console.error('❌ Purchase error:', err);
      setLoading(false);
      setAlertText('Failed to start subscription');
      setAlertModal(true);
    }
  };
  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Actions.EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
        walletPin: async pin => {
          setLoading(true);
          try {
            const mnemonics = await getEncryptedData(
              defaultWallet?.loginRequest?.wallet_address,
              pin,
            );
            resolve(mnemonics);
          } catch (error) {
            reject(error);
          }
        },
      });
    });
  };

  const formatTics = (amount, decimals = 18) => {
    const padded = amount.toString().padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
  };

  return (
    <ImageBackground
      source={ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: colors.mainBgNew}}>
      <View style={styles.mainView}>
        <HeaderMain BackButtonText={'Account Top-Up'} />
        {plans?.length > 0 ? (
          <View style={localStyles.contentWrapper}>
            {/* Top Section */}
            <View>
              <View style={localStyles.headerSection}>
                <Text
                  style={[localStyles.title, {color: colors.blackWhiteText}]}>
                  Available Plans
                </Text>
                <Text
                  style={[
                    localStyles.subtitle,
                    {color: colors.legalGreyColor},
                  ]}>
                  Subscribe plan and spend them on fast, secure & decentralized VPN service within Qubetics Blockchain.
                </Text>
              </View>

              <FlatList
                style={{paddingHorizontal: widthDimen(24), marginTop: 20}}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                data={plans}
                numColumns={2}
                contentContainerStyle={{paddingBottom: dimen(20)}}
                ItemSeparatorComponent={() => (
                  <View style={{height: widthDimen(14)}} />
                )}
                keyExtractor={(item, index) =>
                  item?.planId?.toString() || index.toString()
                }
                renderItem={({item, index}) => {
                  const isSelected =
                    userSubscription?.length > 0
                      ? userSubscription[0]?.plan_id == item?.planId
                      : selectedPlan?.planId == item?.planId;
                  return (
                    <CreditScoreCard
                      index={index}
                      item={item}
                      isSelected={isSelected}
                      onPressBtn={() => setSelectedPlan(item)}
                    />
                  );
                }}
              />
            </View>

            {/* Footer Section */}
            {userSubscription?.length <= 0 && (
              <View style={localStyles.footer}>
                <Button
                  buttontext={vpn.Purchase}
                  myStyle={styles.button}
                  onPress={() => {
                    if (selectedPlan) {
                      Purchase(selectedPlan);
                    } else {
                      setAlertText(
                        'Please select a plan before proceeding to purchase.',
                      );
                      setAlertModal(true);
                    }
                  }}
                />

                <Text
                  style={[
                    localStyles.disclaimer,
                    {color: colors.legalGreyColor},
                  ]}>
                  {selectedPlan
                    ? `You're purchasing ${
                        selectedPlan.hoursInDays
                      } days plan for ${formatTics(
                        selectedPlan?.quoteValue,
                      )} TICS.`
                    : 'Select a plan to see details.'}{' '}
                  Credits are for decentralized VPN services only. By
                  proceeding, you confirm you've read our Terms of Service and
                  Privacy Policy.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.emptyView, {flex: 1}]}>
            <Text
              style={[
                styles.txtTitle,
                {color: colors.blackWhiteText, textAlign: 'center'},
              ]}>
              {help.noPlanFound}
            </Text>
          </View>
        )}
      </View>
      {alertModal && (
        <AppAlert
          alertTxt={alertText}
          showSuccess={alertText == 'Plan purchased successfully!' ? true : false}
          hideAlertDialog={() => {
            setAlertModal(false);
            if(alertText == 'Plan purchased successfully!'){
              Actions.pop()
            }
          }}
        />
      )}
      <DvpnLoader isLoading={loading} />
    </ImageBackground>
  );
};

export default BuyCredit;

const localStyles = StyleSheet.create({
  contentWrapper: {
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 25,
  },
  headerSection: {
    paddingHorizontal: 20,
    gap: 15,
  },
  title: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 27,
  },
  subtitle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  disclaimer: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
  },
});
