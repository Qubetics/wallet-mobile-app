import { View } from 'react-native'
import { useState } from 'react'
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { consoleLogFunc } from '../../Utils/MethodsUtils';

const QRCodeScannerNew = (props) => {
    const [isShowBlankView, setShowBlankView] = useState(false)
    const device = useCameraDevice('back');

    // useEffect(() => {
    //     setTimeout(() => {
    //         setShowBlankView(false)
    //     }, 150)
    // }, [])

    const codeScanner = useCodeScanner({
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: codes => {
            const validCode = codes?.find(code => code.value);
            if (validCode) {
                props.onRead({data: validCode.value});
                setTimeout(() => {
                    setShowBlankView(true)
                }, 150)
            } else {
                consoleLogFunc("validCode:::::");
            }
        },
    });

    return (
        <View style={{ flex: 0.95, justifyContent: "center", alignItems: "center" }}>
            {(!!device && !isShowBlankView) &&
                <Camera
                    style={{ width: '100%', height: '100%', marginTop: 20 }}
                    device={device}
                    isActive={true}
                    codeScanner={codeScanner}
                    onError={(error) => {
                        props.onRead({data: ""});
                    }}
                />
            }
        </View>

    )
}

export { QRCodeScannerNew }