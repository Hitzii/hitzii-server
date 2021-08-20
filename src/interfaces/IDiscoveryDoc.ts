export interface IGoogleDiscoveryDoc {
    issuer:                                string
    authorization_endpoint:                string
    device_authorization_endpoint:         string
    token_endpoint:                        string
    userinfo_endpoint:                     string
    revocation_endpoint:                   string
    jwks_uri:                              string
    response_types_supported:              string[]
    subject_types_supported:               string[]
    id_token_signing_alg_values_supported: string[]
    scopes_supported:                      string[]
    token_endpoint_auth_methods_supported: string[]
    claims_supported:                      string[]
    code_challenge_methods_supported:      string[]
    grant_types_supported:                 string[]
}

export interface IFacebookDiscoveryDoc {
    issuer:                                string;
    authorization_endpoint:                string;
    jwks_uri:                              string;
    response_types_supported:              string[];
    subject_types_supported:               string[];
    id_token_signing_alg_values_supported: string[];
    claims_supported:                      string[];
}