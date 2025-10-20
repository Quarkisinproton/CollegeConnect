package com.collegeconnect.controllers;

import com.collegeconnect.dto.UserDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.CompletableFuture;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private Firestore firestore;

    @Test
    public void upsertUser_validPayload_returns200() throws Exception {
        DocumentReference mockRef = Mockito.mock(DocumentReference.class);
        ApiFuture<com.google.cloud.firestore.WriteResult> fakeFuture = CompletableFuture.completedFuture(null);
        when(firestore.collection("users").document(Mockito.anyString()).set(Mockito.any(), Mockito.any())).thenReturn(fakeFuture);

        String body = "{\"uid\":\"uid-123\",\"displayName\":\"Alice\",\"role\":\"student\"}";

        mockMvc.perform(put("/api/users/uid-123").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
    }
}
