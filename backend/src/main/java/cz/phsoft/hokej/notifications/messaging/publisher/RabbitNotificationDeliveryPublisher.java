package cz.phsoft.hokej.notifications.messaging.publisher;

import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;
import cz.phsoft.hokej.notifications.services.NotificationDeliveryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publisher pro odesílání delivery jobů do RabbitMQ.
 *
 * Před publikací se očekává, že v databázi již existuje odpovídající
 * záznam delivery se stavem PENDING.
 *
 * Při selhání publikace se záznam označí jako FAILED, aby nezůstal
 * trvale ve stavu PENDING bez zprávy ve frontě.
 */
@Component
public class RabbitNotificationDeliveryPublisher implements NotificationDeliveryPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitNotificationDeliveryPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final NotificationDeliveryService notificationDeliveryService;
    private final String exchange;
    private final String emailRoutingKey;
    private final String smsRoutingKey;

    public RabbitNotificationDeliveryPublisher(
            RabbitTemplate rabbitTemplate,
            NotificationDeliveryService notificationDeliveryService,
            @Value("${app.rabbitmq.notification.exchange}") String exchange,
            @Value("${app.rabbitmq.notification.email-routing-key}") String emailRoutingKey,
            @Value("${app.rabbitmq.notification.sms-routing-key}") String smsRoutingKey) {
        this.rabbitTemplate = rabbitTemplate;
        this.notificationDeliveryService = notificationDeliveryService;
        this.exchange = exchange;
        this.emailRoutingKey = emailRoutingKey;
        this.smsRoutingKey = smsRoutingKey;
    }

    @Override
    public void publishEmail(EmailNotificationMessage message) {
        publish(
                message.messageId(),
                "EMAIL",
                emailRoutingKey,
                message
        );
    }

    @Override
    public void publishSms(SmsNotificationMessage message) {
        publish(
                message.messageId(),
                "SMS",
                smsRoutingKey,
                message
        );
    }

    /**
     * Provede publikaci zprávy do RabbitMQ.
     *
     * Při selhání se delivery záznam označí jako FAILED.
     *
     * @param messageId identifikátor delivery zprávy
     * @param channel název komunikačního kanálu pro logování
     * @param routingKey routing key cílové fronty
     * @param payload serializovatelný payload zprávy
     */
    private void publish(String messageId, String channel, String routingKey, Object payload) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, payload);

            log.info(
                    "Delivery message byla publikována do RabbitMQ. messageId={}, channel={}, exchange={}, routingKey={}",
                    messageId,
                    channel,
                    exchange,
                    routingKey
            );
        } catch (AmqpException ex) {
            handlePublishFailure(messageId, channel, ex);
        } catch (Exception ex) {
            handlePublishFailure(messageId, channel, ex);
        }
    }

    /**
     * Zpracuje chybu při publikaci zprávy do RabbitMQ.
     *
     * Při chybě se provede pokus o označení delivery záznamu jako FAILED.
     * Pokud selže i tento krok, chyba se pouze zaloguje a původní výjimka
     * se propaguje dál.
     *
     * @param messageId identifikátor delivery zprávy
     * @param channel název komunikačního kanálu pro logování
     * @param ex vyvolaná výjimka
     */
    private void handlePublishFailure(String messageId, String channel, Exception ex) {
        log.error(
                "Nepodařilo se publikovat delivery message do RabbitMQ. messageId={}, channel={}, exchange={}",
                messageId,
                channel,
                exchange,
                ex
        );

        try {
            notificationDeliveryService.markAsFailed(
                    messageId,
                    truncateErrorMessage("Publish failed: " + ex.getMessage())
            );
        } catch (Exception markFailedEx) {
            log.error(
                    "Nepodařilo se označit delivery jako FAILED po chybě publish. messageId={}, channel={}",
                    messageId,
                    channel,
                    markFailedEx
            );
        }

        throw new IllegalStateException(
                "Nepodařilo se publikovat " + channel + " zprávu do RabbitMQ. messageId=" + messageId,
                ex
        );
    }

    /**
     * Zkrátí chybovou zprávu na délku vhodnou pro uložení do databáze.
     *
     * @param message původní chybová zpráva
     * @return zkrácená chybová zpráva
     */
    private String truncateErrorMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Neznámá chyba při publikaci zprávy do RabbitMQ.";
        }

        int maxLength = 1000;
        return message.length() <= maxLength
                ? message
                : message.substring(0, maxLength);
    }
}