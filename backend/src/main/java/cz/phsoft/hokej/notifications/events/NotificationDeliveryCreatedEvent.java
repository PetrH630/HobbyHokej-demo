package cz.phsoft.hokej.notifications.events;

import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;

/**
 * Aplikační event oznamující vytvoření delivery záznamu.
 *
 * Event se publikuje v rámci databázové transakce po vytvoření
 * delivery záznamu se stavem PENDING. Samotná publikace do RabbitMQ
 * se provádí až po úspěšném commitu transakce.
 */
public class NotificationDeliveryCreatedEvent {

    private final EmailNotificationMessage emailMessage;
    private final SmsNotificationMessage smsMessage;

    private NotificationDeliveryCreatedEvent(EmailNotificationMessage emailMessage,
                                             SmsNotificationMessage smsMessage) {
        this.emailMessage = emailMessage;
        this.smsMessage = smsMessage;
    }

    public static NotificationDeliveryCreatedEvent forEmail(EmailNotificationMessage emailMessage) {
        return new NotificationDeliveryCreatedEvent(emailMessage, null);
    }

    public static NotificationDeliveryCreatedEvent forSms(SmsNotificationMessage smsMessage) {
        return new NotificationDeliveryCreatedEvent(null, smsMessage);
    }

    public boolean isEmail() {
        return emailMessage != null;
    }

    public boolean isSms() {
        return smsMessage != null;
    }

    public EmailNotificationMessage getEmailMessage() {
        return emailMessage;
    }

    public SmsNotificationMessage getSmsMessage() {
        return smsMessage;
    }
}