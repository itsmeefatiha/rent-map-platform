package com.app.rentmap.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Réinitialisation de votre mot de passe - Rent Map Platform");
            
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
            
            String emailBody = "Bonjour,\n\n" +
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                    "Cliquez sur le lien suivant pour réinitialiser votre mot de passe :\n" +
                    resetLink + "\n\n" +
                    "Ce lien est valide pendant 24 heures.\n\n" +
                    "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\n" +
                    "Cordialement,\n" +
                    "L'équipe Rent Map Platform";
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email de réinitialisation: " + e.getMessage());
            e.printStackTrace();
            // Ne pas propager l'erreur pour éviter l'énumération d'emails
        }
    }
}


