import { Dimensions, StyleSheet } from "react-native";
import { dimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";
import fonts from "../../../theme/Fonts";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
    flatList: {
        flex: 1,
        paddingHorizontal: widthDimen(24),
    },
    contentContainer: {
        paddingBottom: dimen(40),
    },
    headerContainer: {
        paddingVertical: dimen(20),
    },
    mainTitle: {
        fontSize: dimen(27),
        fontFamily: fonts.dmSemiBold ,
        textAlign: 'left',
        marginBottom: dimen(12),
    },
    subtitle: {
        fontSize: dimen(14),
        fontFamily: fonts.dmRegular ,
        textAlign: 'left',
        // lineHeight: dimen(22),
    },
    footerContainer: {
        paddingTop: dimen(50),
        paddingBottom: dimen(20),
    },
    buyButton: {
        marginBottom: dimen(20),
    },
    footerText: {
        fontSize: dimen(16),
        fontFamily: fonts.dmRegular 
    },
    emptyContainer: {
        marginTop: Dimensions.get('window').height / 2.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: dimen(16),
        fontFamily: fonts.dmMedium,
        textAlign: 'center',
    },
});
