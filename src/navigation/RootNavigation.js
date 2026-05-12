
import { createNavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

class ActionsClass {
  get currentScene() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute()?.name;
    }
    return null;
  }

  push(scene, params) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(scene, params);
    }
  }

  pop() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }

  popTo(scene) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(scene);
    }
  }

  reset(scene) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: scene }],
        })
      );
    }
  }

  jump(scene, params) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(scene, params);
    }
  }

  replace(scene, params) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(scene, params));
    }
  }
}

const actionsInstance = new ActionsClass();

export const Actions = new Proxy(actionsInstance, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    // If a property like Actions.WalletMain({ type: 'reset' }) is called:
    return (params = {}) => {
      if (navigationRef.isReady()) {
        const type = params.type;
        if (type === 'reset' || type === ActionConst.RESET) {
          actionsInstance.reset(prop);
        } else if (type === 'replace' || type === ActionConst.REPLACE) {
          navigationRef.dispatch(StackActions.replace(prop, params));
        } else {
          navigationRef.navigate(prop, params);
        }
      }
    };
  }
});

// Polyfill for ActionConst
export const ActionConst = {
  RESET: 'reset',
  PUSH: 'push',
  POP: 'pop',
  POP_TO: 'popTo',
  REPLACE: 'replace',
  JUMP: 'jump',
};
