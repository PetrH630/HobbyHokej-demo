package cz.phsoft.hokej.notifications.enums;

/**
 * Stav doručení externí notifikace. - pro RabbitMQ
 *
 * Používá se pro evidenci životního cyklu e-mailového nebo SMS delivery pokusu.
 */
public enum NotificationDeliveryStatus {

    /**
     * Delivery záznam byl vytvořen a čeká na zpracování consumerem.
     */
    PENDING,

    /**
     * Delivery bylo úspěšně zpracováno.
     */
    SENT,

    /**
     * Delivery bylo zpracováno neúspěšně.
     */
    FAILED
}