package com.stableflow.app.data.model;

import java.io.Serializable;

/**
 * User Model
 * Represents an employee user in StableFlow
 */
public class User implements Serializable {

    private String uid;
    private String email;
    private String displayName;
    private String photoUrl;
    private double balance;
    private String walletAddress;
    private String department;
    private String position;
    private String createdAt;
    private String lastLoginAt;
    private boolean isVerified;
    private String accountType;

    // Default constructor for Firebase
    public User() {
    }

    // Constructor with required fields
    public User(String uid, String email) {
        this.uid = uid;
        this.email = email;
        this.balance = 0.0;
        this.isVerified = false;
        this.accountType = "PERSONAL";
        this.createdAt = java.time.Instant.now().toString();
    }

    // Getters and Setters
    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public double getBalance() {
        return balance;
    }

    public void setBalance(double balance) {
        this.balance = balance;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(String lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    // Helper methods
    public String getInitials() {
        if (displayName != null && !displayName.isEmpty()) {
            String[] parts = displayName.split(" ");
            if (parts.length >= 2) {
                return parts[0].substring(0, 1).toUpperCase() + parts[1].substring(0, 1).toUpperCase();
            }
            return displayName.substring(0, 1).toUpperCase();
        }
        if (email != null && !email.isEmpty()) {
            return email.substring(0, 1).toUpperCase();
        }
        return "?";
    }

    public boolean hasWallet() {
        return walletAddress != null && !walletAddress.isEmpty();
    }

    public String getShortWalletAddress() {
        if (walletAddress == null || walletAddress.length() < 10) {
            return walletAddress;
        }
        return walletAddress.substring(0, 6) + "..." +
                walletAddress.substring(walletAddress.length() - 4);
    }

    public String getFormattedWalletAddress() {
        return getShortWalletAddress();
    }
}
