package com.personalos.backend.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;

@Component
public class DatabaseMigration implements HibernatePropertiesCustomizer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigration.class);

    public DatabaseMigration(DataSource dataSource,
                             @Value("${PERSONALOS_BOOTSTRAP_PASSWORD:defaultBootstrapPassword123!}") String bootstrapPassword,
                             @Value("${personalos.migration.auto-ddl.enabled:true}") boolean autoDdlEnabled,
                             @Value("${personalos.migration.bootstrap-user.enabled:false}") boolean bootstrapUserEnabled) {

        if (!autoDdlEnabled) {
            log.info("Startup auto-DDL migration is disabled (personalos.migration.auto-ddl.enabled=false). Schema should be managed via external SQL migration scripts.");
            return;
        }

        log.info("Running local/development startup auto-DDL migration check...");

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure users table exists with password column
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "email VARCHAR(255) NOT NULL UNIQUE, " +
                    "password VARCHAR(255) NULL, " +
                    "created_at DATETIME(6) NOT NULL" +
                    ") ENGINE=InnoDB");

            try {
                stmt.execute("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");
            } catch (Exception e) {
                log.debug("users.password already nullable: {}", e.getMessage());
            }

            try {
                stmt.execute("CREATE TABLE IF NOT EXISTS google_identities (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "user_id BIGINT NOT NULL, " +
                        "google_sub VARCHAR(255) NOT NULL UNIQUE, " +
                        "created_at DATETIME(6) NOT NULL, " +
                        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ") ENGINE=InnoDB");
            } catch (Exception e) {
                log.debug("google_identities table check: {}", e.getMessage());
            }

            // 2. Bootstrap user handling (guarded: NEVER run in production unless explicitly enabled)
            if (bootstrapUserEnabled) {
                log.warn("Bootstrap user creation is ENABLED. Creating default user if absent.");
                String encodedPassword = new BCryptPasswordEncoder().encode(bootstrapPassword);
                try (PreparedStatement pstmt = conn.prepareStatement(
                        "INSERT IGNORE INTO users (id, name, email, password, created_at) VALUES (1, 'Anmol', 'anmol@personalos.local', ?, NOW())")) {
                    pstmt.setString(1, encodedPassword);
                    pstmt.executeUpdate();
                }
            } else {
                log.info("Bootstrap user creation is DISABLED (personalos.migration.bootstrap-user.enabled=false). Skipping default user creation.");
            }

            // 3. Add user_id column to tables if missing
            String[] tables = {"tasks", "dsa_problems", "projects", "notes", "planner_tasks", "transactions", "trips"};
            for (String table : tables) {
                try {
                    stmt.execute("ALTER TABLE " + table + " ADD COLUMN user_id BIGINT");
                    if (bootstrapUserEnabled) {
                        stmt.execute("UPDATE " + table + " SET user_id = 1 WHERE user_id IS NULL");
                        stmt.execute("ALTER TABLE " + table + " MODIFY COLUMN user_id BIGINT NOT NULL");
                    }
                } catch (Exception e) {
                    log.debug("Column user_id in {} check: {}", table, e.getMessage());
                }
            }

            // 4. Create refresh_tokens table if not exists
            try {
                stmt.execute("CREATE TABLE IF NOT EXISTS refresh_tokens (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "token VARCHAR(255) NOT NULL UNIQUE, " +
                        "user_id BIGINT NOT NULL, " +
                        "expiry_date DATETIME(6) NOT NULL, " +
                        "revoked BOOLEAN NOT NULL DEFAULT FALSE, " +
                        "created_at DATETIME(6) NOT NULL, " +
                        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ") ENGINE=InnoDB");
            } catch (Exception e) {
                log.debug("refresh_tokens table check: {}", e.getMessage());
            }

            // 5. Trip extra fields (destination, currency, invite_code, invite_expires_at)
            try { stmt.execute("ALTER TABLE trips ADD COLUMN destination VARCHAR(255) NULL"); } catch (Exception e) { log.debug("trips.destination check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE trips ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'INR'"); } catch (Exception e) { log.debug("trips.currency check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE trips ADD COLUMN invite_code VARCHAR(64) NULL"); } catch (Exception e) { log.debug("trips.invite_code check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE trips ADD COLUMN invite_expires_at DATETIME(6) NULL"); } catch (Exception e) { log.debug("trips.invite_expires_at check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE trips ADD UNIQUE INDEX idx_trip_invite_code (invite_code)"); } catch (Exception e) { log.debug("trips idx_trip_invite_code check: {}", e.getMessage()); }

            // 6. Create trip_contributions table if not exists
            try {
                stmt.execute("CREATE TABLE IF NOT EXISTS trip_contributions (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "trip_id BIGINT NOT NULL, " +
                        "user_id BIGINT NOT NULL, " +
                        "amount DECIMAL(10,2) NOT NULL, " +
                        "currency VARCHAR(10) NOT NULL DEFAULT 'INR', " +
                        "date DATE NOT NULL, " +
                        "note VARCHAR(500) NULL, " +
                        "created_at DATETIME(6) NOT NULL, " +
                        "FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE, " +
                        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ") ENGINE=InnoDB");
            } catch (Exception e) {
                log.debug("trip_contributions table check: {}", e.getMessage());
            }

            // 7. Shared expenses extra fields (category, split_method, note)
            try { stmt.execute("ALTER TABLE shared_expenses ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Other'"); } catch (Exception e) { log.debug("shared_expenses.category check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE shared_expenses ADD COLUMN split_method VARCHAR(20) NOT NULL DEFAULT 'EQUAL'"); } catch (Exception e) { log.debug("shared_expenses.split_method check: {}", e.getMessage()); }
            try { stmt.execute("ALTER TABLE shared_expenses ADD COLUMN note VARCHAR(500) NULL"); } catch (Exception e) { log.debug("shared_expenses.note check: {}", e.getMessage()); }

            log.info("Startup auto-DDL migration check completed successfully.");

        } catch (Exception e) {
            log.error("Database migration check encountered an error: {}", e.getMessage(), e);
        }
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        // Migration completed before Hibernate schema generation phase
    }
}
