package com.shop.sales.repository;

import com.shop.sales.enumuration.Role;
import com.shop.sales.model.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findAllByOrderByFullName();
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    long countByRoleAndActiveTrue(Role role);
}
