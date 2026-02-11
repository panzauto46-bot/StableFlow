package com.stableflow.app.data.model;

import java.io.Serializable;

/**
 * ExpenseRequest Model
 * Represents an expense claim submitted by an employee
 */
public class ExpenseRequest implements Serializable {

    private String id;
    private String userId;
    private String title;
    private String description;
    private double amount;
    private String currency;
    private String category;
    private String status;
    private String receiptUrl;
    private String submittedAt;
    private String processedAt;
    private String approvedBy;
    private String rejectionReason;
    private String notes;
    private String txSignature;
    private String txExplorerUrl;
    private String paidAt;
    private String payerAddress;
    private Double latitude;
    private Double longitude;
    private String locationAddress;

    // Default constructor for Firebase
    public ExpenseRequest() {
    }

    // Constructor with required fields
    public ExpenseRequest(String userId, String title, String description,
            double amount, String category) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.currency = "USDC";
        this.category = category;
        this.status = "PENDING";
        this.submittedAt = java.time.Instant.now().toString();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReceiptUrl() {
        return receiptUrl;
    }

    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }

    public String getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(String processedAt) {
        this.processedAt = processedAt;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTxSignature() {
        return txSignature;
    }

    public void setTxSignature(String txSignature) {
        this.txSignature = txSignature;
    }

    public String getTxExplorerUrl() {
        return txExplorerUrl;
    }

    public void setTxExplorerUrl(String txExplorerUrl) {
        this.txExplorerUrl = txExplorerUrl;
    }

    public String getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(String paidAt) {
        this.paidAt = paidAt;
    }

    public String getPayerAddress() {
        return payerAddress;
    }

    public void setPayerAddress(String payerAddress) {
        this.payerAddress = payerAddress;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }

    // Helper methods
    public boolean isPending() {
        return "PENDING".equals(status) || "UNDER_REVIEW".equals(status);
    }

    public boolean isApproved() {
        return "APPROVED".equals(status);
    }

    public boolean isPaid() {
        return "PAID".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    public String getStatusLabel() {
        switch (status) {
            case "PENDING":
                return "Menunggu";
            case "UNDER_REVIEW":
                return "Dalam Review";
            case "APPROVED":
                return "Disetujui";
            case "REJECTED":
                return "Ditolak";
            case "PAID":
                return "Dibayar";
            case "CANCELLED":
                return "Dibatalkan";
            default:
                return status;
        }
    }

    public String getCategoryLabel() {
        switch (category) {
            case "TRAVEL":
                return "Perjalanan Dinas";
            case "MEALS":
                return "Makan & Minum";
            case "SUPPLIES":
                return "Perlengkapan Kantor";
            case "EQUIPMENT":
                return "Peralatan";
            case "SOFTWARE":
                return "Software & Lisensi";
            case "TRAINING":
                return "Pelatihan";
            case "ENTERTAINMENT":
                return "Hiburan Klien";
            case "UTILITIES":
                return "Utilitas";
            case "OTHER":
                return "Lainnya";
            default:
                return category;
        }
    }
}
