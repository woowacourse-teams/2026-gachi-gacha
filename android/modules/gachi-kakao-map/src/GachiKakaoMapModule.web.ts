import { registerWebModule, NativeModule } from 'expo';

// GachiKakaoMapModule is not available on the web platform.
class GachiKakaoMapModule extends NativeModule<{}> {}

export default registerWebModule(GachiKakaoMapModule, 'GachiKakaoMapModule');
