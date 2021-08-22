export default {
    user: {
        signUp: 'onUserSignUp',
        signIn: 'onUserSignIn'
    },
    auth: {
        codeIssued: 'onAuthCodeIssued',
        codeRevoked: 'onAuthCodeRevoked',
        tokenRefrehed: 'onAuthTokenRefreshed'
    },
    session: {
        created: 'onSessionCreated',
        closed: 'onSessionClosed',
        allClosed: 'onAllSessionsClosed',
        refreshed: 'onSessionRefreshed'
    },
}