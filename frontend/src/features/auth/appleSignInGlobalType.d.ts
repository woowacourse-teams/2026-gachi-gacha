interface AppleSignInConfiguration {
  clientId: string;
  scope: string;
  redirectURI: string;
  state: string;
  nonce: string;
  usePopup: boolean;
}

interface AppleSignInAuthorization {
  code: string;
  id_token: string;
  state: string;
}

interface AppleSignInUser {
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

interface AppleSignInResponse {
  authorization: AppleSignInAuthorization;
  user?: AppleSignInUser;
}

interface AppleIdClient {
  auth: {
    init: (configuration: AppleSignInConfiguration) => void;
    signIn: () => Promise<unknown>;
  };
}

interface Window {
  AppleID?: AppleIdClient;
}
