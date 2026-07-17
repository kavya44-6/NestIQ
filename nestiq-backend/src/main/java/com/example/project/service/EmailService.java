package com.example.project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@nestiq.com}")
    private String fromAddress;

    private String buildHtml(String bodyText, String ctaText, String ctaLink) {
        return "<html><body style=\"font-family:Arial,sans-serif;\n" +
                "max-width:600px;margin:auto;padding:20px;\">\n" +
                "<h2 style=\"color:#2d6a4f;\">NestIQ</h2>\n" +
                "<p style=\"color:#555;\">Smart Real Estate Management</p>\n" +
                "<hr/>\n" +
                "<p>" + bodyText + "</p>\n" +
                "<br/>\n" +
                "<a href=\"" + ctaLink + "\" \n" +
                "style=\"background:#2d6a4f;color:white;padding:12px 24px;\n" +
                "text-decoration:none;border-radius:6px;\">" + ctaText + "</a>\n" +
                "<br/><br/>\n" +
                "<hr/>\n" +
                "<p style=\"font-size:12px;color:#999;\">\n" +
                "This is an automated message from NestIQ. Do not reply.\n" +
                "</p>\n" +
                "</body></html>";
    }

    @Async
    public void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("=== Email Sending Failed ===");
            e.printStackTrace();
        }
    }

    public void sendRegistrationOtp(String toEmail, String otp) {
        System.out.println("\n**************************************************");
        System.out.println("  [NESTIQ REGISTRATION OTP]");
        System.out.println("  To:   " + toEmail);
        System.out.println("  OTP:  " + otp);
        System.out.println("**************************************************\n");

        String bodyText = "Welcome to NestIQ.<br/><br/>" +
                "Your verification code is:<br/>" +
                "<h2>" + otp + "</h2>" +
                "This OTP is valid for 5 minutes.<br/><br/>" +
                "If you did not request this registration, ignore this email.";
        String html = buildHtml(bodyText, "Verify Now", "http://localhost:5173/customer/register");
        send(toEmail, "NestIQ Email Verification", html);
    }

    public void sendInquiryConfirmationToCustomer(
        String customerEmail, String customerName, 
        String propertyTitle, String propertyCity, 
        String agentOrOwnerName, String message) {
        
        String body = String.format("Dear %s, your inquiry has been sent to %s for the property %s in %s. Your message: %s. You will receive a reply within 24 hours.",
            customerName, agentOrOwnerName, propertyTitle, propertyCity, message);
        String html = buildHtml(body, "View My Inquiries", "http://localhost:5173/customer/inquiries");
        send(customerEmail, "Inquiry Sent – " + propertyTitle, html);
    }

    public void sendInquiryAlertToAgent(
        String agentEmail, String agentName,
        String customerName, String propertyTitle,
        String propertyCity, String message) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "A customer has submitted an inquiry for your property:<br/><br/>" +
            "<strong>Property:</strong><br/>%s<br/><br/>" +
            "<strong>Customer:</strong><br/>%s<br/><br/>" +
            "<strong>Message:</strong><br/>%s<br/><br/>" +
            "Please log in to NestIQ to respond.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            agentName, propertyTitle, customerName, message);
        String html = buildHtml(body, "Respond Now", "http://localhost:5173/agent/inquiries");
        send(agentEmail, "New Property Inquiry Received", html);
    }

    public void sendInquiryAlertToOwner(
        String ownerEmail, String ownerName,
        String customerName, String propertyTitle,
        String propertyCity, String message) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "A customer has submitted an inquiry for your property:<br/><br/>" +
            "<strong>Property:</strong><br/>%s<br/><br/>" +
            "<strong>Customer:</strong><br/>%s<br/><br/>" +
            "<strong>Message:</strong><br/>%s<br/><br/>" +
            "Please log in to NestIQ to respond.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            ownerName, propertyTitle, customerName, message);
        String html = buildHtml(body, "View Inquiry", "http://localhost:5173/owner/inquiries");
        send(ownerEmail, "New Property Inquiry Received", html);
    }

    public void sendInquiryReplyToCustomer(
        String customerEmail, String customerName,
        String propertyTitle, String replierName,
        String replyText) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "Your inquiry for:<br/><br/>" +
            "<strong>%s</strong><br/><br/>" +
            "has received a response.<br/><br/>" +
            "<strong>Response:</strong><br/>%s<br/><br/>" +
            "Please log in to NestIQ for more details.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            customerName, propertyTitle, replyText);
        String html = buildHtml(body, "View Reply", "http://localhost:5173/customer/inquiries");
        send(customerEmail, "Response to Your Property Inquiry", html);
    }

    public void sendVisitConfirmationToCustomer(
        String customerEmail, String customerName,
        String propertyTitle, String propertyCity,
        String visitDate, String timeSlot,
        String agentOrOwnerName, String agentOrOwnerPhone) {
        
        String body = String.format("Dear %s, your site visit is confirmed. Property: %s, %s. Date: %s. Time: %s. Contact: %s – %s.",
            customerName, propertyTitle, propertyCity, visitDate, timeSlot, agentOrOwnerName, agentOrOwnerPhone);
        String html = buildHtml(body, "View My Visits", "http://localhost:5173/customer/visits");
        send(customerEmail, "Visit Confirmed – " + propertyTitle, html);
    }

    public void sendVisitAlertToAgent(
        String agentEmail, String agentName,
        String customerName, String propertyTitle,
        String visitDate, String timeSlot) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "A customer has submitted a site visit request for your property:<br/><br/>" +
            "<strong>Property:</strong> %s<br/>" +
            "<strong>Customer:</strong> %s<br/>" +
            "<strong>Date:</strong> %s<br/>" +
            "<strong>Time Slot:</strong> %s<br/><br/>" +
            "Please log in to NestIQ to manage this visit.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            agentName, propertyTitle, customerName, visitDate, timeSlot);
        String html = buildHtml(body, "Manage Visits", "http://localhost:5173/agent/visits");
        send(agentEmail, "New Property Visit Request", html);
    }

    public void sendVisitAlertToOwner(
        String ownerEmail, String ownerName,
        String customerName, String propertyTitle,
        String visitDate, String timeSlot) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "A customer has submitted a site visit request for your property:<br/><br/>" +
            "<strong>Property:</strong> %s<br/>" +
            "<strong>Customer:</strong> %s<br/>" +
            "<strong>Date:</strong> %s<br/>" +
            "<strong>Time Slot:</strong> %s<br/><br/>" +
            "Please log in to NestIQ to manage this visit.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            ownerName, propertyTitle, customerName, visitDate, timeSlot);
        String html = buildHtml(body, "View Visits", "http://localhost:5173/owner/visits");
        send(ownerEmail, "New Property Visit Request", html);
    }

    public void sendVisitStatusToCustomer(
        String customerEmail, String customerName,
        String propertyTitle, String newStatus,
        String visitDate) {
        
        String body = String.format("Hello %s,<br/><br/>" +
            "Your visit request for:<br/><br/>" +
            "<strong>Property:</strong> %s<br/>" +
            "<strong>Scheduled for:</strong> %s<br/><br/>" +
            "has been %s.<br/><br/>" +
            "Please log in to NestIQ for more details.<br/><br/>" +
            "Regards,<br/>NestIQ Team",
            customerName, propertyTitle, visitDate, newStatus.toUpperCase());
        String html = buildHtml(body, "View My Visits", "http://localhost:5173/customer/visits");
        send(customerEmail, "Visit Request Update", html);
    }

    public void sendVisitCancelledToAgent(
        String agentEmail, String agentName,
        String customerName, String propertyTitle,
        String visitDate) {
        
        String body = String.format("Dear %s, %s has cancelled their visit to %s scheduled for %s.",
            agentName, customerName, propertyTitle, visitDate);
        String html = buildHtml(body, "View Visits", "http://localhost:5173/agent/visits");
        send(agentEmail, "Visit Cancelled – " + propertyTitle, html);
    }

    public void sendPropertyListedToOwner(
        String ownerEmail, String ownerName,
        String propertyTitle, String propertyCity,
        String agentRequestStatus) {
        
        String body = String.format("Dear %s, your property %s in %s has been successfully listed on NestIQ. ",
            ownerName, propertyTitle, propertyCity);
        if ("OPEN".equals(agentRequestStatus)) {
            body += "Your request for an agent is live. Agents can now view and accept your listing.";
        } else if ("SELF_SELL".equals(agentRequestStatus)) {
            body += "You have chosen to manage this property yourself. Inquiries will be sent directly to you.";
        }
        String html = buildHtml(body, "View My Properties", "http://localhost:5173/owner/properties");
        send(ownerEmail, "Property Listed – " + propertyTitle, html);
    }

    public void sendAgentAssignedToOwner(
        String ownerEmail, String ownerName,
        String propertyTitle, String agentName,
        String agentPhone, String agentEmail) {
        
        String body = String.format("Dear %s, an agent has accepted to manage your property %s. Agent Details: Name: %s, Phone: %s, Email: %s.",
            ownerName, propertyTitle, agentName, agentPhone, agentEmail);
        String html = buildHtml(body, "View Property", "http://localhost:5173/owner/properties");
        send(ownerEmail, "Agent Assigned – " + propertyTitle, html);
    }

    public void sendAssignmentConfirmedToAgent(
        String agentEmail, String agentName,
        String propertyTitle, String propertyCity,
        String ownerName, String ownerPhone) {
        
        String body = String.format("Dear %s, you have been successfully assigned to manage %s in %s. Owner Details: Name: %s, Phone: %s.",
            agentName, propertyTitle, propertyCity, ownerName, ownerPhone);
        String html = buildHtml(body, "View Properties", "http://localhost:5173/agent/properties");
        send(agentEmail, "Assignment Confirmed – " + propertyTitle, html);
    }

    public void sendOwnerMessageAlertToOwner(
        String ownerEmail, String ownerName,
        String agentName, String propertyTitle,
        String messagePreview) {
        
        String body = String.format("Dear %s, your agent %s sent you a message about %s: %s.",
            ownerName, agentName, propertyTitle, messagePreview);
        String html = buildHtml(body, "Reply Now", "http://localhost:5173/owner/messages");
        send(ownerEmail, "New Message from Your Agent – " + propertyTitle, html);
    }

    public void sendOwnerReplyAlertToAgent(
        String agentEmail, String agentName,
        String ownerName, String propertyTitle,
        String replyPreview) {
        
        String body = String.format("Dear %s, the owner %s replied to your message about %s: %s.",
            agentName, ownerName, propertyTitle, replyPreview);
        String html = buildHtml(body, "View Reply", "http://localhost:5173/agent/messages");
        send(agentEmail, "Owner Replied – " + propertyTitle, html);
    }
}
