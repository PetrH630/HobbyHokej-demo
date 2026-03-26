package cz.phsoft.hokej.notifications.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Implementace EmailService pro odesílání e-mailů přes SMTP server.
 *
 * Třída poskytuje dvě varianty odeslání:
 * - best-effort metody používané business vrstvou,
 * - metody propagující chybu používané RabbitMQ consumery.
 */
@Service
public class EmailWedosService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailWedosService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String fromEmail;

    @Value("${email.enabled:true}")
    private boolean emailEnabled;

    public EmailWedosService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            sendSimpleEmailOrThrow(to, subject, text);
        } catch (Exception e) {
            log.error("Chyba při odesílání emailu na {}: {}", to, e.getMessage(), e);
        }
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            sendHtmlEmailOrThrow(to, subject, htmlContent);
        } catch (Exception e) {
            log.error("Chyba při odesílání HTML emailu na {}: {}", to, e.getMessage(), e);
        }
    }

    @Override
    public void sendSimpleEmailOrThrow(String to, String subject, String text) {
        if (!emailEnabled) {
            log.info("Email je vypnutý – zpráva nebyla odeslána na {}", to);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom(fromEmail);
        mailSender.send(message);
        log.debug("Textový email byl odeslán na {}", to);
    }

    @Override
    public void sendHtmlEmailOrThrow(String to, String subject, String htmlContent) {
        if (!emailEnabled) {
            log.info("Email je vypnutý – HTML zpráva nebyla odeslána na {}", to);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom(fromEmail);
            mailSender.send(mimeMessage);
            log.debug("HTML email byl odeslán na {}", to);
        } catch (MessagingException e) {
            throw new IllegalStateException("Nepodařilo se vytvořit HTML email pro příjemce " + to, e);
        }
    }

    @Override
    public void sendActivationEmail(String to, String greetings, String activationLink) {
        String subject = "Potvrzení registrace – Hokej Hobby Hokej";
        String text =
                "Dobrý den, " + greetings + "\n\n" +
                        "Pro aktivaci účtu klikněte na následující odkaz:\n" +
                        activationLink + "\n\n" +
                        "Platnost odkazu je 24 hodin.";

        sendSimpleEmail(to, subject, text);
    }

    @Override
    public void sendActivationEmailHTML(String to, String greetings, String activationLink) {
        String subject = "Potvrzení registrace – Hokej Hobby Hokej";
        String html =
                "<p>Dobrý den,</p>" +
                        "<p>" + greetings + "</p>" +
                        "<p>Pro aktivaci účtu klikněte na následující odkaz:</p>" +
                        "<a href=\"" + activationLink + "\">Aktivovat účet</a>";

        sendHtmlEmail(to, subject, html);
    }

    @Override
    public void sendSuccesActivationEmail(String to, String greetings) {
        String subject = "Účet byl aktivován – Hokej Hobby Hokej";
        String text =
                "Dobrý den, " + greetings + "\n\n" +
                        "Váš účet byl úspěšně aktivován.";

        sendSimpleEmail(to, subject, text);
    }

    @Override
    public void sendSuccesActivationEmailHTML(String to, String greetings) {
        String subject = "Účet byl aktivován – Hokej Hobby Hokej";
        String html =
                "<p>Dobrý den,</p>" +
                        "<p>" + greetings + "</p>" +
                        "<p>Váš účet byl úspěšně aktivován.</p>";

        sendHtmlEmail(to, subject, html);
    }
}
