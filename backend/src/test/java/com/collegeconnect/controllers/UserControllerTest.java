package com.collegeconnect.controllers;

import com.collegeconnect.dto.UserDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.junit.jupiter.api.Test;
import com.google.firebase.auth.FirebaseToken;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.WriteResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private Firestore firestore;

    @MockBean
    private com.collegeconnect.security.FirebaseTokenVerifier tokenVerifier;

    @MockBean
    private com.collegeconnect.security.CurrentUser currentUser;

    @org.springframework.boot.test.context.TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        @org.springframework.web.context.annotation.RequestScope
        public com.collegeconnect.security.CurrentUser currentUser() {
            return new com.collegeconnect.security.CurrentUser();
        }
    }

    @Test
    public void upsertUser_validPayload_returns200() throws Exception {
    // Mock token verification to allow the request through
    when(tokenVerifier.verify(Mockito.anyString())).thenReturn(Mockito.mock(FirebaseToken.class));

    DocumentReference mockRef = Mockito.mock(DocumentReference.class);
        com.google.cloud.firestore.CollectionReference mockCollection = Mockito.mock(com.google.cloud.firestore.CollectionReference.class);
    WriteResult mockWriteResult = Mockito.mock(WriteResult.class);
    ApiFuture<com.google.cloud.firestore.WriteResult> fakeFuture = ApiFutures.immediateFuture(mockWriteResult);
    when(firestore.collection("users")).thenReturn(mockCollection);
    when(mockCollection.document(Mockito.anyString())).thenReturn(mockRef);
    when(mockRef.set(Mockito.any(), Mockito.any())).thenReturn(fakeFuture);
    when(mockRef.getId()).thenReturn("uid-123");

        String body = "{\"uid\":\"uid-123\",\"displayName\":\"Alice\",\"role\":\"student\"}";

    mockMvc.perform(put("/api/users/uid-123").contentType(MediaType.APPLICATION_JSON).content(body)
        .header("Authorization", "Bearer dummy-token"))
        .andExpect(status().isOk());
    }
}
