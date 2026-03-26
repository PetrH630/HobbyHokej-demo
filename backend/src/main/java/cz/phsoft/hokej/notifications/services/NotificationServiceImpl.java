package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.notifications.email.EmailMessageBuilder;
import cz.phsoft.hokej.notifications.email.EmailService;
import cz.phsoft.hokej.notifications.enums.GlobalNotificationLevel;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.events.NotificationDeliveryCreatedEvent;
import cz.phsoft.hokej.notifications.messaging.dto.EmailNotificationMessage;
import cz.phsoft.hokej.notifications.messaging.dto.SmsNotificationMessage;
import cz.phsoft.hokej.notifications.sms.SmsMessageBuilder;
import cz.phsoft.hokej.notifications.sms.SmsService;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.user.entities.AppUserEntity;
import cz.phsoft.hokej.user.entities.AppUserSettingsEntity;
import cz.phsoft.hokej.user.repositories.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Implementace služby NotificationService.
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final AppUserRepository appUserRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final SmsMessageBuilder smsMessageBuilder;
    private final EmailMessageBuilder emailMessageBuilder;
    private final NotificationPreferencesService notificationPreferencesService;
    private final InAppNotificationService inAppNotificationService;
    private final DemoModeService demoModeService;
    private final DemoNotificationStore demoNotificationStore;
    private final NotificationDeliveryService notificationDeliveryService;
    private final ApplicationEventPublisher applicationEventPublisher;

    private static final Set<NotificationType> MANAGER_COPY_BLACKLIST = EnumSet.of(
            NotificationType.MATCH_CANCELED,
            NotificationType.MATCH_TIME_CHANGED,
            NotificationType.MATCH_UNCANCELED,
            NotificationType.MATCH_REMINDER
    );

    public NotificationServiceImpl(
            AppUserRepository appUserRepository,
            EmailService emailService,
            SmsService smsService,
            SmsMessageBuilder smsMessageBuilder,
            EmailMessageBuilder emailMessageBuilder,
            NotificationPreferencesService notificationPreferencesService,
            DemoModeService demoModeService,
            DemoNotificationStore demoNotificationStore,
            InAppNotificationService inAppNotificationService,
            NotificationDeliveryService notificationDeliveryService,
            ApplicationEventPublisher applicationEventPublisher) {
        this.appUserRepository = appUserRepository;
        this.emailService = emailService;
        this.smsService = smsService;
        this.smsMessageBuilder = smsMessageBuilder;
        this.emailMessageBuilder = emailMessageBuilder;
        this.notificationPreferencesService = notificationPreferencesService;
        this.demoModeService = demoModeService;
        this.demoNotificationStore = demoNotificationStore;
        this.inAppNotificationService = inAppNotificationService;
        this.notificationDeliveryService = notificationDeliveryService;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void notifyPlayer(PlayerEntity player, NotificationType type, Object context) {
        if (player == null) {
            log.warn("notifyPlayer() called with null player for type {}", type);
            return;
        }

        try {
            NotificationDecision decision = notificationPreferencesService.evaluate(player, type);
            log.info("notifyPlayer decision: type={}, playerId={}, sendUserEmail={}, sendPlayerEmail={}, sendSms={}",
                    type, player.getId(),
                    decision.isSendEmailToUser(),
                    decision.isSendEmailToPlayer(),
                    decision.isSendSmsToPlayer());

            String emailTo = null;
            if (decision.isSendEmailToUser() && hasText(decision.getUserEmail())) {
                emailTo = decision.getUserEmail().trim();
            }
            if (decision.isSendEmailToPlayer() && hasText(decision.getPlayerEmail())) {
                String playerEmail = decision.getPlayerEmail().trim();
                if (emailTo == null) {
                    emailTo = playerEmail;
                } else if (!emailTo.equalsIgnoreCase(playerEmail)) {
                    emailTo = emailTo + ", " + playerEmail;
                }
            }

            String smsTo = null;
            if (decision.isSendSmsToPlayer() && hasText(decision.getPlayerPhone())) {
                smsTo = decision.getPlayerPhone().trim();
            }

            try {
                inAppNotificationService.storeForPlayer(player, type, context, emailTo, smsTo);
            } catch (Exception ex) {
                log.error("notifyPlayer: chyba při ukládání in-app notifikace type={} playerId={}", type, player.getId(), ex);
            }

            if (decision.isSendEmailToUser() && hasText(decision.getUserEmail())) {
                sendEmailToUser(decision.getUserEmail().trim(), player, type, context);
            }

            if (decision.isSendEmailToPlayer() && hasText(decision.getPlayerEmail())) {
                sendEmailToPlayer(decision.getPlayerEmail().trim(), player, type, context);
            }

            if (decision.isSendSmsToPlayer() && hasText(decision.getPlayerPhone())) {
                sendSmsToPhone(decision.getPlayerPhone().trim(), player, type, context);
            }

            if (shouldSendManagerCopy(type)) {
                // Záměrně ponecháno bez změny.
                // V aktuálním zdrojovém souboru zde nebyla implementace manažerských kopií.
            } else {
                log.debug("Typ {} je v MANAGER_COPY_BLACKLIST – kopie manažerům se neposílá (notifyPlayer).", type);
            }

            log.debug("notifyPlayer: in-app + e-mail/SMS notifikace zpracována pro type={} playerId={}", type, player.getId());
        } catch (Exception ex) {
            log.error("notifyPlayer: chyba při zpracování notifikace type={} playerId={}", type, player.getId(), ex);
        }
    }

    @Override
    public void notifyUser(AppUserEntity user, NotificationType type, Object context) {
        if (user == null) {
            log.warn("notifyUser() called with null user for type {}", type);
            return;
        }

        String userEmail = user.getEmail();
        String emailTo = hasText(userEmail) ? userEmail.trim() : null;

        try {
            Object effectiveContext = context != null ? context : user;
            inAppNotificationService.storeForUser(user, type, effectiveContext, emailTo);
        } catch (Exception ex) {
            log.error("notifyUser: chyba při ukládání in-app notifikace type={} userId={}", type, user.getId(), ex);
        }

        try {
            Object effectiveContext = context != null ? context : user;
            if (hasText(userEmail)) {
                EmailMessageBuilder.EmailContent content =
                        emailMessageBuilder.buildForUser(type, null, userEmail, effectiveContext);

                if (content != null) {
                    enqueueEmail(
                            userEmail.trim(),
                            "USER",
                            user,
                            null,
                            type,
                            content,
                            effectiveContext
                    );
                } else {
                    log.debug("Typ {} nemá definovanou e-mailovou šablonu pro uživatele (USER), nic se neposílá", type);
                }
            } else {
                log.debug("notifyUser: uživatel {} nemá e-mail, nic se neposílá", user.getId());
            }
        } catch (Exception ex) {
            log.error("notifyUser: chyba při zpracování e-mailů/kopií pro type={} userId={}", type, user.getId(), ex);
        }
    }

    private void sendEmailToManager(AppUserEntity manager, PlayerEntity player, NotificationType type, Object context) {
        if (manager == null || !hasText(manager.getEmail())) {
            log.debug("sendEmailToManager: prázdný manager nebo e-mail, nic se neposílá");
            return;
        }

        String email = manager.getEmail().trim();
        EmailMessageBuilder.EmailContent content = emailMessageBuilder.buildForManager(type, player, manager, context);
        if (content == null) {
            log.debug("Typ {} nemá definovanou e-mailovou šablonu pro manažera, nic se neposílá", type);
            return;
        }

        enqueueEmail(email, "MANAGER", manager, player, type, content, context);
    }

    private void sendEmailToUser(String email, PlayerEntity player, NotificationType type, Object context) {
        if (!hasText(email)) {
            log.debug("sendEmailToUser: prázdný e-mail, nic se neposílá");
            return;
        }

        EmailMessageBuilder.EmailContent content = emailMessageBuilder.buildForUser(type, player, email, context);
        if (content == null) {
            log.debug("Typ {} nemá definovanou e-mailovou šablonu pro uživatele, nic se neposílá", type);
            return;
        }

        AppUserEntity user = player != null ? player.getUser() : null;
        enqueueEmail(email.trim(), "USER", user, player, type, content, context);
    }

    private void sendEmailToPlayer(String email, PlayerEntity player, NotificationType type, Object context) {
        if (!hasText(email)) {
            log.debug("sendEmailToPlayer: prázdný e-mail, nic se neposílá");
            return;
        }

        EmailMessageBuilder.EmailContent content = emailMessageBuilder.buildForPlayer(type, player, email, context);
        if (content == null) {
            log.debug("Typ {} nemá definovanou e-mailovou šablonu pro hráče, nic se neposílá", type);
            return;
        }

        AppUserEntity user = player != null ? player.getUser() : null;
        enqueueEmail(email.trim(), "PLAYER", user, player, type, content, context);
    }

    private void sendSmsToPhone(String phone, PlayerEntity player, NotificationType type, Object context) {
        if (!hasText(phone)) {
            log.debug("sendSmsToPhone: prázdný telefon – SMS se nepošle (player {})", player != null ? player.getId() : null);
            return;
        }

        String msg = smsMessageBuilder.buildForNotification(type, player, context);
        if (!hasText(msg)) {
            log.debug("Typ {} nemá definovanou SMS šablonu nebo chybí context – SMS se neposílá", type);
            return;
        }

        AppUserEntity user = player != null ? player.getUser() : null;
        enqueueSms(phone.trim(), user, player, type, msg, context);
    }

    private void enqueueEmail(String email, String recipientKind, AppUserEntity user, PlayerEntity player,
                              NotificationType type, EmailMessageBuilder.EmailContent content, Object context) {
        String messageId = UUID.randomUUID().toString();
        Long userId = user != null ? user.getId() : null;
        Long playerId = player != null ? player.getId() : null;
        Long matchId = extractMatchId(context);
        Long registrationId = extractRegistrationId(context);
        boolean demoMode = demoModeService.isDemoMode();

        notificationDeliveryService.createPendingEmail(
                messageId,
                type,
                userId,
                playerId,
                matchId,
                registrationId,
                email,
                content.subject(),
                shorten(content.body(), 1000),
                demoMode
        );

        EmailNotificationMessage message = new EmailNotificationMessage(
                messageId,
                type,
                userId,
                playerId,
                matchId,
                registrationId,
                email,
                content.subject(),
                content.body(),
                content.html(),
                demoMode,
                recipientKind,
                LocalDateTime.now()
        );

        applicationEventPublisher.publishEvent(NotificationDeliveryCreatedEvent.forEmail(message));
    }

    private void enqueueSms(String phone, AppUserEntity user, PlayerEntity player, NotificationType type,
                            String text, Object context) {
        String messageId = UUID.randomUUID().toString();
        Long userId = user != null ? user.getId() : null;
        Long playerId = player != null ? player.getId() : null;
        Long matchId = extractMatchId(context);
        Long registrationId = extractRegistrationId(context);
        boolean demoMode = demoModeService.isDemoMode();

        notificationDeliveryService.createPendingSms(
                messageId,
                type,
                userId,
                playerId,
                matchId,
                registrationId,
                phone,
                shorten(text, 1000),
                demoMode
        );

        SmsNotificationMessage message = new SmsNotificationMessage(
                messageId,
                type,
                userId,
                playerId,
                matchId,
                registrationId,
                phone,
                text,
                demoMode,
                LocalDateTime.now()
        );

        applicationEventPublisher.publishEvent(NotificationDeliveryCreatedEvent.forSms(message));
    }

    private Long extractMatchId(Object context) {
        if (context instanceof MatchEntity match) {
            return match.getId();
        }
        if (context instanceof MatchRegistrationEntity registration) {
            return registration.getMatch() != null ? registration.getMatch().getId() : null;
        }
        if (context instanceof NotificationContext notificationContext) {
            MatchEntity match = notificationContext.getMatch();
            if (match != null) {
                return match.getId();
            }
            MatchRegistrationEntity registration = notificationContext.getRegistration();
            return registration != null && registration.getMatch() != null ? registration.getMatch().getId() : null;
        }
        return null;
    }

    private Long extractRegistrationId(Object context) {
        if (context instanceof MatchRegistrationEntity registration) {
            return registration.getId();
        }
        if (context instanceof NotificationContext notificationContext) {
            MatchRegistrationEntity registration = notificationContext.getRegistration();
            return registration != null ? registration.getId() : null;
        }
        return null;
    }

    private String shorten(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private boolean shouldSendManagerCopy(NotificationType type) {
        return !MANAGER_COPY_BLACKLIST.contains(type);
    }

    private boolean isManagerCopyAllowedForManager(NotificationType type, AppUserEntity manager) {
        if (manager == null) {
            return false;
        }

        AppUserSettingsEntity settings = manager.getSettings();
        GlobalNotificationLevel level;

        if (settings == null) {
            level = GlobalNotificationLevel.ALL;
        } else if (settings.getManagerNotificationLevel() != null) {
            level = settings.getManagerNotificationLevel();
        } else if (settings.getGlobalNotificationLevel() != null) {
            level = settings.getGlobalNotificationLevel();
        } else {
            level = GlobalNotificationLevel.ALL;
        }

        return isEnabledForType(type, level);
    }

    private boolean isEnabledForType(NotificationType type, GlobalNotificationLevel level) {
        return switch (level) {
            case NONE -> false;
            case ALL -> true;
            case IMPORTANT_ONLY -> type.isImportant();
        };
    }
}
