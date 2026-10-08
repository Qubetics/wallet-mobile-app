import { ImageBackground, StyleSheet } from 'react-native'
import { LanguageManager } from '../../../LanguageManager'
import { ThemeManager } from '../../../ThemeManager'
import { heightDimen, widthDimen } from '../../Utils'
import CommonRow from './CommonRow'

const CardItem = ({contactAddress,ownerAddress,tokenID,tokenStandard,Quantity}) => {
  return (
    <ImageBackground source={ThemeManager.ImageIcons.homeSubBg} style={[styles.ViewStyle1,]}>
    <CommonRow label={LanguageManager.nftData.contractAddress} value={contactAddress} />
    <CommonRow label={LanguageManager.nftData.ownerAddress} value={ownerAddress} />
    <CommonRow label={LanguageManager.nftData.tokenID} value={tokenID} />
    <CommonRow label={LanguageManager.nftData.tokenStandard} value={tokenStandard} />
    <CommonRow label={LanguageManager.nftData.Quantity} value={Quantity} />
</ImageBackground>
  )
}

export default CardItem

const styles = StyleSheet.create({
    ViewStyle1:{
        width:widthDimen(382),
        alignSelf:"center",
        borderRadius:14,
        marginTop:heightDimen(20)
      },
    
})