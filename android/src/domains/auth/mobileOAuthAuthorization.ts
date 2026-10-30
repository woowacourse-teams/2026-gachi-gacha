export function buildMobileOAuthAuthorizationUrl(input: {
  authorizationEndpoint: string;
  callbackUrl: string;
  challenge: string;
  clientId: string;
  nonce: string;
  scope: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
    nonce: input.nonce,
    redirect_uri: input.callbackUrl,
    response_type: 'code',
    scope: input.scope,
    state: input.nonce,
  });

  return `${input.authorizationEndpoint}?${params.toString()}`;
}
