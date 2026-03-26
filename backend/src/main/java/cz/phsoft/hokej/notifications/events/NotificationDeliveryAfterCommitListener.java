package cz.phsoft.hokej.notifications.events;

import cz.phsoft.hokej.notifications.messaging.publisher.NotificationDeliveryPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listener zajišťující publikaci delivery zpráv do RabbitMQ
 * až po úspěšném commitu databázové transakce.
 *
 * Tím se zamezuje situaci, kdy consumer zpracuje zprávu dříve,
 * než je v databázi definitivně uložen odpovídající PENDING záznam.
 */
@Component
public class NotificationDeliveryAfterCommitListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationDeliveryAfterCommitListener.class);

    private final NotificationDeliveryPublisher notificationDeliveryPublisher;

    public NotificationDeliveryAfterCommitListener(NotificationDeliveryPublisher notificationDeliveryPublisher) {
        this.notificationDeliveryPublisher = notificationDeliveryPublisher;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT,
            fallbackExecution = true
    )
    public void onDeliveryCreated(NotificationDeliveryCreatedEvent event) {
        if (event.isEmail()) {
            log.debug("AFTER_COMMIT/FALLBACK publish EMAIL delivery, messageId={}",
                    event.getEmailMessage().messageId());
            notificationDeliveryPublisher.publishEmail(event.getEmailMessage());
            return;
        }

        if (event.isSms()) {
            log.debug("AFTER_COMMIT/FALLBACK publish SMS delivery, messageId={}",
                    event.getSmsMessage().messageId());
            notificationDeliveryPublisher.publishSms(event.getSmsMessage());
        }
    }
}