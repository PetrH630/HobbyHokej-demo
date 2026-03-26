package cz.phsoft.hokej.notifications.messaging.publisher;

import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publisher pro odesílání delivery jobů do RabbitMQ.
 *
 * Chyby se pouze logují. Business vrstva se kvůli notifikaci nesmí rozbít.
 */
@Component
public class RabbitNotificationDeliveryPublisher implements NotificationDeliveryPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitNotificationDeliveryPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchange;
    private final String emailRoutingKey;
    private final String smsRoutingKey;

    public RabbitNotificationDeliveryPublisher(
            RabbitTemplate rabbitTemplate,
            @Value("${app.rabbitmq.notification.exchange}") String exchange,
            @Value("${app.rabbitmq.notification.email-routing-key}") String emailRoutingKey,
            @Value("${app.rabbitmq.notification.sms-routing-key}") String smsRoutingKey) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchange = exchange;
        this.emailRoutingKey = emailRoutingKey;
        this.smsRoutingKey = smsRoutingKey;
    }

    @Override
    public void publishEmail(EmailNotificationMessage message) {
        try {
            rabbitTemplate.convertAndSend(exchange, emailRoutingKey, message);
        } catch (Exception ex) {
            log.error("Nepodařilo se publikovat email notification messageId={}", message.messageId(), ex);
        }
    }

    @Override
    public void publishSms(SmsNotificationMessage message) {
        try {
            rabbitTemplate.convertAndSend(exchange, smsRoutingKey, message);
        } catch (Exception ex) {
            log.error("Nepodařilo se publikovat sms notification messageId={}", message.messageId(), ex);
        }
    }
}