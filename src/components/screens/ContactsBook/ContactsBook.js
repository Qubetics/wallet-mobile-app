import { BlurView } from '@react-native-community/blur';
import React, { Component } from 'react';
import { Animated, BackHandler, FlatList, Image, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { deleteAddressBookId, getAddressBook } from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Images } from '../../../theme/';
import { getDimensionPercentage } from '../../../Utils';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import {
  AddressItem,
  InputtextSearch
} from '../../common';
import styles from './ContactsBookkStyle';


class ContactsBook extends Component {
  constructor(props) {
    super(props);
    this.slideAnim = new Animated.Value(500);
    this.overlayAnim = new Animated.Value(0);
    this.contentOpacity = new Animated.Value(0);
    this.state = {
      id: '',
      isLoading: false,
      addressBook: [],
      alertTxt: '',
      showAlertDialog: false,
      walletAddress: '',
      walletName: '',
      coin_family: ' ',
      myWalletList: [],
      alertTxtConfirm: '',
      showAlertDialogConfirm: false,
      rowMap: null,
      rowKey: null,
      selectedIndex: undefined,
      selected_Index: undefined,
      showView: false,
      limit: 10,
      page: 1,
      screen: '',
      totalrecord: 0,
      loadList: false,
      deleteId: 0,
      search: '',
      showContactlModal: false,
      selectedItem: '',
      coin_family_list: [],
      addressList: [],
      fromSearch: false,
    };
  }



