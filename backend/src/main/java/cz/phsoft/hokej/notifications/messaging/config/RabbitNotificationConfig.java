package cz.phsoft.hokej.notifications.messaging.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Konfigurace RabbitMQ pro notifikační delivery.
 *
 * Definují se zde exchange, queue, DLQ a JSON converter.
 */
@Configuration
public class RabbitNotificationConfig {

    @Bean
    public TopicExchange notificationExchange(
            @Value("${app.rabbitmq.notification.exchange}") String exchangeName) {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue emailQueue(@Value("${app.rabbitmq.notification.email-queue}") String queueName) {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Queue smsQueue(@Value("${app.rabbitmq.notification.sms-queue}") String queueName) {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Queue emailDlq(@Value("${app.rabbitmq.notification.email-dlq}") String queueName) {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Queue smsDlq(@Value("${app.rabbitmq.notification.sms-dlq}") String queueName) {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Binding emailBinding(
            Queue emailQueue,
            TopicExchange notificationExchange,
            @Value("${app.rabbitmq.notification.email-routing-key}") String routingKey) {
        return BindingBuilder.bind(emailQueue).to(notificationExchange).with(routingKey);
    }

    @Bean
    public Binding smsBinding(
            Queue smsQueue,
            TopicExchange notificationExchange,
            @Value("${app.rabbitmq.notification.sms-routing-key}") String routingKey) {
        return BindingBuilder.bind(smsQueue).to(notificationExchange).with(routingKey);
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}