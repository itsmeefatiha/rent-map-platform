package com.app.rentmap.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DatabaseMigrationConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void executeMigration() {
        try {
            // Check if rental_period column exists
            String checkColumnSql = "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_name = 'properties' AND column_name = 'rental_period'";
            
            Integer count = jdbcTemplate.queryForObject(checkColumnSql, Integer.class);
            
            if (count == null || count == 0) {
                log.info("Column 'rental_period' does not exist. Adding it to properties table...");
                
                // Add the column
                String addColumnSql = "ALTER TABLE properties ADD COLUMN rental_period VARCHAR(50) DEFAULT 'MONTH'";
                jdbcTemplate.execute(addColumnSql);
                
                // Update existing rows
                String updateSql = "UPDATE properties SET rental_period = 'MONTH' WHERE rental_period IS NULL";
                jdbcTemplate.update(updateSql);
                
                log.info("Successfully added 'rental_period' column to properties table");
            } else {
                log.debug("Column 'rental_period' already exists in properties table");
            }
        } catch (Exception e) {
            log.error("Error executing database migration: {}", e.getMessage(), e);
            // Don't throw exception to allow application to start even if migration fails
            // The user can manually run the SQL script if needed
        }
    }
}

