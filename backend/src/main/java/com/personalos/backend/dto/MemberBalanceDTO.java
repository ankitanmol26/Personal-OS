package com.personalos.backend.dto;

import java.math.BigDecimal;

public class MemberBalanceDTO {
    private Long userId;
    private String name;
    private String email;
    private String avatarUrl;
    private BigDecimal totalContributed;
    private BigDecimal totalPaid;
    private BigDecimal totalShareOwed;
    private BigDecimal netBalance;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public BigDecimal getTotalContributed() { return totalContributed != null ? totalContributed : BigDecimal.ZERO; }
    public void setTotalContributed(BigDecimal totalContributed) { this.totalContributed = totalContributed; }
    public BigDecimal getTotalPaid() { return totalPaid != null ? totalPaid : BigDecimal.ZERO; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }
    public BigDecimal getTotalShareOwed() { return totalShareOwed != null ? totalShareOwed : BigDecimal.ZERO; }
    public void setTotalShareOwed(BigDecimal totalShareOwed) { this.totalShareOwed = totalShareOwed; }
    public BigDecimal getNetBalance() { return netBalance != null ? netBalance : BigDecimal.ZERO; }
    public void setNetBalance(BigDecimal netBalance) { this.netBalance = netBalance; }
}
