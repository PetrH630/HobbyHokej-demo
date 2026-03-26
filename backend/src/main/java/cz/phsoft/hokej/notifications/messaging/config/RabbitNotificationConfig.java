package cz.phsoft.hokej.notifications.messaging.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Konfigurace RabbitMQ pro notifikační delivery.
 */
@Configuration
public class RabbitNotificationConfig {

    @Bean
    public TopicExchange notificationExchange(
            @Value("${app.rabbitmq.notification.exchange}") String exchangeName) {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public DirectExchange notificationDlx(
            @Value("${app.rabbitmq.notification.dlx:hobbyhokej.notifications.dlx}") String dlxName) {
        return new DirectExchange(dlxName);
    }

    @Bean
    public Queue emailQueue(
            @Value("${app.rabbitmq.notification.email-queue}") String queueName,
            @Value("${app.rabbitmq.notification.dlx:hobbyhokej.notifications.dlx}") String dlxName) {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", dlxName)
                .withArgument("x-dead-letter-routing-key", "notification.email.dlq")
                .build();
    }

    @Bean
    public Queue smsQueue(
            @Value("${app.rabbitmq.notification.sms-queue}") String queueName,
            @Value("${app.rabbitmq.notification.dlx:hobbyhokej.notifications.dlx}") String dlxName) {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", dlxName)
                .withArgument("x-dead-letter-routing-key", "notification.sms.dlq")
                .build();
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
            @Qualifier("emailQueue") Queue emailQueue,
            TopicExchange notificationExchange,
            @Value("${app.rabbitmq.notification.email-routing-key}") String routingKey) {
        return BindingBuilder.bind(emailQueue).to(notificationExchange).with(routingKey);
    }

    @Bean
    public Binding smsBinding(
            @Qualifier("smsQueue") Queue smsQueue,
            TopicExchange notificationExchange,
            @Value("${app.rabbitmq.notification.sms-routing-key}") String routingKey) {
        return BindingBuilder.bind(smsQueue).to(notificationExchange).with(routingKey);
    }

    @Bean
    public Binding emailDlqBinding(
            @Qualifier("emailDlq") Queue emailDlq,
            DirectExchange notificationDlx) {
        return BindingBuilder.bind(emailDlq).to(notificationDlx).with("notification.email.dlq");
    }

    @Bean
    public Binding smsDlqBinding(
            @Qualifier("smsDlq") Queue smsDlq,
            DirectExchange notificationDlx) {
        return BindingBuilder.bind(smsDlq).to(notificationDlx).with("notification.sms.dlq");
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
