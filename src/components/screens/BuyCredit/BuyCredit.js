import styles from "./BuyCreditStyle";
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import { ThemeManager } from "../../../../ThemeManager";
import { Button, HeaderMain } from "../../common";
import { LanguageManager } from "../../../../LanguageManager";
import { dimen, widthDimen } from "../../../Utils";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
import CreditScoreCard from "../../common/CreditScoreCard";
import { Actions } from "react-native-router-flux";
import images from "../../../theme/Images";
import CommonModal from "../../common/CommonModal";
import { Fonts } from "../../../theme";
import { EventRegister } from "react-native-event-listeners";
import { getPlans } from "../../Api/VPN/api/getPlans";
import * as Constants from "../../../Constants";
const BuyCredit = () => {
  const { vpn, help } = LanguageManager;
  const { colors, ImageIcons } = ThemeManager;
  const [modal, setModal] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {

    // setPlans(localResponse.plans);

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    // fetchPlans();
    return () => {};
  }, []);

  const fetchPlans = async () => {
    const plans = await getPlans({ limit: 10, page: 1 });
    consoleLogFunc("plans.plansplansplansplans:::::::", JSON.stringify(plans));
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain BackButtonText={vpn.buyCredit} />
        <FlatList
          style={{
            paddingHorizontal: widthDimen(24),
          }}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={plans}
          numColumns={2}
          contentContainerStyle={[{ paddingBottom: dimen(20) }]}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: widthDimen(14),
              }}
            />
          )}
          renderItem={({ item, index }) => {
            return (
              <CreditScoreCard
                disabled={true}
                index={index}
                onPressBtn={() => {
                  consoleLogFunc("onPressBtn clicked");
                  setModal(true);
                }}
              />
            );
          }}
          keyExtractor={(item) => item?.id}
          ListEmptyComponent={() => {
            return (
              <View style={styles.emptyView}>
                <Text
                  style={[
                    styles.txtTitle,
                    {
                      color: ThemeManager.colors.blackWhiteText,
                      textAlign: "center",
                    },
                  ]}
                >
                  {help.noListFound}
                </Text>
              </View>
            );
          }}
        />

        <CommonModal
          isTopLine={false}
          visible={modal}
          onClose={() => setModal(false)}
          button={true}
        >
          <TouchableOpacity onPress={() => setModal(false)}>
            <Image style={styles.cancelButton} source={images.cancel_vpn} />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.titleText,
                { color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {vpn.PurchaseSuccessful}
            </Text>

            <Text
              style={[
                styles.planText,
                { color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {vpn.creditPlan}:{" "}
              <Text
                style={{
                  color: colors.legalGreyColor,
                  fontFamily: Fonts.dmRegular,
                }}
              >
                {"Premium 1000 Credits"}
              </Text>
            </Text>

            <Text
              style={[
                styles.descriptionText,
                { color: ThemeManager.colors.legalGreyColor },
              ]}
            >
              {
                "You have successfully purchased 1000 credits for $9.99. Enjoy your premium features!"
              }
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                onPress={() => {
                  consoleLogFunc("button Pressed");
                  setModal(false);

                  setTimeout(() => {
                    Actions.AccountTopUp();
                  }, 300);
                }}
                buttontext={vpn.goToHome}
              />
            </View>
          </View>
        </CommonModal>
      </View>
    </ImageBackground>
  );
};

export default BuyCredit;
