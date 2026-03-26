package cz.phsoft.hokej.notifications.messaging.consumer;

import cz.phsoft.hokej.notifications.email.EmailService;
import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.services.DemoNotificationStore;
import cz.phsoft.hokej.notifications.services.NotificationDeliveryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumer zajišťující finální zpracování e-mailových delivery jobů.
 */
@Component
public class EmailDeliveryConsumer {

    private static final Logger log = LoggerFactory.getLogger(EmailDeliveryConsumer.class);

    private final EmailService emailService;
    private final DemoNotificationStore demoNotificationStore;
    private final NotificationDeliveryService notificationDeliveryService;

    public EmailDeliveryConsumer(
            EmailService emailService,
            DemoNotificationStore demoNotificationStore,
            NotificationDeliveryService notificationDeliveryService) {
        this.emailService = emailService;
        this.demoNotificationStore = demoNotificationStore;
        this.notificationDeliveryService = notificationDeliveryService;
    }

    @RabbitListener(queues = "${app.rabbitmq.notification.email-queue}")
    public void handle(EmailNotificationMessage message) {
        try {
            notificationDeliveryService.incrementRetryCount(message.messageId());

            if (message.demoMode()) {
                demoNotificationStore.addEmail(
                        message.recipientEmail(),
                        message.subject(),
                        message.body(),
                        message.html(),
                        message.notificationType(),
                        message.recipientKind()
                );
            } else {
                if (message.html()) {
                    emailService.sendHtmlEmail(message.recipientEmail(), message.subject(), message.body());
                } else {
                    emailService.sendSimpleEmail(message.recipientEmail(), message.subject(), message.body());
                }
            }

            notificationDeliveryService.markAsSent(message.messageId());

        } catch (Exception ex) {
            log.error("Chyba při zpracování email delivery messageId={}", message.messageId(), ex);
            notificationDeliveryService.markAsFailed(message.messageId(), ex.getMessage());
            throw ex;
        }
    }
}