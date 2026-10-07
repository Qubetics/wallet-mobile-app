import {useEffect} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

function KeyBoardAwareComp(props) {
  /******************************************************************************************/
  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1,}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled">
          {props.children}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

export {KeyBoardAwareComp};
