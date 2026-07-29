package com.bugflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import java.io.File;
import java.nio.file.Files;

@SpringBootApplication
@EnableCaching
public class BugFlowApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(BugFlowApplication.class, args);
    }

    private static void loadDotEnv() {
        try {
            // Check both current directory and parent directory for .env file
            File file = new File(".env");
            if (!file.exists()) {
                file = new File("../.env");
            }

            if (file.exists()) {
                Files.lines(file.toPath())
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
                        .forEach(line -> {
                            int index = line.indexOf('=');
                            String key = line.substring(0, index).trim();
                            String value = line.substring(index + 1).trim();
                            // Strip surrounding quotes
                            if (value.startsWith("\"") && value.endsWith("\"")) {
                                value = value.substring(1, value.length() - 1);
                            } else if (value.startsWith("'") && value.endsWith("'")) {
                                value = value.substring(1, value.length() - 1);
                            }
                            System.setProperty(key, value);
                        });
                System.out.println("Successfully loaded environment variables from " + file.getAbsolutePath());
            } else {
                System.out.println("No .env file found. Proceeding with system environment variables.");
            }
        } catch (Exception e) {
            System.err.println("Failed to load .env file: " + e.getMessage());
        }
    }
}
