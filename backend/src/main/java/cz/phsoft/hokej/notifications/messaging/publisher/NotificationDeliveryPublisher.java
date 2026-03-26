package cz.phsoft.hokej.notifications.messaging.publisher;

import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;

public interface NotificationDeliveryPublisher {

    void publishEmail(EmailNotificationMessage message);

    void publishSms(SmsNotificationMessage message);
}