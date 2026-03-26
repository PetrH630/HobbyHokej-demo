package cz.phsoft.hokej.notifications.messaging.constants;

public final class NotificationQueues {

    public static final String EMAIL_QUEUE_PROPERTY = "${app.rabbitmq.notification.email-queue}";
    public static final String SMS_QUEUE_PROPERTY = "${app.rabbitmq.notification.sms-queue}";
    public static final String EMAIL_DLQ_PROPERTY = "${app.rabbitmq.notification.email-dlq}";
    public static final String SMS_DLQ_PROPERTY = "${app.rabbitmq.notification.sms-dlq}";

    private NotificationQueues() {
    }
}