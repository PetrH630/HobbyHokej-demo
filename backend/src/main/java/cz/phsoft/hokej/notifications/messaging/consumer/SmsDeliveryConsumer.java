package cz.phsoft.hokej.notifications.messaging.consumer;

import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;
import cz.phsoft.hokej.notifications.services.DemoNotificationStore;
import cz.phsoft.hokej.notifications.services.NotificationDeliveryService;
import cz.phsoft.hokej.notifications.sms.SmsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumer zajišťující finální zpracování SMS delivery jobů.
 */
@Component
public class SmsDeliveryConsumer {

    private static final Logger log = LoggerFactory.getLogger(SmsDeliveryConsumer.class);

    private final SmsService smsService;
    private final DemoNotificationStore demoNotificationStore;
    private final NotificationDeliveryService notificationDeliveryService;

    public SmsDeliveryConsumer(
            SmsService smsService,
            DemoNotificationStore demoNotificationStore,
            NotificationDeliveryService notificationDeliveryService) {
        this.smsService = smsService;
        this.demoNotificationStore = demoNotificationStore;
        this.notificationDeliveryService = notificationDeliveryService;
    }

    @RabbitListener(queues = "${app.rabbitmq.notification.sms-queue}")
    public void handle(SmsNotificationMessage message) {
        try {
            notificationDeliveryService.incrementRetryCount(message.messageId());

            if (message.demoMode()) {
                demoNotificationStore.addSms(
                        message.recipientPhone(),
                        message.text(),
                        message.notificationType()
                );
            } else {
                smsService.sendSms(message.recipientPhone(), message.text());
            }

            notificationDeliveryService.markAsSent(message.messageId());

        } catch (Exception ex) {
            log.error("Chyba při zpracování sms delivery messageId={}", message.messageId(), ex);
            notificationDeliveryService.markAsFailed(message.messageId(), ex.getMessage());
            throw ex;
        }
    }
}