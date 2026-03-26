package cz.phsoft.hokej.notifications.entities;

import cz.phsoft.hokej.notifications.enums.NotificationChannel;
import cz.phsoft.hokej.notifications.enums.NotificationDeliveryStatus;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Entita evidující stav doručení externí notifikace.
 *
 * Uchovává se zde samostatně každý e-mailový nebo SMS delivery pokus,
 * aby bylo možné sledovat, zda byla zpráva pouze zařazena,
 * úspěšně odeslána nebo skončila chybou.
 */
@Entity
@Table(name = "notification_delivery")
public class NotificationDeliveryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Jedinečný identifikátor zprávy sdílený mezi publisherem a consumerem.
     */
    @Column(nullable = false, unique = true, length = 36)
    private String messageId;

    /**
     * Kanál, přes který se má notifikace doručit.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    /**
     * Typ notifikace.
     */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "notification_type", nullable = false, length = 64)
    private NotificationType notificationType;

    /**
     * Aktuální stav delivery.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationDeliveryStatus status;

    /**
     * Volitelné vazby na doménové entity.
     */
    private Long userId;
    private Long playerId;
    private Long matchId;
    private Long registrationId;

    /**
     * Cílový příjemce.
     */
    @Column(length = 255)
    private String recipient;

    /**
     * Předmět zprávy. Používá se jen pro e-mail.
     */
    @Column(length = 255)
    private String subject;

    /**
     * Krátký náhled payloadu pro audit a debugging.
     */
    @Column(length = 1000)
    private String payloadPreview;

    /**
     * Příznak, zda jde o demo režim.
     */
    @Column(nullable = false)
    private boolean demoMode;

    /**
     * Chybová zpráva z posledního neúspěšného pokusu.
     */
    @Column(length = 1000)
    private String errorMessage;

    /**
     * Počet pokusů o zpracování.
     */
    @Column(nullable = false)
    private Integer retryCount = 0;

    /**
     * Čas vytvoření delivery záznamu.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Čas úspěšného dokončení delivery.
     */
    private LocalDateTime sentAt;

    public NotificationDeliveryEntity() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public NotificationDeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationDeliveryStatus status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public Long getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Long registrationId) {
        this.registrationId = registrationId;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getPayloadPreview() {
        return payloadPreview;
    }

    public void setPayloadPreview(String payloadPreview) {
        this.payloadPreview = payloadPreview;
    }

    public boolean isDemoMode() {
        return demoMode;
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
}