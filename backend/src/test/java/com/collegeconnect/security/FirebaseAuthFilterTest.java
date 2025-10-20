package com.collegeconnect.security;

import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.http.HttpStatus;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest
public class FirebaseAuthFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FirebaseTokenVerifier tokenVerifier;

    @Test
    public void requestsWithoutAuth_shouldReturn401() throws Exception {
        when(tokenVerifier.verify(null)).thenReturn(null);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/events"))
                .andExpect(status().isUnauthorized());
    }
}
