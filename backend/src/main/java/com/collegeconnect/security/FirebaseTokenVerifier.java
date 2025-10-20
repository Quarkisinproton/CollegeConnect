package com.collegeconnect.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Component;

@Component
public class FirebaseTokenVerifier {

    public FirebaseToken verify(String bearerToken) throws FirebaseAuthException {
        if (bearerToken == null) return null;
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        return FirebaseAuth.getInstance().verifyIdToken(token);
    }
}
