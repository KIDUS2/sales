package com.shop.sales.model;

import com.shop.sales.enumuration.Role;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "users") @Getter @Setter
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String fullName;
    private String phone;                 // stored as +2519XXXXXXXX
    private String email;                 // optional
    private String passwordHash;          // BCrypt, never the real password
    @Enumerated(EnumType.STRING)
    private Role role = Role.CASHIER;
    private boolean active = true;
    private Instant createdAt = Instant.now();
}
