package com.app.rentmap.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    private static final String UPLOAD_DIR = "uploads";
    private final Path rootLocation;

    public FileStorageService() {
        this.rootLocation = Paths.get(System.getProperty("user.dir"), UPLOAD_DIR);
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Cannot store empty file");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = UUID.randomUUID().toString() + extension;
            Path destinationFile = rootLocation.resolve(Paths.get(filename))
                    .normalize().toAbsolutePath();

            if (!destinationFile.getParent().equals(rootLocation.toAbsolutePath())) {
                throw new RuntimeException("Cannot store file outside current directory");
            }

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public void deleteFile(String filename) {
        try {
            if (filename != null && filename.startsWith("/uploads/")) {
                String filePath = filename.substring("/uploads/".length());
                Path file = rootLocation.resolve(filePath).normalize().toAbsolutePath();
                if (file.getParent().equals(rootLocation.toAbsolutePath())) {
                    Files.deleteIfExists(file);
                }
            }
        } catch (IOException e) {
            // Log error but don't throw
            System.err.println("Failed to delete file: " + filename);
        }
    }
}



