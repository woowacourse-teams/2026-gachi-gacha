import { NativeModule, requireNativeModule } from 'expo';

declare class GachiKakaoMapModule extends NativeModule<{}> {}

export default requireNativeModule<GachiKakaoMapModule>('GachiKakaoMap');
