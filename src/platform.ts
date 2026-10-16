import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const shouldRegisterServiceWorker = (production:boolean) => production && !isNativeApp();
