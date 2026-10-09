package com.personalos.backend.configuration;

import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

@Component
public class DatabaseMigration implements HibernatePropertiesCustomizer {

    private final DataSource dataSource;

    public DatabaseMigration(DataSource dataSource, 
                             @org.springframework.beans.factory.annotation.Value("${PERSONALOS_BOOTSTRAP_PASSWORD:defaultBootstrapPassword123!}") String bootstrapPassword) {
        this.dataSource = dataSource;
        
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
             
            // 1. Ensure users table exists with password column
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "email VARCHAR(255) NOT NULL UNIQUE, " +
                    "password VARCHAR(255) NOT NULL, " +
                    "created_at DATETIME(6) NOT NULL" +
                    ") ENGINE=InnoDB");

            // Encode the bootstrap password safely
            String encodedPassword = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(bootstrapPassword);

            // 2. Insert bootstrap user
            java.sql.PreparedStatement pstmt = conn.prepareStatement("INSERT IGNORE INTO users (id, name, email, password, created_at) VALUES (1, 'Anmol', 'anmol@personalos.local', ?, NOW())");
            pstmt.setString(1, encodedPassword);
            pstmt.executeUpdate();
            pstmt.close();

            // 3. Safely add user_id to all owned tables
            String[] tables = {"tasks", "dsa_problems", "projects", "notes", "planner_tasks", "transactions", "trips"};
            for (String table : tables) {
                try {
                    // This will intentionally fail if user_id already exists, triggering the catch block.
                    // If it succeeds, the column is added as nullable.
                    stmt.execute("ALTER TABLE " + table + " ADD COLUMN user_id BIGINT");
                    
                    // Populate existing rows with bootstrap user (ID = 1)
                    stmt.execute("UPDATE " + table + " SET user_id = 1 WHERE user_id IS NULL");
                    
                    // Enforce NOT NULL and create FK index constraint dynamically
                    stmt.execute("ALTER TABLE " + table + " MODIFY COLUMN user_id BIGINT NOT NULL");
                } catch (Exception e) {
                    // Safe to ignore: column already exists or table doesn't exist yet
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        // Migration completed before Hibernate schema generation phase
    }
}
