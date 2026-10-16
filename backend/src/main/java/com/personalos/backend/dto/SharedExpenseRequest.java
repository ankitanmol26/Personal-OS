package com.personalos.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SharedExpenseRequest {
    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Payer ID is required")
    private Long payerId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private boolean equalSplit = true;

    private String category = "Other";

    private String splitMethod = "EQUAL";

    private String note;

    @NotNull(message = "Participants are required")
    private List<Long> participantIds;

    private List<CustomSplitItem> customSplits;

    public static class CustomSplitItem {
        private Long userId;
        private BigDecimal amountOwed;

        public CustomSplitItem() {}

        public CustomSplitItem(Long userId, BigDecimal amountOwed) {
            this.userId = userId;
            this.amountOwed = amountOwed;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public BigDecimal getAmountOwed() { return amountOwed; }
        public void setAmountOwed(BigDecimal amountOwed) { this.amountOwed = amountOwed; }
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Long getPayerId() { return payerId; }
    public void setPayerId(Long payerId) { this.payerId = payerId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public boolean isEqualSplit() { return equalSplit; }
    public void setEqualSplit(boolean equalSplit) { this.equalSplit = equalSplit; }
    public String getCategory() { return category != null ? category : "Other"; }
    public void setCategory(String category) { this.category = category; }
    public String getSplitMethod() { return splitMethod != null ? splitMethod : (equalSplit ? "EQUAL" : "CUSTOM"); }
    public void setSplitMethod(String splitMethod) { this.splitMethod = splitMethod; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public List<Long> getParticipantIds() { return participantIds; }
    public void setParticipantIds(List<Long> participantIds) { this.participantIds = participantIds; }
    public List<CustomSplitItem> getCustomSplits() { return customSplits; }
    public void setCustomSplits(List<CustomSplitItem> customSplits) { this.customSplits = customSplits; }
}
