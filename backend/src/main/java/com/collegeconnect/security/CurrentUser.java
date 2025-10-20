package com.collegeconnect.security;

import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private String uid;

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }
}
