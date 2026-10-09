package com.personalos.backend.dto;

import java.math.BigDecimal;

public class MemberBalanceDTO {
    private Long userId;
    private String name;
    private BigDecimal totalPaid;
    private BigDecimal totalShareOwed;
    private BigDecimal netBalance;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }
    public BigDecimal getTotalShareOwed() { return totalShareOwed; }
    public void setTotalShareOwed(BigDecimal totalShareOwed) { this.totalShareOwed = totalShareOwed; }
    public BigDecimal getNetBalance() { return netBalance; }
    public void setNetBalance(BigDecimal netBalance) { this.netBalance = netBalance; }
}
