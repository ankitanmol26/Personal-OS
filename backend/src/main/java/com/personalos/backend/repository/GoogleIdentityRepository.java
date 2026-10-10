package com.personalos.backend.repository;

import com.personalos.backend.entity.GoogleIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GoogleIdentityRepository extends JpaRepository<GoogleIdentity, Long> {
    Optional<GoogleIdentity> findByGoogleSub(String googleSub);
    boolean existsByGoogleSub(String googleSub);
}