  componentDidMount() {
    // BackHandler.addEventListener("hardwareBackPress",this.handleBackButtonClick);

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showContactlModal: false,
        showAlertDialogConfirm: false,
        alertTxtConfirm: '',
        showAlertDialog: false,
        alertTxt: '',
      });
    });
    this.setState({
      page: 1,
      showView: false,
      addressList: [Singleton.getInstance().defaultEthAddress],
      coin_family_list: [this.props.coin_family],

    });
    this.getaddressBookList();
    this.focusListener = this.props.navigation.addListener('focus', () => {      
      this.setState({
        page: 1,
        showView: false,
        addressList: [Singleton.getInstance().defaultEthAddress],
        coin_family_list: [this.props.coin_family],
      });
      this.getaddressBookList();
      BackHandler.addEventListener("hardwareBackPress", this.handleBackButtonClick);
    });
  }

  startSlideAnimation = () => {
    this.slideAnim.setValue(500);
    this.overlayAnim.setValue(0);
    this.contentOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(this.overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(this.contentOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(this.slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  };

  componentWillUnmount() {
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
  }

  handleBackButtonClick() {
    consoleLogFunc("backhandler>>>>>>");
    Actions.pop()

    return true;
  };


  /******************************************************************************************/
  getaddressBookList() {
    getData(Constants.ADDRESS_LIST).then(addrs_list => {
      consoleLogFunc('ajhsjahsajsh', addrs_list)
      const addressListKeys = JSON.parse(addrs_list);
      const data = {
        address: addressListKeys || this.state.addressList,
        coin_family: this.state.coin_family_list,
        limit: this.state.limit,
        page: 1,
        search: this.state.search,
      };
      this.hitApi(data, false);
    });
  }

  /******************************************************************************************/
  hitApi(data, fromPagination = false) {
    this.setState({ isLoading: true });
    this.props.getAddressBook({ data }).then(res => {
      consoleLogFunc('res=======', res);
      if (res.data.length > 0) {
        this.setState({
          isLoading: false,
          addressBook: fromPagination ? this.state.addressBook.concat(res.data) : res.data,
          totalrecord: res.meta.total,
          loadList: true,
        });
      } else {
        this.setState({
          isLoading: false,
          addressBook: fromPagination ? this.state.addressBook : [],
        });
      }
    })
      .catch(err => {
        this.setState({ showAlertDialog: true, alertTxt: err, isLoading: false });
      });
  }

  /******************************************************************************************/
  onLoadEnd = () => {
    if (this.state.loadList) {
      const page = this.state.page + 1;
      this.setState({ page: page, loadList: false }, () => {
        if (this.state.addressBook.length != this.state.totalrecord) {
          const data = {
            address: this.state.addressList,
            coin_family: this.state.coin_family_list,
            limit: this.state.limit,
            page: this.state.page,
            search: this.state.search,
          };
          this.hitApi(data, true);
        } else {
          consoleLogFunc('here::::', 11);
        }
      });
    }
  };

  /******************************************************************************************/
  maskAddress(address) {
    const a = address.slice(0, 8);
    const b = address.slice(-4);
    return a + '...' + b;
  }

  /******************************************************************************************/

  /******************************************************************************************/
  deleteItem = item => {
    this.setState({
      showAlertDialogConfirm: true,
      alertTxtConfirm: LanguageManager.alertMessages.doYouWantToDeleteContact,
      deleteId: item.id,
    });
  };

  /******************************************************************************************/
  callDeleteApi() {
    this.setState({ isLoading: true });
    const delId = this.state.deleteId;
    this.props.deleteAddressBookId(delId).then(res => {
      this.setState({ isLoading: false });
      consoleLogFunc('delete succes==>', res);
      this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.contactDeletedSuccessfully,
      });
      this.getaddressBookList();
    })
      .catch(err => {
        this.setState({ showAlertDialog: true, alertTxt: err, isLoading: false });
      });
  }

  /******************************************************************************************/
  updateSearch() {
    if (this.timer != undefined) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.getaddressBookList();
    }, 1000);
  }

  /******************************************************************************************/
  iconPressed() {
    Actions.currentScene != 'AddContact' && Actions.AddContact({ themeSelected: this.props.themeSelected, isFrom: this.props.symbol });
  }

  /******************************************************************************************/
  onPressBin() {
    this.setState({
      showAlertDialogConfirm: true,
      alertTxtConfirm: LanguageManager.alertMessages.doYouWantToDeleteTheContact,
    });
  }

  /******************************************************************************************/
  onPressDrop(index) {
    this.setState({ selectedIndex: index });
    if (this.state.selectedIndex != index) {
      this.setState({ showView: true });
    } else {
      if (this.state.showView == false) {
        this.setState({ showView: true });
        return;
      } else {
        this.setState({ showView: false });
        return;
      }
    }
  }

  /******************************************************************************************/
  // onPressView(item) {
  //   this.setState({showContactlModal: true, selectedItem: item });
  //   consoleLogFunc('here');
  // }

  /******************************************************************************************/
  onPressItem(item, index) {
    this.setState({ selected_Index: index });
    setTimeout(() => {
      this.setState({ showContactlModal: false });
      this.props?.getAddress(item?.wallet_address);
      Actions.currentScene == 'ContactsBook' && Actions.pop();
    }, 800);
  }

  /******************************************************************************************/
  render() {
    const { placeholderAndLabels, addressBook } = LanguageManager;
    return (

      <Modal
        statusBarTranslucent
        animationType="none"
        transparent={true}
        visible={this.props.showAddressBookModal}
        onShow={this.startSlideAnimation}
      >

        <SafeAreaView style={{ backgroundColor: 'transparent' }} />

        <Animated.View style={[styles.blurView, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: this.overlayAnim }]} />
        <BlurView
          style={styles.blurView}
          blurType="dark"
          blurAmount={4}
          reducedTransparencyFallbackColor="transparent"
        />

        <TouchableOpacity style={{ flex: 1, backgroundColor: "transparent" }} onPress={this.props.handleBack} />

        <Animated.View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: ThemeManager.colors.mainBgNew,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          transform: [{ translateY: this.slideAnim }],
          opacity: this.contentOpacity,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            },
            android: {
              elevation: 5,
            },
          }),
        }}>

          <>
            <View style={{ flexDirection: "row", marginTop: getDimensionPercentage(36), justifyContent: "space-between", marginHorizontal: 24 }}>
              <Text style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>
                Address Book
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{ marginRight: 15 }}
                  onPress={this.props.addbook}>
                  <Image source={Images.add} style={{ tintColor: ThemeManager.colors.blackWhiteText, width: 20, height: 20 }} />

                </TouchableOpacity>
                <TouchableOpacity onPress={()=>{
                        // this.setState({search:''}),
                        this.setState({ search: '' }, () => this.getaddressBookList())
                        this.props.handleBack()
                }}>
                  <Image source={ThemeManager.ImageIcons.crossIconNew} style={{ resizeMode: "contain" }} />

                </TouchableOpacity>
              </View>


            </View>

            <InputtextSearch
              placeholder={placeholderAndLabels.searchuser}
              value={this.state.search}
              search={!this.state.search ? true : false}
              pressClear={() => this.setState({ search: '' }, () => this.getaddressBookList())}
              onChangeNumber={text => {
                this.setState({ search: text, fromSearch: true }, () => this.updateSearch(text));
              }}
            />
            {/* {this.props?.ispop != true && this.state.addressBook.length > 0 && (<Text allowFontScaling={false} style={[styles.txtTitle, { color: ThemeManager.colors.newTitle }]}>{addressBook.saved}</Text>)} */}

            {/* /******************************************************************************************/}

            <FlatList
              bounces={false}
              showsVerticalScrollIndicator={false}
              data={this.state.addressBook}
              onEndReached={() => { this.onLoadEnd() }}
              onEndReachedThreshold={0.01}
              renderItem={({ item, index }) => {
                return (
                  <View key={index + ''} style={{ marginBottom: index == this.state.addressBook.length - 1 ? 30 : 0, }}>
                    <AddressItem
                      onPressView={() => this.props.onPressView(item)}
                      fromContact={true}
                      screen={this.state.screen}
                      item={item}
                      onPress={() => this.onPressDrop(index)}
                      selectedIndex={this.state.selectedIndex}
                      index={index}
                      showView={this.state.showView}
                      onPressBin={data => { this.deleteItem(data) }}
                    />
                  </View>
                );
              }}
              keyExtractor={(item, index) => index + ''}
              ListEmptyComponent={() => {
                return (
                  <View style={styles.emptyView}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <Image source={ThemeManager.ImageIcons.noContact} />
                      <Text style={[styles.textStyle, {
                        color: ThemeManager.colors.blackWhiteText, marginTop: 15,
                        fontSize: 18,
                        lineHeight: 22,

                      }]}>
                        No records found
                      </Text>
                    </View>

                  </View>
                );
              }}
            />

          </>
        </Animated.View>



      </Modal>

    );
  }
}
export default connect(null, { getAddressBook, deleteAddressBookId })(ContactsBook);
